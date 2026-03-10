import React from 'react';
import { Language, Car } from '../../types';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface CarDetailsModalProps {
  lang: Language;
  car: Car;
  onClose: () => void;
  onOrder: () => void;
}

export const CarDetailsModal: React.FC<CarDetailsModalProps> = ({ lang, car, onClose, onOrder }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 hover:bg-slate-100 transition-colors shadow-lg"
        >
          <X size={24} />
        </button>

        {/* Car Images Carousel */}
        <div className="relative h-96 bg-slate-200 overflow-hidden">
          <img
            src={car.images[0]}
            alt={`${car.brand} ${car.model}`}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-bold">
            {car.brand} {car.model} {car.year}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Header Info */}
          <div>
            <h2 className="text-4xl font-black text-slate-900 mb-2">
              {car.brand} <span className="text-blue-600">{car.model}</span>
            </h2>
            <p className="text-slate-600 font-bold">
              {car.registration} • {car.year} • {car.vin}
            </p>
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center">
              <p className="text-3xl mb-2">⛽</p>
              <p className="font-bold text-slate-600 text-sm">{car.energy}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 text-center">
              <p className="text-3xl mb-2">⚙️</p>
              <p className="font-bold text-slate-600 text-sm">{car.transmission}</p>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-4 text-center">
              <p className="text-3xl mb-2">👥</p>
              <p className="font-bold text-slate-600 text-sm">{car.seats} {{fr: 'places', ar: 'مقاعد'}[lang]}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 text-center">
              <p className="text-3xl mb-2">🚪</p>
              <p className="font-bold text-slate-600 text-sm">{car.doors} {{fr: 'portes', ar: 'أبواب'}[lang]}</p>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl p-6 space-y-4">
            <h3 className="font-black text-xl text-slate-900">💰 {{fr: 'Tarifs', ar: 'الأسعار'}[lang]}</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <p className="text-2xl font-black text-blue-600 mb-1">{car.priceDay.toLocaleString()}</p>
                <p className="text-xs font-bold text-slate-600">{{fr: 'Par jour', ar: 'في اليوم'}[lang]}</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <p className="text-2xl font-black text-green-600 mb-1">{car.priceWeek.toLocaleString()}</p>
                <p className="text-xs font-bold text-slate-600">{{fr: 'Par semaine', ar: 'في الأسبوع'}[lang]}</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <p className="text-2xl font-black text-purple-600 mb-1">{car.priceMonth.toLocaleString()}</p>
                <p className="text-xs font-bold text-slate-600">{{fr: 'Par mois', ar: 'شهريا'}[lang]}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border-2 border-orange-300">
              <p className="text-sm text-slate-600 mb-2">🏦 {{fr: 'Caution', ar: 'الكفالة'}[lang]}</p>
              <p className="text-2xl font-black text-orange-600">{car.deposit.toLocaleString()} {{fr: 'DA', ar: 'د.ج'}[lang]}</p>
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-4">
            <h3 className="font-black text-xl text-slate-900">📋 {{fr: 'Caractéristiques', ar: 'الخصائص'}[lang]}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-500 mb-1">🎨 {{fr: 'Couleur', ar: 'اللون'}[lang]}</p>
                <p className="font-black text-slate-900">{car.color}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-500 mb-1">📊 {{fr: 'Kilométrage', ar: 'المسافة المقطوعة'}[lang]}</p>
                <p className="font-black text-slate-900">{car.mileage.toLocaleString()} km</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-slate-200">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-black py-4 px-6 rounded-2xl transition-colors"
            >
              {{fr: 'Fermer', ar: 'إغلاق'}[lang]}
            </button>
            <button
              onClick={onOrder}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black py-4 px-6 rounded-2xl transition-all"
            >
              🛒 {{fr: 'Réserver Maintenant', ar: 'احجز الآن'}[lang]}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
