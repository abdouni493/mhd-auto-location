import React, { useRef } from 'react';
import { Language } from '../../types';
import { motion, useScroll, useTransform } from 'motion/react';
import { ChevronDown, Shield, Zap, Star, ArrowRight } from 'lucide-react';

// ─── Colour tokens for this page ───────────────────────────────────────────
const C = {
  cyan:      '#22D3EE',
  violet:    '#8B5CF6',
  cyanDim:   'rgba(34,211,238,0.15)',
  violetDim: 'rgba(139,92,246,0.12)',
  bg:        '#050B18',
  surface:   '#0A1628',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const shortName = (name: string | undefined) =>
  name ? name.split(/\s+/).slice(0, 3).join(' ') : 'AutoLocation';

// ─── Pure CSS + Framer Motion hero visual ───────────────────────────────────
function HeroVisual({ lang, logo }: { lang: Language; logo?: string }) {
  const floatingCards = [
    {
      icon: '🏆',
      value: '#1',
      label: { fr: 'en Algérie', ar: 'في الجزائر' },
      delay: 0,
      className: 'top-6 right-0',
    },
    {
      icon: '⭐',
      value: '4.9/5',
      label: { fr: 'Note moyenne', ar: 'التقييم' },
      delay: 0.8,
      className: 'top-1/2 -left-2',
    },
    {
      icon: '⚡',
      value: '< 5 min',
      label: { fr: 'Réservation', ar: 'وقت الحجز' },
      delay: 1.6,
      className: 'bottom-10 right-6',
    },
  ];

  return (
    <div className="relative w-full h-[500px] flex items-center justify-center">

      {/* Outer slow rotating ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{ border: '1px solid rgba(34,211,238,0.12)' }}
      >
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
          style={{ background: C.cyan, boxShadow: `0 0 14px ${C.cyan}` }} />
      </motion.div>

      {/* Middle violet counter-ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        className="absolute w-[290px] h-[290px] rounded-full"
        style={{ border: '1px dashed rgba(139,92,246,0.22)' }}
      >
        <div className="absolute top-0 right-6 w-2 h-2 rounded-full"
          style={{ background: C.violet, boxShadow: `0 0 10px ${C.violet}` }} />
      </motion.div>

      {/* Inner pulsing ring */}
      <motion.div
        animate={{ scale: [1, 1.07, 1], opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute w-[180px] h-[180px] rounded-full"
        style={{ border: '1px solid rgba(34,211,238,0.38)' }}
      />

      {/* Center glowing element */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative w-32 h-32 rounded-3xl flex items-center justify-center z-10"
        style={{
          background: `linear-gradient(135deg, rgba(34,211,238,0.12), rgba(139,92,246,0.12))`,
          border: `1px solid rgba(34,211,238,0.38)`,
          boxShadow: `0 0 50px rgba(34,211,238,0.22), 0 0 100px rgba(34,211,238,0.08)`,
        }}
      >
        {logo ? (
          <img src={logo} alt="Logo" className="w-full h-full object-cover rounded-3xl" referrerPolicy="no-referrer" />
        ) : (
          <span style={{ fontSize: '3.8rem' }}>🚗</span>
        )}
      </motion.div>

      {/* Floating stat cards */}
      {floatingCards.map((card, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -7, 0] }}
          transition={{ delay: card.delay, duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute ${card.className} px-4 py-3 rounded-2xl z-20`}
          style={{
            background: 'rgba(10,22,40,0.88)',
            border: '1px solid rgba(34,211,238,0.18)',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{card.icon}</span>
            <div>
              <p className="font-black text-base leading-none mb-0.5"
                style={{ color: C.cyan, fontFamily: 'var(--font-display)' }}>
                {card.value}
              </p>
              <p className="text-vel-muted text-[11px]">{card.label[lang]}</p>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Corner accent dots */}
      <div className="absolute top-8 left-8 w-1.5 h-1.5 rounded-full opacity-60"
        style={{ background: C.violet }} />
      <div className="absolute bottom-12 left-12 w-1 h-1 rounded-full opacity-40"
        style={{ background: C.cyan }} />
      <div className="absolute top-16 right-16 w-1 h-1 rounded-full opacity-50"
        style={{ background: C.cyan }} />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
interface WelcomeProps {
  lang: Language;
  websiteSettings: any;
  onStartRenting: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ lang, websiteSettings, onStartRenting }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.4], [0, -80]);

  const stats = [
    { num: '#1', label: { fr: 'en Algérie', ar: 'في الجزائر' } },
    { num: '10K+', label: { fr: 'Clients', ar: 'عملاء' } },
    { num: '99%',  label: { fr: 'Satisfaction', ar: 'رضا العملاء' } },
  ];

  const features = [
    {
      icon: Shield,
      title: { fr: 'Assurance incluse', ar: 'التأمين مشمول' },
      desc:  { fr: 'Tous nos véhicules sont assurés et couverts', ar: 'جميع سياراتنا مؤمنة ومغطاة' },
    },
    {
      icon: Zap,
      title: { fr: 'Réservation rapide', ar: 'حجز سريع' },
      desc:  { fr: 'En 3 étapes simples, réservez votre véhicule', ar: 'في 3 خطوات بسيطة احجز سيارتك' },
    },
    {
      icon: Star,
      title: { fr: 'Flotte premium', ar: 'أسطول فاخر' },
      desc:  { fr: 'Véhicules récents, propres et bien entretenus', ar: 'سيارات حديثة ونظيفة وجيدة الصيانة' },
    },
  ];

  return (
    <div ref={containerRef} className="relative overflow-hidden" style={{ background: C.bg }}>

      {/* ══ HERO SECTION ══ */}
      <section className="relative min-h-screen flex items-center">

        {/* Fine diagonal grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `linear-gradient(${C.cyan} 1px, transparent 1px), linear-gradient(90deg, ${C.cyan} 1px, transparent 1px)`,
          backgroundSize: '70px 70px',
        }} />

        {/* Cyan top glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse 75% 55% at 60% -10%, ${C.cyanDim}, transparent)`,
        }} />

        {/* Violet bottom-left blob */}
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] pointer-events-none" style={{
          background: `radial-gradient(circle, ${C.violetDim}, transparent 70%)`,
          transform: 'translate(-30%, 30%)',
        }} />

        {/* Horizontal accent line */}
        <div className="absolute top-[48%] left-0 right-0 h-px pointer-events-none" style={{
          background: `linear-gradient(90deg, transparent, ${C.cyan}22, ${C.violet}33, transparent)`,
        }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-screen py-24">

            {/* LEFT: Text */}
            <motion.div style={{ opacity: heroOpacity, y: heroY }} className="space-y-8">

              {/* Badge pill */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ border: `1px solid ${C.cyan}40`, background: `${C.cyan}10` }}
              >
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.cyan }} />
                <span className="text-xs font-bold tracking-[0.2em] uppercase"
                  style={{ color: C.cyan, fontFamily: 'var(--font-display)' }}>
                  {{ fr: 'Location Premium · Algérie', ar: 'تأجير فاخر · الجزائر' }[lang]}
                </span>
              </motion.div>

              {/* Agency name */}
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-sm font-bold tracking-[0.3em] uppercase"
                style={{ color: C.violet, fontFamily: 'var(--font-display)' }}
              >
                {shortName(websiteSettings?.name)}
              </motion.p>

              {/* Main headline */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, delay: 0.2 }}
              >
                <h1 className="font-black leading-[0.92]" style={{ fontFamily: 'var(--font-display)' }}>
                  <span className="block text-5xl sm:text-6xl xl:text-7xl text-vel-white mb-1">
                    {{ fr: 'Vitesse', ar: 'سرعة' }[lang]}
                  </span>
                  <span className="block text-5xl sm:text-6xl xl:text-7xl" style={{
                    color: C.cyan,
                    textShadow: `0 0 30px ${C.cyan}99, 0 0 60px ${C.cyan}44`,
                  }}>
                    {{ fr: '& Prestige', ar: '& فخامة' }[lang]}
                  </span>
                </h1>
              </motion.div>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.38 }}
                className="text-vel-silver text-base leading-relaxed max-w-md"
              >
                {websiteSettings?.description || (lang === 'fr'
                  ? "Des véhicules d'exception pour des expériences inoubliables. Réservez en quelques clics."
                  : 'مركبات استثنائية لتجارب لا تُنسى. احجز بنقرات قليلة.'
                )}
              </motion.p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-wrap gap-4"
              >
                <motion.button
                  onClick={onStartRenting}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-300"
                  style={{
                    fontFamily: 'var(--font-display)',
                    background: `linear-gradient(135deg, ${C.cyan}, #06B6D4)`,
                    color: '#050B18',
                    boxShadow: `0 0 28px ${C.cyan}55, 0 4px 16px rgba(0,0,0,0.4)`,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 48px ${C.cyan}88, 0 8px 24px rgba(0,0,0,0.5)`;
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px) scale(1.04)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 28px ${C.cyan}55, 0 4px 16px rgba(0,0,0,0.4)`;
                    (e.currentTarget as HTMLElement).style.transform = '';
                  }}
                >
                  {{ fr: 'Explorer la flotte', ar: 'استكشف الأسطول' }[lang]}
                  <ArrowRight size={17} />
                </motion.button>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.65 }}
                className="flex gap-8 pt-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
              >
                {stats.map((s, i) => (
                  <div key={i}>
                    <p className="font-black text-2xl" style={{ color: C.cyan, fontFamily: 'var(--font-display)' }}>
                      {s.num}
                    </p>
                    <p className="text-vel-muted text-xs">{s.label[lang]}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* RIGHT: CSS Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.1, delay: 0.25, ease: 'easeOut' }}
              className="relative"
            >
              {/* Glow halo */}
              <div className="absolute inset-0 pointer-events-none rounded-full" style={{
                background: `radial-gradient(ellipse at center, ${C.cyanDim}, transparent 68%)`,
              }} />
              <HeroVisual lang={lang} logo={websiteSettings?.logo} />
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ color: C.cyan }}
        >
          <span className="text-xs tracking-widest uppercase opacity-60" style={{ fontFamily: 'var(--font-display)' }}>
            {{ fr: 'Défiler', ar: 'مرر' }[lang]}
          </span>
          <ChevronDown size={18} />
        </motion.div>
      </section>

      {/* ══ FEATURES SECTION ══ */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8" style={{
        background: '#070E1C',
        borderTop: '1px solid rgba(34,211,238,0.1)',
        borderBottom: '1px solid rgba(34,211,238,0.1)',
      }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <p className="font-bold text-xs tracking-[0.25em] uppercase mb-4"
              style={{ color: C.cyan, fontFamily: 'var(--font-display)' }}>
              {{ fr: 'Pourquoi nous choisir', ar: 'لماذا تختارنا' }[lang]}
            </p>
            <h2 className="font-black text-4xl text-vel-white" style={{ fontFamily: 'var(--font-display)' }}>
              {{ fr: "L'expérience automobile premium", ar: 'تجربة السيارات الفاخرة' }[lang]}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                whileHover={{ y: -6 }}
                className="rounded-2xl p-8 space-y-4 transition-all duration-300 cursor-default"
                style={{
                  background: 'rgba(34,211,238,0.04)',
                  border: '1px solid rgba(34,211,238,0.12)',
                  backdropFilter: 'blur(12px)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${C.cyan}35`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px ${C.cyan}12`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(34,211,238,0.12)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${C.cyan}14`, border: `1px solid ${C.cyan}35` }}>
                  <f.icon size={22} style={{ color: C.cyan }} />
                </div>
                <h3 className="font-bold text-lg text-vel-white" style={{ fontFamily: 'var(--font-display)' }}>
                  {f.title[lang]}
                </h3>
                <p className="text-vel-muted text-sm leading-relaxed">{f.desc[lang]}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ══ */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden" style={{ background: C.bg }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse at center, ${C.cyanDim}, transparent 65%)`,
        }} />

        <div className="absolute top-1/2 left-0 right-0 flex items-center justify-center gap-4 pointer-events-none">
          <div className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${C.cyan}22)` }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.cyan }} />
          <div className="h-px flex-1" style={{ background: `linear-gradient(to left, transparent, ${C.cyan}22)` }} />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <h2 className="font-black text-5xl text-vel-white mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            {{ fr: 'Prêt à prendre la route ?', ar: 'مستعد للانطلاق؟' }[lang]}
          </h2>
          <p className="text-vel-silver text-lg mb-10">
            {{ fr: "Réservez votre véhicule dès aujourd'hui et vivez l'expérience.", ar: 'احجز سيارتك اليوم وعش التجربة.' }[lang]}
          </p>
          <motion.button
            onClick={onStartRenting}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 text-lg px-12 py-5 rounded-xl font-bold transition-all duration-300"
            style={{
              fontFamily: 'var(--font-display)',
              background: `linear-gradient(135deg, ${C.cyan}, #06B6D4)`,
              color: '#050B18',
              boxShadow: `0 0 32px ${C.cyan}55`,
            }}
          >
            🚗 {{ fr: 'Voir tous les véhicules', ar: 'عرض جميع السيارات' }[lang]}
          </motion.button>
        </motion.div>
      </section>
    </div>
  );
};
