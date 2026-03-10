import React, { useState } from 'react';
import { Language, Car, SpecialOffer } from '../../types';
import { motion } from 'motion/react';
import { CarDetailsModal } from './CarDetailsModal';

interface SpecialOffersListingProps {
  lang: Language;
  cars: Car[];
  specialOffers: SpecialOffer[];
  onOrder: (car: Car) => void;
}

export const SpecialOffersListing: React.FC<SpecialOffersListingProps> = ({
  lang,
  cars,
  specialOffers,
  onOrder,
}) => {
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const displayOffers = specialOffers.length > 0 ? specialOffers : cars.slice(0, 4).map((car, i) => ({
    id: `special-${i}`,
    carId: car.id,
    car,
    oldPrice: car.priceDay * 1.2,
    newPrice: car.priceDay,
    note: 'Offre spéciale limitée',
    isActive: true,
    createdAt: new Date().toISOString(),
  }));

  const activeOffers = displayOffers.filter(o => o.isActive);

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
            ⭐ {{fr: 'Offres Spéciales', ar: 'عروض خاصة'}[lang]}
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
            {{fr: 'Des réductions exceptionnelles sur nos meilleurs véhicules premium', ar: 'تخفيضات استثنائية على أفضل السيارات الفاخرة لدينا'}[lang]}
          </p>
        </motion.div>

        {/* Special Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {activeOffers.map((offer, index) => {
            const discountPercent = Math.round((1 - offer.newPrice / offer.oldPrice) * 100);
            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-saas-warning-start/30"
              >
                {/* Image with Discount Badge */}
                <div className="relative h-64 overflow-hidden bg-slate-200">
                  <img
                    src={offer.car.images[0] || `https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=500&h=400&fit=crop`}
                    alt={`${offer.car.brand} ${offer.car.model}`}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  {/* Discount Badge */}
                  <div className="absolute top-4 right-4 bg-gradient-to-br from-saas-danger-start to-saas-danger-end text-white rounded-full w-24 h-24 flex items-center justify-center shadow-xl">
                    <div className="text-center">
                      <p className="text-2xl font-black">-{discountPercent}%</p>
                      <p className="text-xs font-bold">{{fr: 'RÉDUIT', ar: 'خصم'}[lang]}</p>
                    </div>
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
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-saas-bg rounded-lg p-2 text-center border border-saas-border hover:border-saas-primary-via/30 transition-colors">
                      <p className="text-xl mb-1">⛽</p>
                      <p className="text-xs font-bold text-slate-600">{offer.car.energy}</p>
                    </div>
                    <div className="bg-saas-bg rounded-lg p-2 text-center border border-saas-border hover:border-saas-primary-via/30 transition-colors">
                      <p className="text-xl mb-1">⚙️</p>
                      <p className="text-xs font-bold text-slate-600">{offer.car.transmission}</p>
                    </div>
                    <div className="bg-saas-bg rounded-lg p-2 text-center border border-saas-border hover:border-saas-primary-via/30 transition-colors">
                      <p className="text-xl mb-1">👥</p>
                      <p className="text-xs font-bold text-slate-600">{offer.car.seats}</p>
                    </div>
                    <div className="bg-saas-bg rounded-lg p-2 text-center border border-saas-border hover:border-saas-primary-via/30 transition-colors">
                      <p className="text-xl mb-1">🚪</p>
                      <p className="text-xs font-bold text-slate-600">{offer.car.doors}</p>
                    </div>
                  </div>

                  {/* Price Comparison */}
                  <div className="bg-gradient-to-r from-saas-warning-start/10 to-saas-danger-start/10 rounded-xl p-4 space-y-2 border border-saas-warning-start/20">
                    <div className="flex items-center justify-between">
                      <p className="text-slate-600 font-bold line-through text-lg">
                        {offer.oldPrice.toLocaleString()} {{fr: 'DA', ar: 'د.ج'}[lang]}
                      </p>
                      <span className="bg-saas-danger-start text-white text-xs font-black px-3 py-1 rounded-lg">
                        {{fr: 'Avant', ar: 'قبل'}[lang]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-saas-warning-start/30 pt-3">
                      <p className="text-4xl font-black text-saas-success-start">
                        {offer.newPrice.toLocaleString()} {{fr: 'DA', ar: 'د.ج'}[lang]}
                      </p>
                      <span className="bg-saas-success-start text-white text-xs font-black px-3 py-1 rounded-lg">
                        {{fr: 'Maintenant', ar: 'الآن'}[lang]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 text-center pt-2">
                      💚 {{fr: 'Économisez', ar: 'وفر'}[lang]}: {(offer.oldPrice - offer.newPrice).toLocaleString()} {{fr: 'DA', ar: 'د.ج'}[lang]}
                    </p>
                  </div>

                  {/* Note */}
                  {offer.note && (
                    <p className="text-xs text-slate-600 italic bg-saas-primary-via/5 p-2 rounded-lg border border-saas-primary-via/10">
                      📝 {offer.note}
                    </p>
                  )}

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
                      className="flex-1 bg-gradient-to-r from-saas-success-start to-saas-success-end hover:from-saas-success-start hover:to-saas-success-end text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
                    >
                      🎉 {{fr: 'Réserver', ar: 'احجز'}[lang]}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {activeOffers.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-2xl font-black text-slate-600">
              {{fr: 'Aucune offre spéciale actuellement', ar: 'لا توجد عروض خاصة حالياً'}[lang]}
            </p>
          </motion.div>
        )}
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
