import React, { createContext, useContext, useMemo, useSyncExternalStore, useCallback } from 'react';
import { Company } from '../types';
import { companyContext, ALL_COMPANIES } from './companyContext';

/**
 * Exposition React du contexte « agence active ».
 *
 * Le singleton `companyContext` reste la source de vérité (lu de façon
 * synchrone par la couche service). Ce provider s'y abonne pour refléter les
 * changements dans l'UI, et fournit `setActiveCompany` au switcher.
 *
 * Le changement d'agence provoque un `window.location.reload()` : c'est le
 * moyen le plus sûr de garantir que TOUTES les pages rechargent leurs données
 * avec le nouveau périmètre, sans avoir à câbler la dépendance dans chacune.
 * L'agence courante (super-admin) est persistée, donc conservée au rechargement.
 */
interface CompanyContextValue {
  isSuperAdmin: boolean;
  userCompanyId: string | null;
  activeCompanyId: string;
  /** true = vue combinée « toutes les agences ». */
  allView: boolean;
  companies: Company[];
  /** Change l'agence affichée (super-admin) puis recharge la page. */
  setActiveCompany: (companyId: string) => void;
}

const Ctx = createContext<CompanyContextValue>({
  isSuperAdmin: true,
  userCompanyId: null,
  activeCompanyId: ALL_COMPANIES,
  allView: true,
  companies: [],
  setActiveCompany: () => {},
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

  const setActiveCompany = useCallback((companyId: string) => {
    if (companyId === companyContext.getActiveCompanyId()) return;
    companyContext.setActiveCompanyId(companyId);
    // Rechargement complet : chaque page refait ses requêtes avec le nouveau
    // périmètre. Le choix étant persisté, la vue est conservée.
    window.location.reload();
  }, []);

  const value = useMemo<CompanyContextValue>(() => ({
    isSuperAdmin: snapshot.isSuperAdmin,
    userCompanyId: snapshot.userCompanyId,
    activeCompanyId: snapshot.activeCompanyId,
    allView: snapshot.activeCompanyId === ALL_COMPANIES,
    companies,
    setActiveCompany,
  }), [snapshot, companies, setActiveCompany]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useCompany(): CompanyContextValue {
  return useContext(Ctx);
}
