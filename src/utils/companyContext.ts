import { Company } from '../types';

/**
 * Contexte « agence active » (multi-agences).
 *
 * Deux besoins cohabitent :
 *  1. La couche service (`DatabaseService`, `ReservationsService`) — des
 *     classes statiques sans accès au contexte React — doit lire de façon
 *     SYNCHRONE l'agence courante pour filtrer/estampiller les requêtes.
 *     → un singleton module (`companyContext`) tenu à jour à la connexion.
 *  2. L'interface (switcher, badges, garde d'accès) doit RÉAGIR au changement.
 *     → un `CompanyProvider` React (voir `companyProvider.tsx`) qui alimente ce
 *        singleton puis expose les mêmes valeurs via un hook.
 *
 * Règle de scoping :
 *  - Admin d'agence (non super-admin) : figé sur SON `company_id`.
 *  - Super-admin : vue « Toutes les agences » par défaut (aucun filtre → voit
 *    tout, comme aujourd'hui, zéro régression), avec possibilité de basculer
 *    sur une agence précise. Ce choix est persistant.
 *
 * ⚠️ On ne touche JAMAIS au concept `agencies` (agences physiques de
 *    départ/retour) : la dimension métier ici est `company`.
 */

/** Valeur sentinelle : vue combinée « toutes les agences » (super-admin). */
export const ALL_COMPANIES = 'all';

const ACTIVE_STORAGE_KEY = 'active_company_id_v1';

interface CompanyState {
  /** Agence de rattachement de l'utilisateur connecté (fixe). */
  userCompanyId: string | null;
  isSuperAdmin: boolean;
  /** Agence principale (is_primary) — héberge les voitures non explicitement liées. */
  primaryCompanyId: string | null;
  /** Vue courante : ALL_COMPANIES ou l'id d'une agence. */
  activeCompanyId: string;
  /** true dès que les infos ont été résolues depuis `app_users`. */
  resolved: boolean;
}

// Défaut SÛR : super-admin + vue « toutes agences » ⇒ aucun filtre appliqué
// tant que la résolution n'a pas eu lieu (l'agence actuelle reste intacte).
const state: CompanyState = {
  userCompanyId: null,
  isSuperAdmin: true,
  primaryCompanyId: null,
  activeCompanyId: ALL_COMPANIES,
  resolved: false,
};

// Snapshot immuable exposé à React (`useSyncExternalStore`). Il DOIT garder la
// même référence tant que l'état ne change pas, sinon React boucle. On le
// remplace uniquement dans `emit()`.
let snapshot: Readonly<CompanyState> = { ...state };

type Listener = () => void;
const listeners = new Set<Listener>();
function emit() {
  snapshot = { ...state };
  listeners.forEach(l => { try { l(); } catch { /* noop */ } });
}

function readPersistedActive(): string | null {
  try { return localStorage.getItem(ACTIVE_STORAGE_KEY); } catch { return null; }
}
function persistActive(value: string) {
  try { localStorage.setItem(ACTIVE_STORAGE_KEY, value); } catch { /* noop */ }
}

export const companyContext = {
  /**
   * Renseigne l'identité de l'utilisateur (après connexion / restauration).
   * Résout ensuite l'agence active : figée pour un admin scoppé, restaurée
   * depuis le stockage pour un super-admin (défaut : toutes les agences).
   */
  setUserInfo(userCompanyId: string | null, isSuperAdmin: boolean) {
    state.userCompanyId = userCompanyId;
    state.isSuperAdmin = isSuperAdmin;
    state.resolved = true;

    if (!isSuperAdmin) {
      // Admin d'agence : toujours limité à sa propre agence.
      state.activeCompanyId = userCompanyId || ALL_COMPANIES;
    } else {
      const persisted = readPersistedActive();
      state.activeCompanyId = persisted || ALL_COMPANIES;
    }
    emit();
  },

  /** Enregistre la liste des agences et en déduit l'agence principale. */
  setCompanies(companies: Company[]) {
    const primary = companies.find(c => c.isPrimary) || companies[0];
    state.primaryCompanyId = primary?.id || state.primaryCompanyId || null;
    // Si la vue active pointe une agence disparue → repli « toutes agences ».
    if (
      state.isSuperAdmin &&
      state.activeCompanyId !== ALL_COMPANIES &&
      companies.length > 0 &&
      !companies.some(c => c.id === state.activeCompanyId)
    ) {
      state.activeCompanyId = ALL_COMPANIES;
      persistActive(ALL_COMPANIES);
    }
    emit();
  },

  /**
   * Change l'agence affichée (super-admin uniquement). Persiste le choix.
   * Le rechargement effectif de la page est déclenché par l'appelant UI
   * (`CompanyProvider.setActiveCompany`) pour garantir des données fraîches.
   */
  setActiveCompanyId(value: string) {
    state.activeCompanyId = value;
    persistActive(value);
    emit();
  },

  /** Réinitialise à la déconnexion. */
  reset() {
    state.userCompanyId = null;
    state.isSuperAdmin = true;
    state.primaryCompanyId = null;
    state.activeCompanyId = ALL_COMPANIES;
    state.resolved = false;
    emit();
  },

  getSnapshot(): Readonly<CompanyState> { return snapshot; },
  getUserCompanyId() { return state.userCompanyId; },
  getIsSuperAdmin() { return state.isSuperAdmin; },
  getPrimaryCompanyId() { return state.primaryCompanyId; },
  getActiveCompanyId() { return state.activeCompanyId; },
  isAllView() { return state.activeCompanyId === ALL_COMPANIES; },

  /**
   * Id d'agence par lequel FILTRER les lectures, ou `null` = aucun filtre.
   * `null` en vue « toutes agences » (super-admin) — comportement d'origine.
   */
  getScopeCompanyId(): string | null {
    return state.activeCompanyId === ALL_COMPANIES ? null : state.activeCompanyId;
  },

  /**
   * Id d'agence à ESTAMPILLER sur les insertions. En vue « toutes agences »,
   * on retombe sur l'agence de l'utilisateur (ou l'agence principale) ; si
   * rien n'est connu, `null` laisse le trigger DB remplir la valeur.
   */
  getWriteCompanyId(): string | null {
    if (state.activeCompanyId !== ALL_COMPANIES) return state.activeCompanyId;
    return state.userCompanyId || state.primaryCompanyId || null;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};

/**
 * Applique le filtre d'agence à une requête Supabase de LECTURE (business data).
 * En vue « toutes agences » (super-admin), la requête est renvoyée inchangée.
 * NE JAMAIS utiliser sur les tables PARTAGÉES (cars, offers, services…) ni sur
 * les vérifications de disponibilité (qui restent globales inter-agences).
 */
export function scopeQuery<T>(query: T): T {
  const cid = companyContext.getScopeCompanyId();
  if (!cid) return query;
  // supabase-js renvoie un builder chaînable ; `.eq` conserve le type.
  return (query as any).eq('company_id', cid) as T;
}
