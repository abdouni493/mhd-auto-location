import React, { useEffect, useRef, useState } from 'react';
import { Building2, AlertTriangle, ChevronDown, Check, Loader2 } from 'lucide-react';
import { Language } from '../types';
import { useCompany } from '../utils/companyProvider';
import { companyContext } from '../utils/companyContext';

/**
 * Agence courante dans la barre de navigation.
 *  - Agence 2 / Agence 3 : affichage seul (elles ne voient que leur agence).
 *  - Admin de l'agence principale : clic → bascule vers une autre agence,
 *    sans se reconnecter (toujours connecté avec son propre compte).
 */
export const CompanyBadge: React.FC<{ lang: Language }> = ({ lang }) => {
  const { companies, activeCompanyId, userCompanyId, scopeKnown } = useCompany();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [open]);

  // Agence actuellement consultée (celle choisie par l'admin principal, sinon la sienne).
  const company =
    companies.find(c => c.id === activeCompanyId) ||
    companies.find(c => c.id === userCompanyId);

  if (!company && companies.length > 1 && !scopeKnown) {
    return (
      <div
        className="flex items-center gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-300 text-[10px] sm:text-xs font-bold text-amber-800 shadow-sm max-w-[10rem] sm:max-w-[16rem]"
        title={lang === 'fr'
          ? "Aucune agence rattachée à ce compte : vous voyez les données de toutes les agences."
          : 'لا توجد وكالة مرتبطة بهذا الحساب: أنت ترى بيانات جميع الوكالات.'}
      >
        <AlertTriangle size={16} className="text-amber-600 shrink-0" />
        <span className="truncate uppercase tracking-tight">
          {lang === 'fr' ? 'Toutes les agences' : 'كل الوكالات'}
        </span>
      </div>
    );
  }

  if (!company) return null;

  const canSwitch = companyContext.canSwitchCompany() && companies.length > 1;
  const viewingOther = canSwitch && company.id !== userCompanyId;

  const logo = (c: typeof company) => c.logo ? (
    <img src={c.logo} alt={c.name} className="w-5 h-5 rounded-md object-cover border border-saas-border shrink-0" referrerPolicy="no-referrer" />
  ) : (
    <Building2 size={16} className="text-saas-primary-via shrink-0" />
  );

  const chipClass = `flex items-center gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl border text-[10px] sm:text-xs font-bold shadow-sm max-w-[10rem] sm:max-w-[14rem] ${
    viewingOther ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-white border-saas-border text-saas-text-main'
  }`;

  if (!canSwitch) {
    return (
      <div className={chipClass} title={lang === 'fr' ? 'Votre agence' : 'وكالتك'}>
        {logo(company)}
        <span className="truncate uppercase tracking-tight">{company.name}</span>
      </div>
    );
  }

  const choose = (id: string) => {
    if (id === company.id) { setOpen(false); return; }
    setSwitching(id);
    companyContext.switchCompany(id);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`${chipClass} cursor-pointer hover:border-saas-primary-via/50 transition-colors`}
        title={lang === 'fr' ? "Changer d'agence" : 'تغيير الوكالة'}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {logo(company)}
        <span className="truncate uppercase tracking-tight">{company.name}</span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-50 mt-2 left-0 min-w-[14rem] max-w-[80vw] bg-white rounded-2xl border border-saas-border shadow-xl p-1.5"
        >
          <p className="px-3 pt-2 pb-1.5 text-[10px] font-black uppercase tracking-widest text-saas-text-muted">
            {lang === 'fr' ? "Basculer vers l'agence" : 'التبديل إلى الوكالة'}
          </p>
          {companies.map(c => {
            const active = c.id === company.id;
            return (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={active}
                disabled={!!switching}
                onClick={() => choose(c.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm font-bold transition-colors cursor-pointer ${
                  active ? 'bg-saas-bg text-saas-text-main' : 'hover:bg-saas-bg text-saas-text-main/80'
                }`}
              >
                {logo(c)}
                <span className="flex-1 min-w-0 truncate">
                  {c.name}
                  {c.id === userCompanyId && (
                    <span className="ml-1.5 text-[10px] font-bold text-saas-text-muted">
                      ({lang === 'fr' ? 'principale' : 'الرئيسية'})
                    </span>
                  )}
                </span>
                {switching === c.id
                  ? <Loader2 size={15} className="animate-spin shrink-0" />
                  : active && <Check size={15} className="text-saas-primary-via shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
