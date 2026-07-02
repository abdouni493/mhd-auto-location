import React, { useState } from 'react';
import { Language, Car, SpecialOffer } from '../../types';
import { motion } from 'motion/react';
import { CarDetailsModal } from './CarDetailsModal';
import { getCurrentSpecialOfferForCar } from '../../utils/specialOffers';

interface OffersListingProps {
  lang: Language;
  /** Voitures visibles sur le site (les masquées sont déjà exclues en amont). */
  cars: Car[];
  specialOffers: SpecialOffer[];
  onOrder: (car: Car) => void;
}

export const OffersListing: React.FC<OffersListingProps> = ({ lang, cars, specialOffers, onOrder }) => {
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="min-h-screen bg-vel-void py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <p className="font-bold text-xs tracking-[0.25em] uppercase mb-4"
            style={{ color: '#22D3EE', fontFamily: 'var(--font-display)' }}>
            {{ fr: 'Nos Véhicules', ar: 'سياراتنا' }[lang]}
          </p>
          <h1 className="font-black text-6xl text-vel-white" style={{ fontFamily: 'var(--font-display)' }}>
            {{ fr: 'La Flotte', ar: 'الأسطول' }[lang]}
          </h1>
          <p className="text-vel-muted text-lg mt-4 max-w-2xl mx-auto">
            {{ fr: 'Découvrez notre sélection de véhicules premium avec les meilleures offres', ar: 'اكتشف تشكيلتنا من السيارات الفاخرة مع أفضل العروض' }[lang]}
          </p>
        </motion.div>

        {/* Cars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cars.map((car, index) => {
            const promo = getCurrentSpecialOfferForCar(car.id, specialOffers);
            return (
            <motion.div
              key={car.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.6 }}
              whileHover={{ y: -8 }}
              className="vel-glass rounded-2xl overflow-hidden group transition-all duration-500"
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(34,211,238,0.4)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(34,211,238,0.12)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              {/* Image */}
              <div className="relative h-56 overflow-hidden bg-vel-abyss">
                <img
                  src={car.images?.[0] || `https://images.unsplash.com/photo-1560958089-b8a63dd8aa8b?w=500&h=400&fit=crop`}
                  alt={`${car.brand} ${car.model}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0" style={{
                  background: 'linear-gradient(to top, rgba(8,12,20,0.8), transparent)',
                }} />
                <div className="absolute top-3 right-3 px-3 py-1 rounded-lg text-xs font-bold backdrop-blur-sm"
                  style={{
                    color: '#22D3EE',
                    background: 'rgba(34,211,238,0.15)',
                    border: '1px solid rgba(34,211,238,0.3)',
                    fontFamily: 'var(--font-display)',
                  }}>
                  {car.year}
                </div>
                {/* Badge promo */}
                {promo && (
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-lg text-xs font-bold text-white shadow-lg"
                    style={{ background: '#EF4444', fontFamily: 'var(--font-display)' }}>
                    {promo.label || `-${Math.round((1 - promo.newPrice / promo.oldPrice) * 100)}%`}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Car name */}
                <div>
                  <h3 className="font-black text-2xl text-vel-white" style={{ fontFamily: 'var(--font-display)' }}>
                    {car.brand}{' '}
                    <span style={{ color: '#22D3EE' }}>{car.model}</span>
                  </h3>
                  <p className="text-vel-muted text-sm mt-1">
                    {car.registration} · {car.color}
                  </p>
                </div>

                {/* Specs pills */}
                <div className="flex flex-wrap gap-2">
                  {[car.energy, car.transmission,
                    `${car.seats} ${lang === 'fr' ? 'places' : 'مقاعد'}`,
                    `${car.doors} ${lang === 'fr' ? 'portes' : 'أبواب'}`,
                  ].map((spec, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-medium text-vel-silver"
                      style={{ background: '#1A2235', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Price block */}
                <div className="vel-glass-cyan rounded-xl p-4">
                  <p className="text-xs font-bold tracking-wider uppercase mb-1"
                    style={{ color: '#22D3EE', fontFamily: 'var(--font-display)' }}>
                    {promo
                      ? { fr: 'Offre spéciale', ar: 'عرض خاص' }[lang]
                      : { fr: 'À partir de', ar: 'ابتداءً من' }[lang]}
                  </p>
                  {promo ? (
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <p className="font-black text-3xl" style={{ color: '#22D3EE', fontFamily: 'var(--font-display)' }}>
                        {promo.newPrice.toLocaleString()}{' '}
                        <span className="text-sm" style={{ color: 'rgba(34,211,238,0.65)' }}>
                          {{ fr: 'DA/jour', ar: 'د.ج/يوم' }[lang]}
                        </span>
                      </p>
                      <p className="text-vel-muted line-through text-sm font-bold">
                        {promo.oldPrice.toLocaleString()} {{ fr: 'DA', ar: 'د.ج' }[lang]}
                      </p>
                    </div>
                  ) : (
                    <p className="font-black text-3xl" style={{ color: '#22D3EE', fontFamily: 'var(--font-display)' }}>
                      {car.priceDay.toLocaleString()}{' '}
                      <span className="text-sm" style={{ color: 'rgba(34,211,238,0.65)' }}>
                        {{ fr: 'DA/jour', ar: 'د.ج/يوم' }[lang]}
                      </span>
                    </p>
                  )}
                </div>

                {/* Note promo */}
                {promo?.note && (
                  <p className="text-xs text-vel-muted italic px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {promo.note}
                  </p>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => { setSelectedCar(car); setShowDetails(true); }}
                    className="btn-vel-ghost flex-1 py-3 text-sm"
                  >
                    {{ fr: 'Détails', ar: 'التفاصيل' }[lang]}
                  </button>
                  <button
                    onClick={() => onOrder(car)}
                    className="btn-vel-cyan flex-1 py-3 text-sm"
                  >
                    {{ fr: 'Réserver', ar: 'احجز' }[lang]}
                  </button>
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>

        {cars.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <p className="text-vel-muted text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              {{ fr: 'Aucun véhicule disponible actuellement', ar: 'لا توجد سيارات متاحة حالياً' }[lang]}
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
