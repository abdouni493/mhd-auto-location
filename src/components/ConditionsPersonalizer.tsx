import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer } from 'lucide-react';
import { generateConditionsPrintHTML, getConditionsTemplate } from '../constants/ConditionsTemplates';

interface ConditionsPersonalizerProps {
  lang: 'fr' | 'ar';
  reservationId?: string;
  onClose: () => void;
  onSave?: (conditions: string) => void;
  agencyId?: string;
}

export const ConditionsPersonalizer: React.FC<ConditionsPersonalizerProps> = ({
  lang,
  reservationId,
  onClose,
  onSave,
  agencyId
}) => {
  const [conditionsLanguage, setConditionsLanguage] = useState<'ar' | 'fr'>('ar');
  const [isPrinting, setIsPrinting] = useState(false);
  const template = getConditionsTemplate(conditionsLanguage);
  const isArabic = conditionsLanguage === 'ar';
  const dir = isArabic ? 'rtl' : 'ltr';
  const textAlign = isArabic ? 'right' : 'left';

  const handlePrint = () => {
    setIsPrinting(true);
    const content = generateConditionsPrintHTML(conditionsLanguage);
    setTimeout(() => {
      const printWindow = window.open('', '', 'height=800,width=900');
      if (printWindow) {
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        setTimeout(() => setIsPrinting(false), 100);
      }
    }, 300);
  };

  return (
    <>
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
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {conditionsLanguage === 'fr' ? 'Conditions de Location' : 'شروط الإيجار'}
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {template.subtitle}
                </p>
              </div>
              {/* Template Selector */}
              <div className="flex gap-2 ml-8">
                <button
                  onClick={() => setConditionsLanguage('fr')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    conditionsLanguage === 'fr'
                      ? 'bg-white text-blue-600'
                      : 'bg-blue-500 text-white hover:bg-blue-400'
                  }`}
                >
                  🇫🇷 Français
                </button>
                <button
                  onClick={() => setConditionsLanguage('ar')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    conditionsLanguage === 'ar'
                      ? 'bg-white text-blue-600'
                      : 'bg-blue-500 text-white hover:bg-blue-400'
                  }`}
                >
                  🇸🇦 العربية
                </button>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto bg-gradient-to-b from-gray-50 to-white p-8">
            {/* Conditions Table - Professional Display */}
            <div className="bg-white rounded-lg shadow-lg p-0 mx-auto" style={{ maxWidth: '900px' }}>
              <div style={{ direction: dir, textAlign }} className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="w-12 px-3 py-3 text-center font-semibold text-gray-700">#</th>
                      <th className="w-1/3 px-4 py-3 font-semibold text-gray-700" style={{ textAlign }}>
                        {conditionsLanguage === 'fr' ? 'Condition' : 'الشرط'}
                      </th>
                      <th className="flex-1 px-4 py-3 font-semibold text-gray-700" style={{ textAlign }}>
                        {conditionsLanguage === 'fr' ? 'Description' : 'التفاصيل'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {template.conditions.map((condition, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-blue-50 transition-colors"
                      >
                        <td className="px-3 py-3 text-center font-bold text-blue-600">{index + 1}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{condition.title}</td>
                        <td className="px-4 py-3 text-gray-700 leading-relaxed">{condition.content}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signature Preview Area */}
              <div className="bg-white px-6 py-8 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="flex flex-col" style={{ direction: dir }}>
                    <div className="h-12 border-b-2 border-gray-400 mb-3"></div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {template.clientSignatureLabel}
                    </p>
                  </div>
                  <div className="flex flex-col" style={{ direction: dir }}>
                    <div className="h-12 border-b-2 border-gray-400 mb-3"></div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {template.agencySignatureLabel}
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Alert */}
              <div className="bg-blue-50 border-t border-blue-200 px-6 py-4">
                <p className="text-blue-900 text-sm">
                  <span className="font-semibold">ℹ️ {conditionsLanguage === 'fr' ? 'Info:' : 'معلومة:'}</span>{' '}
                  {conditionsLanguage === 'fr' 
                    ? 'Modèle standard optimisé pour impression A4 sur une seule page.' 
                    : 'نموذج قياسي محسّن للطباعة على صفحة A4 واحدة.'}
                </p>
              </div>
            </div>
          </div>

          {/* Footer with Actions */}
          <div className="bg-gray-100 px-8 py-4 flex items-center justify-between border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-all"
            >
              {conditionsLanguage === 'fr' ? 'Fermer' : 'إغلاق'}
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Printer size={18} />
              {isPrinting ? (conditionsLanguage === 'fr' ? 'Impression...' : 'جاري الطباعة...') : (conditionsLanguage === 'fr' ? 'Imprimer' : 'طباعة')}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};
