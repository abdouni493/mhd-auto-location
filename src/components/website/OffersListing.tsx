import React, { useState } from 'react';
import { Language, Car, Offer } from '../../types';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { CarDetailsModal } from './CarDetailsModal';

interface OffersListingProps {
  lang: Language;
  cars: Car[];
  offers: Offer[];
  onOrder: (car: Car) => void;
}

export const OffersListing: React.FC<OffersListingProps> = ({ lang, cars, offers, onOrder }) => {
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const displayOffers = offers.length > 0 ? offers : cars.slice(0, 6).map((car, i) => ({
    id: `default-${i}`,
    carId: car.id,
    car,
    price: car.priceDay,
    note: '',
    createdAt: new Date().toISOString(),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-black text-slate-900 mb-4">
            🎁 {{fr: 'Nos Offres', ar: 'عروضنا'}[lang]}
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
            {{fr: 'Découvrez notre sélection de véhicules premium avec les meilleures offres', ar: 'اكتشف تشكيلتنا من السيارات الفاخرة مع أفضل العروض'}[lang]}
          </p>
        </motion.div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayOffers.map((offer, index) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-100"
            >
              {/* Image */}
              <div className="relative h-56 overflow-hidden bg-slate-200">
                <img
                  src={offer.car.images[0] || `https://images.unsplash.com/photo-1560958089-b8a63dd8aa8b?w=500&h=400&fit=crop`}
                  alt={`${offer.car.brand} ${offer.car.model}`}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 bg-saas-primary-via text-white px-3 py-1 rounded-lg text-xs font-bold">
                  {offer.car.year}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Car Info */}
                <div>
                  <h3 className="text-2xl font-black text-slate-900">
                    {offer.car.brand} <span className="text-saas-primary-via">{offer.car.model}</span>
                  </h3>
                  <p className="text-sm text-slate-500 font-bold">
                    {offer.car.registration} • {offer.car.color}
                  </p>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-saas-bg rounded-lg p-3 text-center border border-saas-border hover:border-saas-primary-via/30 transition-colors">
                    <p className="text-2xl mb-1">⛽</p>
                    <p className="text-xs font-bold text-slate-600">{offer.car.energy}</p>
                  </div>
                  <div className="bg-saas-bg rounded-lg p-3 text-center border border-saas-border hover:border-saas-primary-via/30 transition-colors">
                    <p className="text-2xl mb-1">⚙️</p>
                    <p className="text-xs font-bold text-slate-600">{offer.car.transmission}</p>
                  </div>
                  <div className="bg-saas-bg rounded-lg p-3 text-center border border-saas-border hover:border-saas-primary-via/30 transition-colors">
                    <p className="text-2xl mb-1">👥</p>
                    <p className="text-xs font-bold text-slate-600">{offer.car.seats} {{fr: 'places', ar: 'مقاعد'}[lang]}</p>
                  </div>
                  <div className="bg-saas-bg rounded-lg p-3 text-center border border-saas-border hover:border-saas-primary-via/30 transition-colors">
                    <p className="text-2xl mb-1">🚪</p>
                    <p className="text-xs font-bold text-slate-600">{offer.car.doors} {{fr: 'portes', ar: 'أبواب'}[lang]}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="bg-gradient-to-r from-saas-primary-via to-saas-primary-end text-white rounded-xl p-4 border border-saas-primary-end/20">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-90 mb-1">
                    {{fr: 'À partir de', ar: 'ابتداءً من'}[lang]}
                  </p>
                  <p className="text-3xl font-black">
                    {offer.price.toLocaleString()} {{fr: 'DA', ar: 'د.ج'}[lang]} <span className="text-sm">/{{fr: 'jour', ar: 'يوم'}[lang]}</span>
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedCar(offer.car);
                      setShowDetails(true);
                    }}
                    className="flex-1 bg-saas-bg hover:bg-slate-200 text-slate-900 font-bold py-3 px-4 rounded-lg transition-colors border border-saas-border hover:border-saas-primary-via/30"
                  >
                    👁️ {{fr: 'Détails', ar: 'التفاصيل'}[lang]}
                  </button>
                  <button
                    onClick={() => onOrder(offer.car)}
                    className="flex-1 bg-gradient-to-r from-saas-primary-via to-saas-primary-end hover:from-saas-primary-via hover:to-saas-primary-end text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    🛒 {{fr: 'Réserver', ar: 'احجز'}[lang]}
                  </button>
                </div>

                {/* Note */}
                {offer.note && (
                  <p className="text-xs text-slate-500 italic border-t border-slate-200 pt-3">
                    📝 {offer.note}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Car Details Modal */}
      {showDetails && selectedCar && (
        <CarDetailsModal
          lang={lang}
          car={selectedCar}
          onClose={() => setShowDetails(false)}
          onOrder={onOrder}
        />
      )}
    </div>
  );
};
