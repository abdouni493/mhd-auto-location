import React, { useState } from 'react';
import { Car, ReservationDetails, VehicleExpense, Language } from '../types';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface CarReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car;
  reservations: ReservationDetails[];
  expenses: VehicleExpense[];
  lang: Language;
}

export const CarReportModal: React.FC<CarReportModalProps> = ({ isOpen, onClose, car, reservations, expenses, lang }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showReport, setShowReport] = useState(false);

  if (!isOpen) return null;

  // Filter reservations and expenses by date
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  const filteredReservations = reservations.filter(r => {
    const d = new Date(r.createdAt);
    return (!start || d >= start) && (!end || d <= end);
  });
  const filteredExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return (!start || d >= start) && (!end || d <= end);
  });

  // Calculate stats
  const totalGains = filteredReservations.reduce((sum, r) => sum + (r.advancePayment + r.remainingPayment), 0);
  const totalCosts = filteredExpenses.reduce((sum, e) => sum + e.cost, 0);
  const totalBenefits = totalGains - totalCosts;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-saas-border"
      >
        <div className="p-8 border-b border-saas-border flex items-center justify-between bg-linear-to-r from-saas-warning-start via-saas-warning-via to-saas-warning-end text-white">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              📄 {lang === 'fr' ? 'Rapport du Véhicule' : 'تقرير السيارة'}: {car.brand} {car.model}
            </h2>
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1">
              {lang === 'fr' ? 'Analyse complète du véhicule sélectionné' : 'تحليل كامل للسيارة المحددة'}
            </p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/20 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-8 bg-saas-bg flex flex-col gap-6 flex-1 overflow-y-auto custom-scrollbar">
          {/* Date Range Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-saas-warning-via">{lang === 'fr' ? 'Date de début' : 'تاريخ البداية'}</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-white/10 border border-saas-warning-via/30 rounded-xl px-4 py-3 text-saas-text-main placeholder-saas-warning-via/50 focus:ring-2 focus:ring-saas-warning-via/30 focus:border-saas-warning-via/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-saas-warning-via">{lang === 'fr' ? 'Date de fin' : 'تاريخ النهاية'}</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-white/10 border border-saas-warning-via/30 rounded-xl px-4 py-3 text-saas-text-main placeholder-saas-warning-via/50 focus:ring-2 focus:ring-saas-warning-via/30 focus:border-saas-warning-via/50 transition-all"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setShowReport(true)}
                className="w-full bg-saas-warning-start text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
              >
                {lang === 'fr' ? 'Générer le Rapport' : 'توليد التقرير'}
              </button>
            </div>
          </div>
          {showReport && (
            <div className="space-y-8">
              {/* Car Info */}
              <div className="grid grid-cols-2 gap-8 bg-white p-6 rounded-2xl border border-saas-warning-via/20">
                <div>
                  <div className="font-bold text-saas-warning-via text-lg mb-2">{car.brand} {car.model}</div>
                  <div className="text-xs text-saas-text-muted mb-1">{lang === 'fr' ? 'Immatriculation' : 'الترقيم'}: <span className="font-bold text-saas-text-main">{car.registration}</span></div>
                  <div className="text-xs text-saas-text-muted mb-1">{lang === 'fr' ? 'Année' : 'السنة'}: <span className="font-bold text-saas-text-main">{car.year}</span></div>
                  <div className="text-xs text-saas-text-muted mb-1">{lang === 'fr' ? 'Couleur' : 'اللون'}: <span className="font-bold text-saas-text-main">{car.color}</span></div>
                  <div className="text-xs text-saas-text-muted mb-1">{lang === 'fr' ? 'Kilométrage Actuel' : 'الكيلومترات الحالية'}: <span className="font-bold text-saas-text-main">{car.mileage.toLocaleString()} km</span></div>
                  <div className="text-xs text-saas-text-muted mb-1">VIN: <span className="font-bold text-saas-text-main">{car.vin}</span></div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-saas-text-muted mb-1">{lang === 'fr' ? 'Énergie' : 'الوقود'}: <span className="font-bold text-saas-text-main">{car.energy}</span></div>
                  <div className="text-xs text-saas-text-muted mb-1">{lang === 'fr' ? 'Boîte' : 'ناقل الحركة'}: <span className="font-bold text-saas-text-main">{car.transmission}</span></div>
                  <div className="text-xs text-saas-text-muted mb-1">{lang === 'fr' ? 'Places' : 'المقاعد'}: <span className="font-bold text-saas-text-main">{car.seats}</span></div>
                  <div className="text-xs text-saas-text-muted mb-1">{lang === 'fr' ? 'Caution' : 'الضمان'}: <span className="font-bold text-saas-text-main">{car.deposit.toLocaleString()} DZD</span></div>
                </div>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-saas-warning-via/20 text-center">
                  <div className="text-[10px] font-bold text-saas-warning-via uppercase mb-1">{lang === 'fr' ? 'Total Gains' : 'إجمالي الأرباح'}</div>
                  <div className="text-xl font-black text-saas-success-start">+{totalGains.toLocaleString()} DZD</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-saas-warning-via/20 text-center">
                  <div className="text-[10px] font-bold text-saas-warning-via uppercase mb-1">{lang === 'fr' ? 'Total Dépenses' : 'إجمالي المصاريف'}</div>
                  <div className="text-xl font-black text-saas-danger-start">-{totalCosts.toLocaleString()} DZD</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-saas-warning-via/20 text-center">
                  <div className="text-[10px] font-bold text-saas-warning-via uppercase mb-1">{lang === 'fr' ? 'Bénéfices Nets' : 'صافي الأرباح'}</div>
                  <div className="text-xl font-black text-saas-primary-via">{totalBenefits.toLocaleString()} DZD</div>
                </div>
              </div>
              {/* History */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-saas-warning-via uppercase tracking-[0.2em]">{lang === 'fr' ? 'Historique des Locations' : 'سجل الإيجارات'}</h3>
                {filteredReservations.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-saas-warning-via rounded-2xl text-saas-text-muted italic text-sm bg-white">
                    {lang === 'fr' ? 'Aucune location enregistrée pour ce véhicule.' : 'لا توجد إيجارات مسجلة لهذه السيارة.'}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {filteredReservations.map((res, idx) => (
                      <div key={res.id} className="p-4 rounded-xl border border-saas-warning-via/20 bg-white flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-saas-text-main">{res.client?.firstName} {res.client?.lastName}</span>
                          <span className="text-xs text-saas-text-muted">{new Date(res.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="text-xs text-saas-text-muted">{lang === 'fr' ? 'Montant' : 'المبلغ'}: <span className="font-bold text-saas-success-start">{(res.advancePayment + res.remainingPayment).toLocaleString()} DZD</span></div>
                        <div className="text-xs text-saas-text-muted">{lang === 'fr' ? 'Statut' : 'الحالة'}: <span className="font-bold text-saas-warning-via">{res.status}</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Expenses */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-saas-warning-via uppercase tracking-[0.2em]">{lang === 'fr' ? 'Historique des Dépenses' : 'سجل المصاريف'}</h3>
                {filteredExpenses.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-saas-warning-via rounded-2xl text-saas-text-muted italic text-sm bg-white">
                    {lang === 'fr' ? 'Aucune dépense enregistrée pour ce véhicule.' : 'لا توجد مصاريف مسجلة لهذه السيارة.'}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {filteredExpenses.map((e, idx) => (
                      <div key={e.id} className="p-4 rounded-xl border border-saas-warning-via/20 bg-white flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-saas-text-main">{e.type}</span>
                          <span className="text-xs text-saas-text-muted">{e.date}</span>
                        </div>
                        <div className="text-xs text-saas-text-muted">{lang === 'fr' ? 'Montant' : 'المبلغ'}: <span className="font-bold text-saas-danger-start">{e.cost.toLocaleString()} DZD</span></div>
                        {e.expenseName && <div className="text-xs text-saas-text-muted">{e.expenseName}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="p-8 border-t border-saas-border flex items-center justify-end bg-white">
          <button onClick={onClose} className="btn-saas-warning px-12">
            {lang === 'fr' ? 'Fermer' : 'إغلاق'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
