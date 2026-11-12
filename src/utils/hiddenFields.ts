/**
 * Champs complémentaires stockés SANS migration SQL.
 *
 * Les mentions légales de la facture (RC, NIF, NIS, ART, forme juridique,
 * activité, capital, fax, ville, banque… — Décret 05-468) n'ont pas de colonne
 * dédiée dans la base MHD. Plutôt que d'exiger un script SQL, on les range,
 * sérialisées en JSON, à la fin d'une colonne texte existante, derrière un
 * marqueur invisible :
 *
 *   - `website_settings.description` / `companies.description` → identité
 *     fiscale de l'agence (fournisseur) ;
 *   - `entreprises.address` → informations détaillées du client société.
 *
 * Toute lecture passe par `DatabaseService`, qui « déballe » la valeur : le
 * reste de l'application ne voit jamais le marqueur ni le JSON.
 */

/** Séparateur invisible (U+2063) + balise : ne peut pas être saisi par erreur. */
const MARKER = '⁣⟦mhd-extra⟧';

export type HiddenExtra = Record<string, string>;

/** Sépare le texte visible des champs complémentaires cachés. */
export function unpackHidden(raw: string | null | undefined): { text: string; extra: HiddenExtra } {
  const value = raw ?? '';
  const idx = value.indexOf(MARKER);
  if (idx === -1) return { text: value, extra: {} };
  const text = value.slice(0, idx).replace(/\s+$/, '');
  let extra: HiddenExtra = {};
  try {
    const parsed = JSON.parse(value.slice(idx + MARKER.length));
    if (parsed && typeof parsed === 'object') {
      for (const [k, v] of Object.entries(parsed)) {
        if (v !== null && v !== undefined && String(v).trim() !== '') extra[k] = String(v);
      }
    }
  } catch {
    extra = {};
  }
  return { text, extra };
}

/** Recompose la valeur à stocker : texte visible + champs cachés non vides. */
export function packHidden(text: string | null | undefined, extra: HiddenExtra): string {
  const clean: HiddenExtra = {};
  for (const [k, v] of Object.entries(extra || {})) {
    if (v !== null && v !== undefined && String(v).trim() !== '') clean[k] = String(v).trim();
  }
  const base = (text ?? '').replace(/\s+$/, '');
  if (Object.keys(clean).length === 0) return base;
  return `${base}${MARKER}${JSON.stringify(clean)}`;
}

/** Clés de l'identité fiscale / commerciale de l'agence (fournisseur). */
export const AGENCY_FISCAL_KEYS = [
  'rc', 'nif', 'nis', 'art', 'forme_juridique', 'activite', 'capital',
  'fax', 'email', 'city', 'bank_name',
] as const;

/** Clés complémentaires d'une entreprise cliente. */
export const ENTREPRISE_EXTRA_KEYS = [
  'formeJuridique', 'activite', 'capital', 'city', 'bp', 'fax',
] as const;
