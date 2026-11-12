import React, { useEffect, useState } from 'react';
import { Language, Worker } from '../types';
import { DatabaseService } from '../services/DatabaseService';

/** Livraison du véhicule par un employé (option de l'étape « Inspection départ »). */
export interface DeliveryDraft {
  enabled: boolean;
  workerId: string;
  workerName: string;
  amount: number | '';
  /** Paiement du livreur : maintenant (sortie de caisse) ou plus tard (sur son compte). */
  payoutMode: 'immediate' | 'deferred';
}

export const emptyDeliveryDraft: DeliveryDraft = {
  enabled: false,
  workerId: '',
  workerName: '',
  amount: '',
  payoutMode: 'deferred',
};

/** Montant de livraison effectivement appliqué (0 si l'option est désactivée). */
export const deliveryAmountOf = (d?: Partial<DeliveryDraft> | null): number =>
  d?.enabled && d.workerId ? Math.max(0, Math.round(Number(d.amount) || 0)) : 0;

/**
 * Option « Livraison du véhicule » : l'utilisateur l'active ou non, choisit
 * l'employé qui a livré la voiture et le montant payé pour cette livraison.
 * Ce montant est DÉDUIT du total final de la réservation.
 */
export const DeliverySection: React.FC<{
  lang: Language;
  value: DeliveryDraft | undefined;
  onChange: (v: DeliveryDraft) => void;
}> = ({ lang, value, onChange }) => {
  const T = (fr: string, ar: string) => (lang === 'fr' ? fr : ar);
  const draft = value || emptyDeliveryDraft;
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!draft.enabled || workers.length > 0) return;
    let cancelled = false;
    setLoading(true);
    DatabaseService.getWorkers()
      .then(list => { if (!cancelled) setWorkers(list); })
      .catch(err => console.error('Error loading workers:', err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [draft.enabled]);

  const set = (patch: Partial<DeliveryDraft>) => onChange({ ...draft, ...patch });

  return (
    <div className="mt-8 bg-gradient-to-r from-sky-50 to-cyan-50 rounded-2xl p-6 border-2 border-sky-200 space-y-4">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={draft.enabled}
          onChange={e => set({ enabled: e.target.checked })}
          className="w-5 h-5 accent-sky-600"
        />
        <span className="text-lg font-black text-sky-900">
          🚚 {T('Livraison du véhicule par un employé', 'توصيل المركبة من طرف موظف')}
        </span>
      </label>
      <p className="text-xs text-sky-800/80 -mt-2">
        {T(
          "Le montant payé au livreur est déduit du total final de la réservation.",
          'المبلغ المدفوع للموصِّل يُخصم من المجموع النهائي للحجز.'
        )}
      </p>

      {draft.enabled && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-sky-900 mb-2">👤 {T('Livré par', 'سلّمها')}</label>
              <select
                value={draft.workerId}
                onChange={e => {
                  const w = workers.find(x => x.id === e.target.value);
                  set({ workerId: e.target.value, workerName: w?.fullName || '' });
                }}
                className="w-full p-3 border border-sky-200 rounded-lg bg-white focus:ring-2 focus:ring-sky-500"
              >
                <option value="">{loading ? T('Chargement…', 'جاري التحميل…') : T('— Choisir un employé —', '— اختر موظفا —')}</option>
                {/* Garde l'employé déjà enregistré même si la liste n'est pas encore chargée */}
                {draft.workerId && !workers.some(w => w.id === draft.workerId) && (
                  <option value={draft.workerId}>{draft.workerName || draft.workerId}</option>
                )}
                {workers.map(w => (
                  <option key={w.id} value={w.id}>{w.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-sky-900 mb-2">💰 {T('Montant de la livraison (DA)', 'مبلغ التوصيل (دج)')}</label>
              <input
                type="number"
                min={0}
                value={draft.amount}
                onChange={e => set({ amount: e.target.value === '' ? '' : Math.max(0, Number(e.target.value)) })}
                placeholder="0"
                className="w-full p-3 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-sky-900 mb-2">💸 {T('Paiement du livreur', 'دفع الموصِّل')}</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {([
                ['immediate', T('Payer maintenant', 'الدفع الآن'), T('Sortie de la caisse de l\'agence', 'يخرج من صندوق الوكالة')],
                ['deferred', T('Payer plus tard', 'الدفع لاحقا'), T('Ajouté au compte de l\'employé', 'يضاف إلى حساب الموظف')],
              ] as const).map(([k, title, desc]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => set({ payoutMode: k })}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${draft.payoutMode === k ? 'border-sky-500 bg-sky-100' : 'border-sky-200 bg-white'}`}
                >
                  <p className="font-black text-sky-900 text-sm">{title}</p>
                  <p className="text-xs text-slate-600">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {deliveryAmountOf(draft) > 0 && (
            <p className="text-sm font-bold text-sky-900">
              {T('Déduit du total :', 'يُخصم من المجموع:')} −{deliveryAmountOf(draft).toLocaleString('fr-FR')} DA
            </p>
          )}
        </div>
      )}
    </div>
  );
};
