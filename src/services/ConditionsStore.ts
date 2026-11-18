import { supabase } from '../supabase';
import { companyContext } from '../utils/companyContext';
import { packHidden, unpackHidden } from '../utils/hiddenFields';
import {
  ConditionsTemplate,
  getConditionsTemplate,
  getDefaultAcceptanceText,
} from '../constants/ConditionsTemplates';

/**
 * Conditions de location personnalisées — SANS migration SQL.
 *
 * Chaque agence peut ajouter / modifier / supprimer ses conditions (en arabe et
 * en français). Le modèle est rangé, sérialisé en JSON, dans les champs cachés
 * de `companies.description` (même mécanisme que l'identité fiscale, voir
 * utils/hiddenFields). Une copie locale (localStorage) sert de cache et de
 * repli si l'utilisateur n'a pas le droit d'écrire la fiche agence.
 */

export type ConditionsLang = 'ar' | 'fr';
export type ConditionsSet = Record<ConditionsLang, ConditionsTemplate>;

const HIDDEN_KEY = 'print_conditions';
const LOCAL_PREFIX = 'mhd_print_conditions:';

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/** Modèle par défaut (texte intégré à l'application). */
export function defaultConditionsSet(): ConditionsSet {
  const withAcceptance = (lng: ConditionsLang): ConditionsTemplate => ({
    ...clone(getConditionsTemplate(lng)),
    acceptanceText: getDefaultAcceptanceText(lng),
  });
  return { ar: withAcceptance('ar'), fr: withAcceptance('fr') };
}

/** Normalise un objet lu (JSON) en modèle complet, en complétant par défaut. */
function normalize(raw: any): ConditionsSet {
  const def = defaultConditionsSet();
  const out = {} as ConditionsSet;
  for (const lng of ['ar', 'fr'] as const) {
    const r = raw && typeof raw === 'object' ? raw[lng] : null;
    const d = def[lng];
    if (!r || typeof r !== 'object') { out[lng] = d; continue; }
    const str = (v: any, fb: string) => (typeof v === 'string' ? v : fb);
    out[lng] = {
      language: lng,
      title: str(r.title, d.title),
      subtitle: str(r.subtitle, d.subtitle),
      acceptanceText: str(r.acceptanceText, d.acceptanceText || ''),
      clientSignatureLabel: str(r.clientSignatureLabel, d.clientSignatureLabel),
      agencySignatureLabel: str(r.agencySignatureLabel, d.agencySignatureLabel),
      conditions: Array.isArray(r.conditions)
        ? r.conditions
            .filter((c: any) => c && typeof c === 'object')
            .map((c: any) => ({ title: String(c.title ?? ''), content: String(c.content ?? '') }))
        : d.conditions,
    };
  }
  return out;
}

/** Agence dont on lit / écrit les conditions. */
async function targetCompanyId(): Promise<string | null> {
  await companyContext.whenResolved();
  return (
    companyContext.getScopeCompanyId() ||
    companyContext.getWriteCompanyId() ||
    companyContext.getPrimaryCompanyId() ||
    null
  );
}

const localKey = (companyId: string | null) => LOCAL_PREFIX + (companyId || 'default');

function readLocal(companyId: string | null): ConditionsSet | null {
  try {
    const raw = localStorage.getItem(localKey(companyId));
    return raw ? normalize(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeLocal(companyId: string | null, set: ConditionsSet | null) {
  try {
    if (set) localStorage.setItem(localKey(companyId), JSON.stringify(set));
    else localStorage.removeItem(localKey(companyId));
  } catch { /* stockage indisponible */ }
}

export const ConditionsStore = {
  /** Charge les conditions de l'agence connectée (base → cache local → défaut). */
  async load(): Promise<ConditionsSet> {
    const cid = await targetCompanyId();
    if (cid) {
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('description')
          .eq('id', cid)
          .maybeSingle();
        if (!error && data) {
          const { extra } = unpackHidden(data.description);
          if (extra[HIDDEN_KEY]) {
            const set = normalize(JSON.parse(extra[HIDDEN_KEY]));
            writeLocal(cid, set);
            return set;
          }
        }
      } catch { /* repli local */ }
    }
    return readLocal(cid) || defaultConditionsSet();
  },

  /**
   * Enregistre les conditions de l'agence connectée.
   * `null` = revenir au modèle par défaut.
   * Renvoie 'database' si la fiche agence a été mise à jour, sinon 'local'.
   */
  async save(set: ConditionsSet | null): Promise<'database' | 'local'> {
    const cid = await targetCompanyId();
    writeLocal(cid, set ? normalize(set) : null);
    if (!cid) return 'local';
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('description')
        .eq('id', cid)
        .maybeSingle();
      if (error || !data) return 'local';
      const { text, extra } = unpackHidden(data.description);
      const nextExtra = { ...extra };
      if (set) nextExtra[HIDDEN_KEY] = JSON.stringify(normalize(set));
      else delete nextExtra[HIDDEN_KEY];
      const { data: updated, error: upErr } = await supabase
        .from('companies')
        .update({ description: packHidden(text, nextExtra) })
        .eq('id', cid)
        .select('id');
      if (upErr || !updated || updated.length === 0) return 'local';
      return 'database';
    } catch {
      return 'local';
    }
  },
};
