import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Client, Rental, Language } from '../types';
import { X } from 'lucide-react';

interface ClientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  rentals: Rental[];
  lang: Language;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return '✅';
    case 'active':
      return '⏳';
    case 'pending':
      return '⏳';
    case 'cancelled':
      return '❌';
    default:
      return '❓';
  }
};

const getStatusLabel = (status: string, lang: Language) => {
  const labels = {
    pending: { fr: 'Attente', ar: 'الانتظار' },
    active: { fr: 'En Cours', ar: 'قيد التنفيذ' },
    completed: { fr: 'Complété', ar: 'مكتمل' },
    cancelled: { fr: 'Annulé', ar: 'ملغى' },
  };
  return labels[status as keyof typeof labels]?.[lang] || status;
};

export const ClientHistoryModal: React.FC<ClientHistoryModalProps> = ({ isOpen, onClose, client, rentals, lang }) => {
  if (!isOpen) return null;

  const totalCost = rentals.reduce((sum, rental) => sum + rental.totalCost, 0);
  const completedRentals = rentals.filter(r => r.status === 'completed').length;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-saas-border max-h-[90vh]"
      >
        <div className="p-6 border-b border-saas-border flex items-center justify-between bg-linear-to-r from-saas-primary-start via-saas-primary-via to-saas-primary-end text-white">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              📜 {{fr: 'Historique', ar: 'السجل'}[lang]}
            </h2>
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1">
              {client.firstName} {client.lastName}
            </p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/20 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-saas-success-start/10 p-3 rounded-lg text-center">
              <p className="text-xl font-black text-saas-success-start">{rentals.length}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-saas-text-muted">{{fr: 'Total', ar: 'الإجمالي'}[lang]}</p>
            </div>
            <div className="bg-saas-warning-start/10 p-3 rounded-lg text-center">
              <p className="text-xl font-black text-saas-warning-start">{completedRentals}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-saas-text-muted">{{fr: 'Complétés', ar: 'مكتملة'}[lang]}</p>
            </div>
            <div className="bg-saas-secondary-start/10 p-3 rounded-lg text-center">
              <p className="text-lg font-black text-saas-secondary-start">{totalCost.toLocaleString()} DA</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-saas-text-muted">{{fr: 'Total', ar: 'المجموع'}[lang]}</p>
            </div>
          </div>

          {/* Rentals List */}
          {rentals.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-saas-primary-via uppercase tracking-[0.2em]">
                📋 {{fr: 'Réservations', ar: 'الحجوزات'}[lang]}
              </h3>
              <AnimatePresence>
                {rentals.map((rental, idx) => (
                  <motion.div
                    key={rental.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-saas-bg p-3 rounded-lg border border-saas-border hover:border-saas-primary-via/30 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg">{getStatusIcon(rental.status)}</span>
                      <span className="text-xs font-black text-saas-primary-via uppercase">
                        {{fr: 'Réservation', ar: 'حجز'}[lang]} #{idx + 1}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-saas-text-muted">📅 {{fr: 'Début', ar: 'البداية'}[lang]}:</span>
                        <span className="font-semibold">{new Date(rental.startDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-DZ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-saas-text-muted">📅 {{fr: 'Fin', ar: 'النهاية'}[lang]}:</span>
                        <span className="font-semibold">{new Date(rental.endDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-DZ')}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-saas-border">
                        <span className="text-saas-text-muted font-bold">💰 {{fr: 'Coût', ar: 'التكلفة'}[lang]}:</span>
                        <span className="font-black text-saas-secondary-start">{rental.totalCost.toLocaleString()} DA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-saas-text-muted">🔔 {{fr: 'Statut', ar: 'الحالة'}[lang]}:</span>
                        <span className="font-semibold uppercase text-xs">{getStatusLabel(rental.status, lang)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="text-4xl mb-2">📭</span>
              <p className="text-saas-text-muted text-sm">
                {{fr: 'Aucune réservation', ar: 'لا توجد حجوزات'}[lang]}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-saas-border flex items-center gap-2 bg-saas-bg">
          <button 
            onClick={onClose}
            className="flex-1 btn-saas-outline py-2"
          >
            {{fr: 'Fermer', ar: 'إغلاق'}[lang]}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

