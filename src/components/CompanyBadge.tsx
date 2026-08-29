import React from 'react';
import { Building2 } from 'lucide-react';
import { Language } from '../types';
import { useCompany } from '../utils/companyProvider';

/**
 * Agence de l'utilisateur connecté — affichage seul.
 *
 * Il n'y a plus de bascule d'agence dans la barre de navigation : chacun voit
 * uniquement l'agence sous laquelle il s'est connecté. Ce badge se contente
 * donc de rappeler ce périmètre, sans aucune interaction.
 */
export const CompanyBadge: React.FC<{ lang: Language }> = ({ lang }) => {
  const { companies, activeCompanyId, userCompanyId } = useCompany();

  // L'agence du compte connecté prime ; `activeCompanyId` sert de repli.
  const company =
    companies.find(c => c.id === userCompanyId) ||
    companies.find(c => c.id === activeCompanyId);

  if (!company) return null;

  return (
    <div
      className="flex items-center gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl bg-white border border-saas-border text-[10px] sm:text-xs font-bold text-saas-text-main shadow-sm max-w-[10rem] sm:max-w-[14rem]"
      title={lang === 'fr' ? 'Votre agence' : 'وكالتك'}
    >
      {company.logo ? (
        <img
          src={company.logo}
          alt={company.name}
          className="w-5 h-5 rounded-md object-cover border border-saas-border shrink-0"
          referrerPolicy="no-referrer"
        />
      ) : (
        <Building2 size={16} className="text-saas-primary-via shrink-0" />
      )}
      <span className="truncate uppercase tracking-tight">{company.name}</span>
    </div>
  );
};
