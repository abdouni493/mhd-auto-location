import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, ChevronDown, Check, Layers } from 'lucide-react';
import { Language } from '../types';
import { useCompany } from '../utils/companyProvider';
import { ALL_COMPANIES } from '../utils/companyContext';

/**
 * Sélecteur d'agence active (super-admin uniquement).
 *
 * Permet de basculer entre « Toutes les agences » (vue combinée, comportement
 * d'origine : voit tout) et une agence précise. Le changement recharge la page
 * (via `setActiveCompany`) pour que toutes les vues rechargent leurs données
 * avec le bon périmètre. Un admin d'agence ne voit pas ce composant.
 */
export const CompanySwitcher: React.FC<{ lang: Language }> = ({ lang }) => {
  const { isSuperAdmin, companies, activeCompanyId, allView, setActiveCompany } = useCompany();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Seul le super-admin bascule, et uniquement s'il existe un vrai choix
  // (≥ 2 agences). En configuration mono-agence, la barre reste identique.
  if (!isSuperAdmin || companies.length < 2) return null;

  const activeCompany = companies.find(c => c.id === activeCompanyId);
  const label = allView
    ? (lang === 'fr' ? 'Toutes les agences' : 'كل الوكالات')
    : (activeCompany?.name || (lang === 'fr' ? 'Agence' : 'وكالة'));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl bg-white border border-saas-border hover:border-saas-primary-via transition-all text-[10px] sm:text-xs font-bold text-saas-text-main shadow-sm cursor-pointer max-w-[10rem] sm:max-w-[14rem]"
        title={lang === 'fr' ? "Changer d'agence" : 'تغيير الوكالة'}
      >
        {allView
          ? <Layers size={16} className="text-saas-primary-via shrink-0" />
          : <Building2 size={16} className="text-saas-primary-via shrink-0" />}
        <span className="truncate uppercase tracking-tight">{label}</span>
        <ChevronDown size={14} className={`text-saas-text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 mt-2 w-64 bg-white border border-saas-border rounded-2xl shadow-xl overflow-hidden z-50"
          >
            <div className="px-4 py-2.5 border-b border-saas-border">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-saas-text-muted">
                {lang === 'fr' ? 'Agence active' : 'الوكالة النشطة'}
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto py-1.5">
              {/* Vue combinée « toutes les agences » */}
              <button
                onClick={() => { setOpen(false); setActiveCompany(ALL_COMPANIES); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-saas-bg transition-colors ${allView ? 'bg-saas-primary-via/5' : ''}`}
              >
                <span className="w-8 h-8 rounded-lg bg-saas-primary-via/10 text-saas-primary-via flex items-center justify-center shrink-0">
                  <Layers size={16} />
                </span>
                <span className="flex-1 text-sm font-bold text-saas-text-main">
                  {lang === 'fr' ? 'Toutes les agences' : 'كل الوكالات'}
                </span>
                {allView && <Check size={16} className="text-saas-primary-via shrink-0" />}
              </button>

              {companies.map(c => {
                const selected = !allView && c.id === activeCompanyId;
                return (
                  <button
                    key={c.id}
                    onClick={() => { setOpen(false); setActiveCompany(c.id); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-saas-bg transition-colors ${selected ? 'bg-saas-primary-via/5' : ''}`}
                  >
                    <span className="w-8 h-8 rounded-lg overflow-hidden border border-saas-border bg-saas-bg flex items-center justify-center shrink-0">
                      {c.logo ? (
                        <img src={c.logo} alt={c.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Building2 size={15} className="text-saas-text-muted" />
                      )}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold text-saas-text-main truncate">{c.name}</span>
                      {c.isPrimary && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-saas-primary-via">
                          {lang === 'fr' ? 'Principale' : 'رئيسية'}
                        </span>
                      )}
                    </span>
                    {selected && <Check size={16} className="text-saas-primary-via shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
