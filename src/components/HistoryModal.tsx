import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Car, Rental, Language } from '../types';
import { X, TrendingUp, Loader2 } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car;
  rentals: Rental[];
  lang: Language;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, car, rentals, lang }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      // Simulate loading rentals data
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [isOpen]);


  if (!isOpen) return null;

  const totalGains = rentals.reduce((sum, r) => sum + r.totalCost, 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-saas-border"
      >
        <div className="p-8 border-b border-saas-border flex items-center justify-between bg-linear-to-r from-saas-primary-start via-saas-primary-via to-saas-primary-end text-white">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              📜 Historique: {car.brand} {car.model}
            </h2>
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1">
              {lang === 'fr' ? 'Historique des locations et gains' : 'تاريخ الإيجارات والأرباح'}
            </p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/20 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-saas-bg">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-saas-primary-via animate-spin" />
            </div>
          )}

          {!isLoading && (
            <>
          {/* Summary Cards - Focus on Gains */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-saas-border flex items-center gap-5 shadow-sm group hover:border-saas-success-start/30 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-saas-success-start/10 flex items-center justify-center text-saas-success-start">
                <TrendingUp size={28} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-saas-text-muted uppercase tracking-widest">Total Gains</p>
                <p className="text-xl font-black text-saas-success-start">{totalGains.toLocaleString()} DZD</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-saas-border flex items-center gap-5 shadow-sm group hover:border-saas-primary-via/30 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-saas-primary-via/10 flex items-center justify-center text-saas-primary-via">
                <span className="text-2xl">🚗</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-saas-text-muted uppercase tracking-widest">Locations Totales</p>
                <p className="text-xl font-black text-saas-text-main">{rentals.length}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-saas-border flex items-center gap-5 shadow-sm group hover:border-saas-primary-start/30 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-saas-primary-start/10 flex items-center justify-center text-saas-primary-start">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-saas-text-muted uppercase tracking-widest">Gain Moyen</p>
                <p className="text-xl font-black text-saas-text-main">
                  {rentals.length > 0 ? Math.round(totalGains / rentals.length).toLocaleString() : 0} DZD
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Locations History */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-saas-primary-via flex items-center gap-3 uppercase tracking-[0.2em]">
              <span className="p-2 bg-saas-primary-via/10 rounded-lg">📍</span>
              Historique des Locations
            </h3>
            <div className="space-y-4">
              {rentals.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-saas-border rounded-3xl text-saas-text-muted italic text-sm bg-white">
                  <span className="text-4xl mb-4 block">🚗</span>
                  Aucune location enregistrée pour ce véhicule.
                </div>
              ) : (
                <div className="grid gap-4">
                  {rentals.map((r, index) => {
                    const startDate = new Date(r.startDate);
                    const endDate = new Date(r.endDate);
                    const daysRented = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                    const dailyRate = Math.round(r.totalCost / daysRented);

                    return (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-6 rounded-3xl border border-saas-border bg-white shadow-sm hover:border-saas-primary-via/30 transition-all hover:shadow-md group"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-saas-primary-via/10 flex items-center justify-center text-saas-primary-via font-bold text-lg">
                              #{index + 1}
                            </div>
                            <div>
                              <p className="text-lg font-black text-saas-text-main uppercase tracking-tighter">
                                {r.clientName}
                              </p>
                              <p className="text-[10px] text-saas-text-muted font-bold uppercase tracking-widest mt-1">
                                {startDate.toLocaleDateString('fr-FR')} - {endDate.toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black text-saas-success-start">
                              +{r.totalCost.toLocaleString()} DZD
                            </p>
                            <p className="text-[10px] text-saas-text-muted font-bold uppercase tracking-widest">
                              {daysRented} jours • {dailyRate.toLocaleString()} DZD/jour
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-saas-border/50">
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-saas-text-muted uppercase tracking-widest">Statut</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide mt-1 ${
                              r.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : r.status === 'active'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {r.status === 'completed' ? 'Terminée' :
                               r.status === 'active' ? 'Active' :
                               r.status === 'cancelled' ? 'Annulée' : r.status}
                            </span>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-saas-text-muted uppercase tracking-widest">Durée</p>
                            <p className="text-sm font-black text-saas-text-main mt-1">{daysRented} jours</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-saas-text-muted uppercase tracking-widest">Gain</p>
                            <p className="text-sm font-black text-saas-success-start mt-1">+{r.totalCost.toLocaleString()}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Monthly Gains Summary */}
          {rentals.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xs font-black text-saas-secondary-via flex items-center gap-3 uppercase tracking-[0.2em]">
                <span className="p-2 bg-saas-secondary-via/10 rounded-lg">📊</span>
                Gains par Mois
              </h3>
              <div className="bg-white p-6 rounded-3xl border border-saas-border">
                {(() => {
                  const monthlyGains = rentals.reduce((acc, r) => {
                    const month = new Date(r.startDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
                    acc[month] = (acc[month] || 0) + r.totalCost;
                    return acc;
                  }, {} as Record<string, number>);

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(monthlyGains)
                        .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                        .map(([month, gain]) => (
                          <div key={month} className="p-4 rounded-2xl bg-gradient-to-br from-saas-success-start/10 to-saas-success-start/5 border border-saas-success-start/20">
                            <p className="text-[10px] font-bold text-saas-text-muted uppercase tracking-widest">{month}</p>
                            <p className="text-lg font-black text-saas-success-start mt-1">{gain.toLocaleString()} DZD</p>
                          </div>
                        ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
            </>
          )}
        </div>

        <div className="p-8 border-t border-saas-border flex items-center justify-end bg-white">
          <button onClick={onClose} className="btn-saas-primary px-12">
            {lang === 'fr' ? 'Fermer' : 'إغلاق'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
