import React from 'react';
import { Language } from '../../types';
import { motion } from 'motion/react';
import { ExternalLink } from 'lucide-react';

interface ContactsWebsiteProps {
  lang: Language;
  contactInfo: any;
  websiteSettings: any;
}

export const ContactsWebsite: React.FC<ContactsWebsiteProps> = ({
  lang,
  contactInfo,
  websiteSettings,
}) => {
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
            📞 {{fr: 'Nous Contacter', ar: 'اتصل بنا'}[lang]}
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
            {{fr: 'Notre équipe est disponible pour répondre à vos questions', ar: 'فريقنا متاح للرد على أسئلتك'}[lang]}
          </p>
        </motion.div>

        {/* Main Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Left - Agency Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8 space-y-8 border border-slate-100"
          >
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">
                {websiteSettings?.name || 'Luxdrive Premium'}
              </h2>
              <p className="text-slate-600 text-lg font-medium">{websiteSettings?.description}</p>
            </div>

            {/* Contact Methods */}
            <div className="space-y-4">
              {contactInfo?.phone && (
                <motion.a
                  whileHover={{ scale: 1.05, x: 10 }}
                  href={`tel:${contactInfo.phone}`}
                  className="flex items-center gap-4 p-4 bg-gradient-to-br from-saas-success-start/10 to-saas-success-end/10 rounded-xl hover:shadow-lg transition-all border border-saas-success-start/30 hover:border-saas-success-start/60"
                >
                  <div className="text-4xl">☎️</div>
                  <div>
                    <p className="text-sm text-slate-500 font-bold">{{fr: 'Téléphone', ar: 'الهاتف'}[lang]}</p>
                    <p className="text-xl font-black text-slate-900">{contactInfo.phone}</p>
                  </div>
                </motion.a>
              )}

              {contactInfo?.email && (
                <motion.a
                  whileHover={{ scale: 1.05, x: 10 }}
                  href={`mailto:${contactInfo.email}`}
                  className="flex items-center gap-4 p-4 bg-gradient-to-br from-saas-primary-via/10 to-saas-primary-end/10 rounded-xl hover:shadow-lg transition-all border border-saas-primary-via/30 hover:border-saas-primary-via/60"
                >
                  <div className="text-4xl">📧</div>
                  <div>
                    <p className="text-sm text-slate-500 font-bold">{{fr: 'E-mail', ar: 'البريد الإلكتروني'}[lang]}</p>
                    <p className="text-xl font-black text-slate-900">{contactInfo.email}</p>
                  </div>
                </motion.a>
              )}

              {contactInfo?.address && (
                <motion.div
                  whileHover={{ scale: 1.05, x: 10 }}
                  className="flex items-center gap-4 p-4 bg-gradient-to-br from-saas-warning-start/10 to-saas-warning-end/10 rounded-xl hover:shadow-lg transition-all border border-saas-warning-start/30 hover:border-saas-warning-start/60"
                >
                  <div className="text-4xl">📍</div>
                  <div>
                    <p className="text-sm text-slate-500 font-bold">{{fr: 'Adresse', ar: 'العنوان'}[lang]}</p>
                    <p className="text-xl font-black text-slate-900">{contactInfo.address}</p>
                  </div>
                </motion.div>
              )}

              {contactInfo?.whatsapp && (
                <motion.a
                  whileHover={{ scale: 1.05, x: 10 }}
                  href={`https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-gradient-to-br from-saas-success-start/10 to-saas-success-start/20 rounded-xl hover:shadow-lg transition-all border border-saas-success-start/30 hover:border-saas-success-start/60"
                >
                  <div className="text-4xl">💬</div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-500 font-bold">WhatsApp</p>
                    <p className="text-xl font-black text-slate-900 flex items-center gap-2">
                      {contactInfo.whatsapp}
                      <ExternalLink size={16} />
                    </p>
                  </div>
                </motion.a>
              )}
            </div>
          </motion.div>

          {/* Right - Social Media */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl shadow-xl p-8 space-y-8"
          >
            <h3 className="text-2xl font-black text-slate-900">🌐 {{fr: 'Suivez-nous', ar: 'تابعنا'}[lang]}</h3>

            <div className="grid grid-cols-2 gap-4">
              {contactInfo?.facebook && (
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href={contactInfo.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white text-center hover:shadow-lg transition-all"
                >
                  <p className="text-5xl mb-2">👍</p>
                  <p className="font-black">Facebook</p>
                </motion.a>
              )}

              {contactInfo?.instagram && (
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href={`https://instagram.com/${contactInfo.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-6 text-white text-center hover:shadow-lg transition-all"
                >
                  <p className="text-5xl mb-2">📷</p>
                  <p className="font-black">Instagram</p>
                </motion.a>
              )}

              {contactInfo?.tiktok && (
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href={`https://tiktok.com/@${contactInfo.tiktok}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white text-center hover:shadow-lg transition-all"
                >
                  <p className="text-5xl mb-2">🎵</p>
                  <p className="font-black">TikTok</p>
                </motion.a>
              )}

              {contactInfo?.whatsapp && (
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href={`https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white text-center hover:shadow-lg transition-all"
                >
                  <p className="text-5xl mb-2">💬</p>
                  <p className="font-black">WhatsApp</p>
                </motion.a>
              )}
            </div>
          </motion.div>
        </div>

        {/* Contact Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-xl p-8 max-w-2xl mx-auto"
        >
          <h3 className="text-2xl font-black text-slate-900 mb-6">
            ✉️ {{fr: 'Envoyez-nous un message', ar: 'أرسل لنا رسالة'}[lang]}
          </h3>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">
                {{fr: 'Votre nom', ar: 'اسمك'}[lang]}
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-600 focus:outline-none transition-colors"
                placeholder={{fr: 'Jean Dupont', ar: 'محمد علي'}[lang]}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">
                {{fr: 'Votre e-mail', ar: 'بريدك الإلكتروني'}[lang]}
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-600 focus:outline-none transition-colors"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">
                {{fr: 'Sujet', ar: 'الموضوع'}[lang]}
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-600 focus:outline-none transition-colors"
                placeholder={{fr: 'Comment puis-je vous aider?', ar: 'كيف يمكنني مساعدتك؟'}[lang]}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">
                {{fr: 'Message', ar: 'الرسالة'}[lang]}
              </label>
              <textarea
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-600 focus:outline-none transition-colors resize-none"
                placeholder={{fr: 'Votre message...', ar: 'رسالتك...'}[lang]}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black py-4 px-6 rounded-xl transition-all"
            >
              {{fr: 'Envoyer le message', ar: 'إرسال الرسالة'}[lang]}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
