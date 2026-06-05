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
    const timer = setTimeout(onBackHome, 10000);
    return () => clearTimeout(timer);
  }, [onBackHome]);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-hidden"
      style={{ background: '#050B18' }}>

      {/* Background radial glows */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.12), transparent 60%)' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08), transparent 60%)' }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(#22D3EE 1px, transparent 1px), linear-gradient(90deg, #22D3EE 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: 400, x: (i - 4) * 80, opacity: 0 }}
          animate={{ y: -500, opacity: [0, 1, 0] }}
          transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
          className="absolute text-3xl pointer-events-none"
        >
          {['🎉', '✨', '🎊', '⭐', '🚗', '💫', '🎈', '🏆'][i]}
        </motion.div>
      ))}

      {/* Content card */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 200, damping: 20 }}
        className="relative z-10 text-center max-w-lg w-full rounded-3xl p-10"
        style={{
          background: 'rgba(10,22,40,0.9)',
          border: '1px solid rgba(34,211,238,0.25)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 60px rgba(34,211,238,0.15), 0 40px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex justify-center mb-8"
        >
          <div className="relative w-28 h-28">
            {/* Outer glow ring */}
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full"
              style={{ background: 'rgba(34,211,238,0.2)' }}
            />
            {/* Icon container */}
            <div className="relative w-full h-full rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(139,92,246,0.15))', border: '2px solid rgba(34,211,238,0.4)' }}>
              <CheckCircle size={56} style={{ color: '#22D3EE' }} />
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="font-black text-5xl text-vel-white mb-3"
          style={{ fontFamily: 'var(--font-display)', textShadow: '0 0 30px rgba(34,211,238,0.4)' }}
        >
          {{ fr: 'Merci !', ar: 'شكراً !' }[lang]}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="text-vel-silver text-lg font-bold mb-8"
        >
          {{ fr: 'Votre réservation a été créée avec succès', ar: 'تم إنشاء حجزك بنجاح' }[lang]}
        </motion.p>

        {/* Info box */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="rounded-2xl p-5 mb-4 text-left"
          style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)' }}
        >
          <p className="text-vel-silver font-bold text-sm mb-1">
            ☎️ {{ fr: 'Nous vous appellerons bientôt pour confirmer', ar: 'سنتصل بك قريباً للتأكيد' }[lang]}
          </p>
          <p className="text-vel-muted text-xs">
            {{ fr: 'Veuillez garder votre téléphone à proximité', ar: 'يرجى إبقاء هاتفك قريباً' }[lang]}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62, duration: 0.5 }}
          className="rounded-2xl p-4 mb-8"
          style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}
        >
          <p className="text-vel-muted text-sm">
            📧 {{ fr: 'Un email de confirmation vous a été envoyé', ar: 'تم إرسال بريد تأكيد لك' }[lang]}
          </p>
        </motion.div>

        {/* Redirect note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-vel-dim text-xs mb-6"
        >
          {{ fr: 'Redirection automatique dans quelques secondes…', ar: 'إعادة توجيه تلقائية في بضع ثوانٍ…' }[lang]}
        </motion.p>

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.5 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onBackHome}
          className="btn-vel-cyan px-10 py-3 text-sm"
        >
          {{ fr: "Retour à l'accueil", ar: 'العودة إلى الرئيسية' }[lang]}
        </motion.button>
      </motion.div>
    </div>
  );
};
