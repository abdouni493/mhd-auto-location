import React, { useState, useEffect } from 'react';
import { VehicleExpense, Language, Car } from '../types';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface VehicleExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<VehicleExpense>) => void;
  expense?: VehicleExpense;
  cars: Car[];
  lang: Language;
}

export const VehicleExpenseModal: React.FC<VehicleExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expense,
  cars,
  lang,
}) => {
  const [formData, setFormData] = useState({
    carId: '',
    type: 'vidange' as const,
    cost: 0,
    date: new Date().toISOString().split('T')[0],
    note: '',
    currentMileage: 0,
    nextVidangeKm: 0,
    expenseName: '',
    expirationDate: '',
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        carId: expense.carId,
        type: expense.type,
        cost: expense.cost,
        date: expense.date,
        note: expense.note || '',
        currentMileage: expense.currentMileage || 0,
        nextVidangeKm: expense.nextVidangeKm || 0,
        expenseName: expense.expenseName || '',
        expirationDate: expense.expirationDate || '',
      });
    } else {
      const selectedCar = cars.length > 0 ? cars[0] : null;
      setFormData({
        carId: selectedCar?.id || '',
        type: 'vidange',
        cost: 0,
        date: new Date().toISOString().split('T')[0],
        note: '',
        currentMileage: selectedCar?.mileage || 0,
        nextVidangeKm: selectedCar ? (selectedCar.mileage + 10000) : 0,
        expenseName: '',
        expirationDate: '',
      });
    }
  }, [expense, isOpen, cars]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['cost', 'currentMileage', 'nextVidangeKm'].includes(name)
        ? parseInt(value) || 0
        : value,
    }));
  };

  const handleCarChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const carId = e.target.value;
    const selectedCar = cars.find(c => c.id === carId);
    setFormData(prev => ({
      ...prev,
      carId,
      currentMileage: selectedCar?.mileage || 0,
      nextVidangeKm: selectedCar ? (selectedCar.mileage + 10000) : 0,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: Partial<VehicleExpense> = {
      carId: formData.carId,
      type: formData.type,
      cost: formData.cost,
      date: formData.date,
      note: formData.note || undefined,
    };

    if (formData.type === 'vidange') {
      submitData.currentMileage = formData.currentMileage;
      submitData.nextVidangeKm = formData.nextVidangeKm;
    } else if (formData.type === 'autre') {
      submitData.expenseName = formData.expenseName;
    }
    
    // Always include expirationDate for assurance and controle types
    if (formData.type === 'assurance' || formData.type === 'controle') {
      submitData.expirationDate = formData.expirationDate || undefined;
    }

    onSave(submitData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-saas-border max-h-[90vh]"
      >
        <div className="p-6 border-b border-saas-border flex items-center justify-between bg-linear-to-r from-saas-primary-start via-saas-primary-via to-saas-primary-end text-white">
          <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
            🚗 {{fr: 'Dépense Véhicule', ar: 'نفقة المركبة'}[lang]}
          </h2>
          <button onClick={onClose} className="p-2.5 hover:bg-white/20 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {/* Car Selection */}
          <div className="space-y-2">
            <label className="label-saas">🚗 {{fr: 'Véhicule *', ar: 'المركبة *'}[lang]}</label>
            <select
              name="carId"
              value={formData.carId}
              onChange={handleCarChange}
              className="input-saas"
              required
            >
              <option value="">{{fr: 'Sélectionner un véhicule', ar: 'اختر مركبة'}[lang]}</option>
              {cars.map(car => (
                <option key={car.id} value={car.id}>
                  {car.brand} {car.model} ({car.registration})
                </option>
              ))}
            </select>
          </div>

          {/* Expense Type */}
          <div className="space-y-2">
            <label className="label-saas">💰 {{fr: 'Type de dépense *', ar: 'نوع النفقة *'}[lang]}</label>
            <div className="grid grid-cols-2 gap-2">
              {['vidange', 'assurance', 'controle', 'autre'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: type as any }))}
                  className={`py-2 px-2 rounded-lg font-bold text-xs transition-all flex flex-col items-center gap-1 ${
                    formData.type === type
                      ? 'btn-saas-primary'
                      : 'btn-saas-outline'
                  }`}
                >
                  {{
                    vidange: { icon: '🛢️', label: lang === 'fr' ? 'Vidange' : 'تغيير الزيت' },
                    assurance: { icon: '🛡️', label: lang === 'fr' ? 'Assurance' : 'التأمين' },
                    controle: { icon: '🛠️', label: lang === 'fr' ? 'Contrôle' : 'الفحص' },
                    autre: { icon: '❓', label: lang === 'fr' ? 'Autre' : 'آخر' },
                  }[type] && (
                    <>
                      <span className="text-lg">{{
                        vidange: '🛢️',
                        assurance: '🛡️',
                        controle: '🛠️',
                        autre: '❓',
                      }[type]}</span>
                      <span>{{
                        vidange: lang === 'fr' ? 'Vidange' : 'تغيير الزيت',
                        assurance: lang === 'fr' ? 'Assurance' : 'التأمين',
                        controle: lang === 'fr' ? 'Contrôle' : 'الفحص',
                        autre: lang === 'fr' ? 'Autre' : 'آخر',
                      }[type]}</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* VIDANGE SECTION */}
          {formData.type === 'vidange' && (
            <>
              {/* Current Mileage */}
              <div className="space-y-2">
                <label className="label-saas">🚗 {{fr: 'Kilométrage Actuel', ar: 'المسافة الحالية'}[lang]}</label>
                <div className="bg-saas-bg p-4 rounded-lg border border-saas-border text-center">
                  <p className="text-2xl font-black text-saas-primary-via">{formData.currentMileage.toLocaleString('fr-FR')} KM</p>
                </div>
              </div>

              {/* Cost */}
              <div className="space-y-2">
                <label className="label-saas">💵 {{fr: 'Coût (DZD)', ar: 'التكلفة (دينار)'}[lang]}</label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost || ''}
                  onChange={handleChange}
                  placeholder="0"
                  className="input-saas"
                  min="0"
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="label-saas">📅 {{fr: 'Date', ar: 'التاريخ'}[lang]}</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="input-saas"
                  required
                />
              </div>

              {/* Next Vidange KM */}
              <div className="space-y-2">
                <label className="label-saas">↩️ {{fr: 'Km pour Prochaine Vidange', ar: 'كم للتغيير التالي'}[lang]}</label>
                <input
                  type="number"
                  name="nextVidangeKm"
                  value={formData.nextVidangeKm || ''}
                  onChange={handleChange}
                  placeholder="0"
                  className="input-saas"
                  min="0"
                />
              </div>

              {/* Next Service Display */}
              <div className="space-y-2">
                <label className="label-saas">🏁 {{fr: 'Prochain', ar: 'القادم'}[lang]}</label>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                  <p className="text-2xl font-black text-green-600">
                    {(formData.currentMileage + formData.nextVidangeKm).toLocaleString('fr-FR')} KM
                  </p>
                </div>
              </div>
            </>
          )}

          {/* AUTRE SECTION */}
          {formData.type === 'autre' && (
            <>
              {/* Expense Name */}
              <div className="space-y-2">
                <label className="label-saas">📝 {{fr: 'Nom de la dépense', ar: 'اسم النفقة'}[lang]}</label>
                <input
                  type="text"
                  name="expenseName"
                  value={formData.expenseName}
                  onChange={handleChange}
                  placeholder={{fr: 'Réparation pneu', ar: 'إصلاح الإطار'}[lang]}
                  className="input-saas"
                  required
                />
              </div>

              {/* Cost */}
              <div className="space-y-2">
                <label className="label-saas">💵 {{fr: 'Coût (DZD)', ar: 'التكلفة (دينار)'}[lang]}</label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost || ''}
                  onChange={handleChange}
                  placeholder="0"
                  className="input-saas"
                  min="0"
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="label-saas">📅 {{fr: 'Date', ar: 'التاريخ'}[lang]}</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="input-saas"
                  required
                />
              </div>
            </>
          )}

          {/* ASSURANCE SECTION */}
          {formData.type === 'assurance' && (
            <>
              {/* Cost */}
              <div className="space-y-2">
                <label className="label-saas">💵 {{fr: 'Coût (DZD)', ar: 'التكلفة (دينار)'}[lang]}</label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost || ''}
                  onChange={handleChange}
                  placeholder="0"
                  className="input-saas"
                  min="0"
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="label-saas">📅 {{fr: 'Date', ar: 'التاريخ'}[lang]}</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="input-saas"
                  required
                />
              </div>

              {/* Expiration Date */}
              <div className="space-y-2">
                <label className="label-saas">🛡️ {{fr: 'Date d\'expiration', ar: 'تاريخ الانتهاء'}[lang]}</label>
                <input
                  type="date"
                  name="expirationDate"
                  value={formData.expirationDate}
                  onChange={handleChange}
                  className="input-saas"
                />
              </div>
            </>
          )}

          {/* CONTRÔLE SECTION */}
          {formData.type === 'controle' && (
            <>
              {/* Cost */}
              <div className="space-y-2">
                <label className="label-saas">💵 {{fr: 'Coût (DZD)', ar: 'التكلفة (دينار)'}[lang]}</label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost || ''}
                  onChange={handleChange}
                  placeholder="0"
                  className="input-saas"
                  min="0"
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="label-saas">📅 {{fr: 'Date', ar: 'التاريخ'}[lang]}</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="input-saas"
                  required
                />
              </div>

              {/* Expiration Date */}
              <div className="space-y-2">
                <label className="label-saas">🛠️ {{fr: 'Date d\'expiration', ar: 'تاريخ الانتهاء'}[lang]}</label>
                <input
                  type="date"
                  name="expirationDate"
                  value={formData.expirationDate}
                  onChange={handleChange}
                  className="input-saas"
                />
              </div>
            </>
          )}

          {/* Note */}
          <div className="space-y-2">
            <label className="label-saas">📄 {{fr: 'Note (optionnel)', ar: 'ملاحظة (اختياري)'}[lang]}</label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Détails supplémentaires..."
              className="input-saas resize-none"
              rows={3}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-saas-border flex items-center gap-3 bg-saas-bg">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-lg font-bold text-sm bg-white border-2 border-saas-border hover:bg-saas-bg-light transition-colors text-saas-text-main"
          >
            {{fr: 'Annuler', ar: 'إلغاء'}[lang]}
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 btn-saas-primary py-3"
          >
            {{fr: expense ? 'Modifier' : 'Ajouter', ar: expense ? 'تعديل' : 'إضافة'}[lang]}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
