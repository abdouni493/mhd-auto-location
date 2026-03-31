import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Mail, Loader } from 'lucide-react';
import { Language, ReservationDetails } from '../types';
import { EmailService } from '../services/emailService';
import { DatabaseService } from '../services/DatabaseService';

interface SendContractModalProps {
  lang: Language;
  reservation: ReservationDetails;
  onClose: () => void;
}

export const SendContractModal: React.FC<SendContractModalProps> = ({
  lang,
  reservation,
  onClose,
}) => {
  const [clientEmail, setClientEmail] = useState(reservation.client.email || '');
  const [senderEmail, setSenderEmail] = useState('');
  const [templateLang, setTemplateLang] = useState<'fr' | 'ar'>('fr');
  const [loading, setLoading] = useState(false);
  const [loadingSender, setLoadingSender] = useState(true);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [saveEmailToClient, setSaveEmailToClient] = useState(false);

  // Load sender email from website contacts on mount
  useEffect(() => {
    const loadSenderEmail = async () => {
      try {
        setLoadingSender(true);
        const contacts = await DatabaseService.getWebsiteContacts();
        if (contacts.email) {
          setSenderEmail(contacts.email);
        } else {
          setNotification({
            type: 'error',
            message: lang === 'fr' 
              ? 'Email de contact non configuré. Veuillez le configurer dans les paramètres.'
              : 'لم يتم تكوين بريد الاتصال. يرجى تكوينه في الإعدادات.',
          });
        }
      } catch (error) {
        console.error('Error loading sender email:', error);
        setNotification({
          type: 'error',
          message: lang === 'fr' 
            ? 'Erreur lors du chargement de l\'email de contact'
            : 'خطأ في تحميل بريد الاتصال',
        });
      } finally {
        setLoadingSender(false);
      }
    };

    loadSenderEmail();
  }, [lang]);

  // Clear notification after 4 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleSendEmail = async () => {
    // Validate email
    if (!clientEmail || !clientEmail.includes('@')) {
      setNotification({
        type: 'error',
        message: lang === 'fr' ? 'Veuillez entrer une adresse email valide' : 'يرجى إدخال عنوان بريد إلكتروني صحيح',
      });
      return;
    }

    if (!senderEmail) {
      setNotification({
        type: 'error',
        message: lang === 'fr' 
          ? 'Email de contact non configuré'
          : 'بريد الاتصال غير مكون',
      });
      return;
    }

    try {
      setLoading(true);
      setNotification({
        type: 'info',
        message: lang === 'fr' ? 'Envoi du contrat...' : 'جاري إرسال العقد...',
      });

      // Generate contract HTML
      const htmlContent = await EmailService.generateContractHTML(reservation, templateLang);

      // Send email via Edge Function
      const result = await EmailService.sendContractEmail({
        clientEmail,
        clientName: `${reservation.client.firstName} ${reservation.client.lastName}`,
        reservationId: reservation.id,
        senderEmail,
        htmlContent,
        templateLang,
      });

      if (result.success) {
        // If requested, save email to client record
        if (saveEmailToClient && clientEmail !== reservation.client.email) {
          try {
            await DatabaseService.updateClient(reservation.client.id, {
              email: clientEmail,
            });
          } catch (updateError) {
            console.error('Error updating client email:', updateError);
            // Don't fail the whole operation if email update fails
          }
        }

        setNotification({
          type: 'success',
          message: lang === 'fr' 
            ? 'Contrat envoyé avec succès! ✅'
            : 'تم إرسال العقد بنجاح! ✅',
        });

        // Close modal after success
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setNotification({
          type: 'error',
          message: result.message || (lang === 'fr' ? 'Erreur lors de l\'envoi' : 'خطأ في الإرسال'),
        });
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      setNotification({
        type: 'error',
        message: error.message || (lang === 'fr' 
          ? 'Erreur lors de l\'envoi du contrat'
          : 'خطأ في إرسال العقد'),
      });
    } finally {
      setLoading(false);
    }
  };

  const bgNotificationColor = 
    notification?.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
    notification?.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
    'bg-blue-50 border-blue-200 text-blue-800';

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6" />
              <h2 className="text-2xl font-black">
                {lang === 'fr' ? '📧 Envoyer le Contrat' : '📧 إرسال العقد'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Client Info */}
            <div className="space-y-3">
              <h3 className="font-bold text-saas-text-main">
                👤 {lang === 'fr' ? 'Client' : 'العميل'}
              </h3>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="font-bold text-saas-text-main">
                  {reservation.client.firstName} {reservation.client.lastName}
                </p>
                <p className="text-sm text-saas-text-muted">
                  {lang === 'fr' ? 'Réservation #' : 'الحجز #'}{reservation.id}
                </p>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="block font-bold text-saas-text-main">
                📧 {lang === 'fr' ? 'Email du Client' : 'بريد العميل'}
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@example.com"
                disabled={loading}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors disabled:bg-slate-100"
              />
            </div>

            {/* Template Language Selection */}
            <div className="space-y-2">
              <label className="block font-bold text-saas-text-main">
                🌐 {lang === 'fr' ? 'Langue du Contrat' : 'لغة العقد'}
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setTemplateLang('fr')}
                  disabled={loading}
                  className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all ${
                    templateLang === 'fr'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-100 text-saas-text-main hover:bg-slate-200'
                  } disabled:opacity-50`}
                >
                  🇫🇷 Français
                </button>
                <button
                  onClick={() => setTemplateLang('ar')}
                  disabled={loading}
                  className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all ${
                    templateLang === 'ar'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-100 text-saas-text-main hover:bg-slate-200'
                  } disabled:opacity-50`}
                >
                  🇸🇦 العربية
                </button>
              </div>
            </div>

            {/* Sender Email Display */}
            <div className="space-y-2">
              <label className="block font-bold text-saas-text-main">
                {lang === 'fr' ? 'De (Email de contact):' : 'من (بريد الاتصال):'}
              </label>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                {loadingSender ? (
                  <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-saas-text-muted">
                      {lang === 'fr' ? 'Chargement...' : 'جاري التحميل...'}
                    </span>
                  </div>
                ) : (
                  <p className="font-mono text-sm text-saas-text-main break-all">{senderEmail || 'N/A'}</p>
                )}
              </div>
            </div>

            {/* Save Email Checkbox */}
            {clientEmail && clientEmail !== reservation.client.email && (
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-blue-50 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  checked={saveEmailToClient}
                  onChange={(e) => setSaveEmailToClient(e.target.checked)}
                  disabled={loading}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-bold text-saas-text-main">
                  {lang === 'fr' 
                    ? 'Enregistrer cet email pour le client'
                    : 'احفظ هذا البريد للعميل'}
                </span>
              </label>
            )}

            {/* Notification */}
            <AnimatePresence>
              {notification && (
                <motion.div
                  key="notification"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-4 rounded-lg border-2 text-sm font-bold ${bgNotificationColor}`}
                >
                  {notification.message}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Buttons */}
          <div className="bg-slate-50 p-6 border-t border-slate-200 flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-lg font-bold bg-slate-200 hover:bg-slate-300 text-saas-text-main transition-colors disabled:opacity-50"
            >
              {lang === 'fr' ? 'Annuler' : 'إلغاء'}
            </button>
            <button
              onClick={handleSendEmail}
              disabled={loading || !clientEmail || !senderEmail}
              className="flex-1 py-3 px-4 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  {lang === 'fr' ? 'Envoi...' : 'جاري الإرسال...'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {lang === 'fr' ? 'Envoyer' : 'إرسال'}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
