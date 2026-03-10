import React, { useEffect } from 'react';
import { Language } from '../../types';
import { motion } from 'motion/react';
import { CheckCircle } from 'lucide-react';

interface ThankYouPageProps {
  lang: Language;
  onBackHome: () => void;
}

export const ThankYouPage: React.FC<ThankYouPageProps> = ({ lang, onBackHome }) => {
  useEffect(() => {
    // Auto-redirect after 10 seconds
    const timer = setTimeout(onBackHome, 10000);
    return () => clearTimeout(timer);
  }, [onBackHome]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 flex items-center justify-center p-4 z-50">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0, 0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white rounded-full"
        />
      </div>

      {/* Content */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="relative z-10 text-center max-w-md"
      >
        {/* Success Icon */}
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity, type: 'tween' }}
          className="mb-6 flex justify-center"
        >
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-white rounded-full opacity-20"
            />
            <CheckCircle size={120} className="text-white relative z-10" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-4xl md:text-5xl font-black text-white mb-4"
        >
          {{fr: 'Merci!', ar: 'شكراً!'}[lang]}
        </motion.h1>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-xl text-white/90 font-bold mb-6"
        >
          {{fr: 'Votre réservation a été créée avec succès', ar: 'تم إنشاء حجزك بنجاح'}[lang]}
        </motion.p>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white/20 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/30"
        >
          <p className="text-white/90 font-bold mb-2">
            ☎️ {{fr: 'Nous vous appellerons bientôt pour confirmer votre réservation', ar: 'سنتصل بك قريباً لتأكيد حجزك'}[lang]}
          </p>
          <p className="text-white/80 text-sm">
            {{fr: 'Veuillez garder votre téléphone à proximité', ar: 'يرجى إبقاء هاتفك قريباً'}[lang]}
          </p>
        </motion.div>

        {/* Email Notification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-8 border border-white/20"
        >
          <p className="text-white/90 text-sm">
            📧 {{fr: 'Un email de confirmation vous a été envoyé avec les détails de votre commande', ar: 'تم إرسال بريد تأكيد لك مع تفاصيل طلبك'}[lang]}
          </p>
        </motion.div>

        {/* Countdown */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-white/70 text-sm mb-8"
        >
          {{fr: 'Redirection automatique dans quelques secondes...', ar: 'إعادة التوجيه التلقائي في بضع ثوان...'}[lang]}
        </motion.p>

        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBackHome}
          className="bg-white text-green-600 font-black py-3 px-8 rounded-xl hover:shadow-lg transition-all"
        >
          {{fr: 'Retour à l\'accueil', ar: 'العودة إلى الرئيسية'}[lang]}
        </motion.button>
      </motion.div>

      {/* Floating Emojis */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: Math.random() * 400 - 200, y: 600 }}
          animate={{ y: -600, x: Math.random() * 200 - 100 }}
          transition={{ duration: 3 + i, repeat: Infinity }}
          className="absolute text-4xl"
        >
          {['🎉', '🎊', '✨', '🏆', '⭐'][i]}
        </motion.div>
      ))}
    </div>
  );
};
