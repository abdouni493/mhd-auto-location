import React from 'react';
import { Language } from '../../types';
import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';

interface WelcomeProps {
  lang: Language;
  websiteSettings: any;
  onStartRenting: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ lang, websiteSettings, onStartRenting }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Professional Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-saas-primary-via/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-saas-success-start/10 to-transparent rounded-full blur-3xl"></div>
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-10 left-10 text-8xl opacity-10"
        >
          🚗
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col justify-center items-center text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-2xl mx-auto mb-6">
            {websiteSettings?.logo ? (
              <img
                src={websiteSettings.logo}
                alt="Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-white flex items-center justify-center text-5xl">
                🚗
              </div>
            )}
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-6"
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white mb-4 leading-tight">
            {{fr: 'Bienvenue à', ar: 'أهلا بك في'}[lang]} <span className="bg-gradient-to-r from-saas-primary-via to-saas-success-start bg-clip-text text-transparent">{websiteSettings?.name || 'Luxdrive'}</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 font-semibold max-w-2xl mx-auto">
            {websiteSettings?.description}
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12 w-full max-w-4xl"
        >
          <motion.div whileHover={{ scale: 1.05 }} className="bg-gradient-to-br from-saas-primary-via/20 to-saas-primary-end/20 backdrop-blur-md rounded-2xl p-8 border border-saas-primary-via/30 hover:border-saas-primary-via/60 transition-all">
            <div className="text-5xl mb-3">🚙</div>
            <p className="text-white font-bold text-base">{{fr: 'Voitures Premium', ar: 'سيارات فاخرة'}[lang]}</p>
            <p className="text-slate-300 text-xs mt-2">{{fr: 'Flotte moderne et bien entretenue', ar: 'أسطول حديث وجيد الصيانة'}[lang]}</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-gradient-to-br from-saas-success-start/20 to-saas-success-end/20 backdrop-blur-md rounded-2xl p-8 border border-saas-success-start/30 hover:border-saas-success-start/60 transition-all">
            <div className="text-5xl mb-3">💰</div>
            <p className="text-white font-bold text-base">{{fr: 'Prix Compétitifs', ar: 'أسعار تنافسية'}[lang]}</p>
            <p className="text-slate-300 text-xs mt-2">{{fr: 'Les meilleurs tarifs du marché', ar: 'أفضل الأسعار في السوق'}[lang]}</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-gradient-to-br from-saas-warning-start/20 to-saas-warning-end/20 backdrop-blur-md rounded-2xl p-8 border border-saas-warning-start/30 hover:border-saas-warning-start/60 transition-all">
            <div className="text-5xl mb-3">⚡</div>
            <p className="text-white font-bold text-base">{{fr: 'Réservation Rapide', ar: 'حجز سريع'}[lang]}</p>
            <p className="text-slate-300 text-xs mt-2">{{fr: 'Processus simple et rapide', ar: 'عملية بسيطة وسريعة'}[lang]}</p>
          </motion.div>
        </motion.div>

        {/* Call to Action Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStartRenting}
          className="bg-gradient-to-r from-saas-primary-via to-saas-primary-end text-white font-black text-lg px-12 py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all mb-12 border border-white/20"
        >
          {{fr: '🚀 Commencer la Location', ar: '🚀 ابدأ الاستئجار'}[lang]}
        </motion.button>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-slate-300 flex flex-col items-center gap-2 mt-12"
        >
          <p className="text-sm font-bold">{{fr: 'Faites défiler pour explorer', ar: 'مرر للاستكشاف'}[lang]}</p>
          <ChevronDown size={24} className="text-saas-primary-via" />
        </motion.div>
      </div>
    </div>
  );
};
