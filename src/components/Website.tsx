import React, { useState } from 'react';
import { Language, Car, Agency } from '../types';
import { motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { Welcome } from './website/Welcome';
import { OffersListing } from './website/OffersListing';
import { SpecialOffersListing } from './website/SpecialOffersListing';
import { ContactsWebsite } from './website/ContactsWebsite';
import { OrdersPage } from './website/OrdersPage';

interface WebsiteProps {
  lang: Language;
  onLangChange?: (lang: Language) => void;
  cars: Car[];
  agencies: Agency[];
  offers: any[];
  specialOffers: any[];
  contactInfo: any;
  websiteSettings: any;
}

export const Website: React.FC<WebsiteProps> = ({
  lang,
  onLangChange,
  cars,
  agencies,
  offers,
  specialOffers,
  contactInfo,
  websiteSettings,
}) => {
  const [currentPage, setCurrentPage] = useState<'home' | 'offers' | 'special' | 'contacts' | 'orders'>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  const handleReserveClick = (car: Car) => {
    setSelectedCar(car);
    setCurrentPage('orders');
  };

  const navItems = [
    { id: 'home', label: { fr: 'Accueil', ar: 'الرئيسية' } },
    { id: 'offers', label: { fr: 'Offres', ar: 'العروض' } },
    { id: 'special', label: { fr: 'Spéciales', ar: 'خاصة' } },
    { id: 'orders', label: { fr: 'Commander', ar: 'طلب' } },
    { id: 'contacts', label: { fr: 'Contacts', ar: 'جهات الاتصال' } },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setCurrentPage('home')}
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-blue-600">
                {websiteSettings?.logo ? (
                  <img
                    src={websiteSettings.logo}
                    alt="Logo"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-black text-lg">
                    🚗
                  </div>
                )}
              </div>
              <div className="hidden sm:block">
                <h1 className="font-black text-xl text-slate-900">
                  {websiteSettings?.name || 'Luxdrive'}
                </h1>
                <p className="text-xs text-blue-600 font-bold">{{fr: 'LOCATION DE VOITURES', ar: 'تأجير السيارات'}[lang]}</p>
              </div>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id as any)}
                  className={`font-bold text-sm uppercase tracking-wider transition-all duration-300 ${
                    currentPage === item.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-slate-600 hover:text-blue-600'
                  }`}
                >
                  {item.label[lang]}
                </button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden pb-4 space-y-2 border-t border-slate-200"
            >
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 font-bold text-sm uppercase tracking-wider rounded-lg transition-colors ${
                    currentPage === item.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {item.label[lang]}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </nav>

      {/* Page Content */}
      <motion.div
        key={currentPage}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {currentPage === 'home' && (
          <Welcome lang={lang} websiteSettings={websiteSettings} onStartRenting={() => setCurrentPage('offers')} />
        )}
        {currentPage === 'offers' && (
          <OffersListing lang={lang} cars={cars} offers={offers} onOrder={handleReserveClick} />
        )}
        {currentPage === 'special' && (
          <SpecialOffersListing lang={lang} cars={cars} specialOffers={specialOffers} onOrder={handleReserveClick} />
        )}
        {currentPage === 'orders' && (
          <OrdersPage lang={lang} cars={cars} agencies={agencies} selectedCar={selectedCar} />
        )}
        {currentPage === 'contacts' && (
          <ContactsWebsite lang={lang} contactInfo={contactInfo} websiteSettings={websiteSettings} />
        )}
      </motion.div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-black text-xl mb-4">{websiteSettings?.name || 'Luxdrive'}</h3>
              <p className="text-slate-400 text-sm">{websiteSettings?.description}</p>
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4">{{fr: 'Navigation', ar: 'الملاحة'}[lang]}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                {navItems.map(item => (
                  <li key={item.id}>
                    <button
                      onClick={() => setCurrentPage(item.id as any)}
                      className="hover:text-white transition-colors"
                    >
                      {item.label[lang]}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4">📞 {{fr: 'Contact', ar: 'اتصل'}[lang]}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                {contactInfo?.phone && <li>{contactInfo.phone}</li>}
                {contactInfo?.email && <li>{contactInfo.email}</li>}
                {contactInfo?.address && <li>{contactInfo.address}</li>}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4">🌐 {{fr: 'Réseaux', ar: 'وسائل التواصل'}[lang]}</h4>
              <div className="flex gap-4">
                {contactInfo?.facebook && (
                  <a href={contactInfo.facebook} target="_blank" rel="noopener noreferrer" className="text-2xl hover:scale-110 transition-transform">
                    👍
                  </a>
                )}
                {contactInfo?.instagram && (
                  <a href={`https://instagram.com/${contactInfo.instagram}`} target="_blank" rel="noopener noreferrer" className="text-2xl hover:scale-110 transition-transform">
                    📷
                  </a>
                )}
                {contactInfo?.tiktok && (
                  <a href={`https://tiktok.com/@${contactInfo.tiktok}`} target="_blank" rel="noopener noreferrer" className="text-2xl hover:scale-110 transition-transform">
                    🎵
                  </a>
                )}
                {contactInfo?.whatsapp && (
                  <a href={`https://wa.me/${contactInfo.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-2xl hover:scale-110 transition-transform">
                    💬
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-400">
            <p>© 2026 {websiteSettings?.name || 'Luxdrive'}. {{fr: 'Tous droits réservés.', ar: 'جميع الحقوق محفوظة.'}[lang]}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
