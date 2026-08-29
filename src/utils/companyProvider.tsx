import React, { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import { Company } from '../types';
import { companyContext, ALL_COMPANIES } from './companyContext';

/**
 * Exposition React du contexte « agence active ».
 *
 * Le singleton `companyContext` reste la source de vérité (lu de façon
 * synchrone par la couche service). Ce provider s'y abonne pour refléter la
 * résolution de l'utilisateur dans l'UI.
 *
 * Il n'existe plus de bascule d'agence : chaque utilisateur travaille dans
 * l'agence de son compte, résolue une fois à la connexion.
 */
interface CompanyContextValue {
  isSuperAdmin: boolean;
  userCompanyId: string | null;
  activeCompanyId: string;
  /** true = aucun filtre d'agence (compte racine sans rattachement). */
  allView: boolean;
  companies: Company[];
}

const Ctx = createContext<CompanyContextValue>({
  isSuperAdmin: true,
  userCompanyId: null,
  activeCompanyId: ALL_COMPANIES,
  allView: true,
  companies: [],
});

export const CompanyProvider: React.FC<{
  companies: Company[];
  children: React.ReactNode;
}> = ({ companies, children }) => {
  // S'abonne au singleton : tout `emit()` déclenche un re-render.
  const snapshot = useSyncExternalStore(
    companyContext.subscribe,
    companyContext.getSnapshot,
    companyContext.getSnapshot,
  );

  const value = useMemo<CompanyContextValue>(() => ({
    isSuperAdmin: snapshot.isSuperAdmin,
    userCompanyId: snapshot.userCompanyId,
    activeCompanyId: snapshot.activeCompanyId,
    allView: snapshot.activeCompanyId === ALL_COMPANIES,
    companies,
  }), [snapshot, companies]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useCompany(): CompanyContextValue {
  return useContext(Ctx);
}
