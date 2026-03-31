import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Edit2, Save, Printer, FileText } from 'lucide-react';
import { supabase } from '../supabase';
import { ContractTemplates } from './ContractTemplates';

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
  const [conditions, setConditions] = useState<string[]>([
    'السن: يجب أن يكون السائق 20 عاماً على الأقل، مع رخصة قيادة منذ سنتين على الأقل.',
    'جواز السفر: إيداع جواز السفر البيومتري + تأمين ابتدائي من 30,000.00 دج.',
    'الوقود: الوقود على نفقة الزبون.',
    'الدفع: يتم الدفع نقداً عند تسليم السيارة.',
    'النظافة: السيارة تُسلم نظيفة وتُرجع بنفس الحالة، وإلا غرامة غسيل 1000 دج.',
  ]);
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedElements, setSelectedElements] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const [fontColor, setFontColor] = useState('#333333');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showContractTemplates, setShowContractTemplates] = useState(false);

  // Load saved conditions from database
  useEffect(() => {
    if (reservationId) {
      loadSavedConditions();
    }
  }, [reservationId]);

  const loadSavedConditions = async () => {
    try {
      setLoading(true);
      if (!reservationId) return;

      const { data, error } = await supabase
        .from('reservations')
        .select('conditions_text')
        .eq('id', reservationId)
        .single();

      if (error) {
        console.error('Error loading conditions:', error);
        return;
      }

      if (data?.conditions_text) {
        setConditions(data.conditions_text.split('\n').filter((c: string) => c.trim()));
      }
    } catch (error) {
      console.error('Error loading conditions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCondition = (index: number) => {
    setEditingIndex(index);
    setEditText(conditions[index]);
    setSelectedElements(index);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editText.trim()) {
      const updatedConditions = [...conditions];
      updatedConditions[editingIndex] = editText;
      setConditions(updatedConditions);
      setEditingIndex(null);
      setEditText('');
    }
  };

  const handleDeleteCondition = async (index: number) => {
    const updatedConditions = conditions.filter((_, i) => i !== index);
    setConditions(updatedConditions);
    if (selectedElements === index) {
      setSelectedElements(null);
    }
    setDeleteConfirm(null);

    // Auto-save to database after deletion
    try {
      const conditionsText = updatedConditions.join('\n');

      if (reservationId) {
        const { error } = await supabase
          .from('reservations')
          .update({ conditions_text: conditionsText })
          .eq('id', reservationId);

        if (error) {
          console.error('Error deleting condition:', error);
        }
      }

      if (onSave) {
        onSave(conditionsText);
      }
    } catch (error) {
      console.error('Error saving after deletion:', error);
    }
  };

  const handleAddCondition = () => {
    if (newCondition.trim()) {
      setConditions([...conditions, newCondition]);
      setNewCondition('');
      setShowAddForm(false);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newConditions = [...conditions];
      [newConditions[index - 1], newConditions[index]] = [newConditions[index], newConditions[index - 1]];
      setConditions(newConditions);
      setSelectedElements(index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < conditions.length - 1) {
      const newConditions = [...conditions];
      [newConditions[index], newConditions[index + 1]] = [newConditions[index + 1], newConditions[index]];
      setConditions(newConditions);
      setSelectedElements(index + 1);
    }
  };

  const handleSaveAll = async () => {
    try {
      setLoading(true);
      const conditionsText = conditions.join('\n');

      if (reservationId) {
        const { error } = await supabase
          .from('reservations')
          .update({ conditions_text: conditionsText })
          .eq('id', reservationId);

        if (error) {
          console.error('Error updating conditions:', error);
          alert(lang === 'fr' ? 'Erreur lors de la sauvegarde' : 'خطأ في الحفظ');
          setLoading(false);
          return;
        }
      }

      if (onSave) {
        onSave(conditionsText);
      }

      alert(lang === 'fr' ? 'Conditions sauvegardées!' : 'تم حفظ الشروط!');
      onClose();
    } catch (error) {
      console.error('Error saving conditions:', error);
      alert(lang === 'fr' ? 'Erreur lors de la sauvegarde' : 'خطأ في الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=900,width=900');
    if (!printWindow) return;

    const currentDate = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-AR');
    
    // Generate HTML content for single-page print
    let htmlContent = `
      <!DOCTYPE html>
      <html dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <title>${lang === 'fr' ? 'Conditions de Location' : 'شروط الإيجار'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            line-height: 1.4;
            color: #2c3e50;
            background: #fff;
          }
          .container {
            width: 210mm;
            height: 297mm;
            padding: 12mm;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          
          .header {
            text-align: center;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 3px solid #2563eb;
          }
          
          .header h1 {
            font-size: 18px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 2px;
          }
          
          .header p {
            font-size: 11px;
            color: #666;
            font-style: italic;
          }
          
          .conditions-section {
            margin-bottom: 15px;
          }
          
          .conditions-title {
            font-size: 12px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .conditions-list {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 12px;
          }
          
          .condition-item {
            padding: 7px 8px;
            border-left: 2px solid #2563eb;
            background: #f0f7ff;
            border-radius: 2px;
            font-size: 10px;
            line-height: 1.4;
            text-align: justify;
          }
          
          .condition-item strong {
            color: #1e40af;
            display: inline-block;
            min-width: 18px;
          }
          
          .signatures-section {
            display: flex;
            justify-content: space-between;
            gap: 15px;
            align-items: flex-end;
            margin-top: 12px;
          }
          
          .signature-box {
            flex: 1;
            text-align: center;
            border: 1px solid #ddd;
            padding: 8px;
            border-radius: 4px;
            background: #fafafa;
          }
          
          .signature-label {
            font-size: 9px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          
          .signature-area {
            min-height: 40px;
            border-top: 1px solid #333;
            border-bottom: 1px solid #ddd;
            margin-bottom: 6px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            font-size: 8px;
            color: #999;
          }
          
          .seal-area {
            min-height: 40px;
            border: 2px dashed #999;
            border-radius: 4px;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            color: #999;
            font-style: italic;
          }
          
          .date-field {
            font-size: 8px;
            color: #666;
            margin-top: 4px;
          }
          
          .footer {
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            font-size: 9px;
            color: #999;
          }
          
          @media print {
            body { 
              margin: 0; 
              padding: 0;
              background: white;
            }
            .container { 
              width: 100%;
              height: auto;
              padding: 10mm;
              margin: 0;
              box-shadow: none;
              page-break-after: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>${lang === 'fr' ? '📋 CONDITIONS DE LOCATION' : '📋 شروط التأجير'}</h1>
            <p>${lang === 'fr' ? 'Conditions générales - General Terms & Conditions' : 'الشروط العامة'}</p>
          </div>
          
          <!-- Conditions List -->
          <div class="conditions-section">
            <div class="conditions-title">
              ${lang === 'fr' ? 'Clauses principales' : 'الشروط الرئيسية'}
            </div>
            <div class="conditions-list">
              ${conditions.map((condition, index) => `
                <div class="condition-item">
                  <strong>${index + 1}.</strong> ${condition}
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Signatures & Seals -->
          <div class="signatures-section">
            <!-- Client Signature -->
            <div class="signature-box">
              <div class="signature-label">
                👤 ${lang === 'fr' ? 'Client' : 'العميل'}
              </div>
              <div class="signature-area"></div>
              <div class="date-field">
                ${lang === 'fr' ? 'Date:' : 'التاريخ:'} ____________
              </div>
            </div>
            
            <!-- Agency Seal -->
            <div class="signature-box">
              <div class="signature-label">
                🏢 ${lang === 'fr' ? 'Agence' : 'الوكالة'}
              </div>
              <div class="seal-area">
                ${lang === 'fr' ? '[Cachet]' : '[ختم]'}
              </div>
              <div class="date-field">
                _____________
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            ${lang === 'fr' ? 'Généré le' : 'تم الإنشاء في'} ${currentDate}
          </div>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <>
      <AnimatePresence>
        {deleteConfirm === null && (
          <motion.div
            key="conditions-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl"
            >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center z-10">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              📋 {lang === 'fr' ? 'Personnaliser les Conditions' : 'تخصيص الشروط والأحكام'}
            </h2>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowContractTemplates(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
              >
                <FileText size={18} />
                {lang === 'fr' ? 'Modèles de Contrat' : 'نماذج العقد'}
              </motion.button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-blue-500 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6">
            <div className="grid grid-cols-3 gap-6">
              {/* Left: Editor */}
              <div className="col-span-2">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {conditions.map((condition, index) => (
                    <motion.div
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                        selectedElements === index
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      onClick={() => setSelectedElements(index)}
                    >
                      {editingIndex === index ? (
                        <div className="space-y-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              <Save size={14} /> {lang === 'fr' ? 'OK' : 'حفظ'}
                            </button>
                            <button
                              onClick={() => setEditingIndex(null)}
                              className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                              {lang === 'fr' ? 'Annuler' : 'إلغاء'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="flex-1 text-sm" style={{ color: fontColor }}>
                              <strong>{index + 1}.</strong> {condition}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditCondition(index)}
                                className="p-1 text-blue-500 hover:bg-blue-100 rounded"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(index)}
                                className="p-1 text-red-500 hover:bg-red-100 rounded"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          
                          {selectedElements === index && (
                            <div className="flex gap-2 pt-2 border-t">
                              <button
                                onClick={() => handleMoveUp(index)}
                                disabled={index === 0}
                                className="text-sm px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                              >
                                ⬆ {lang === 'fr' ? 'Haut' : 'أعلى'}
                              </button>
                              <button
                                onClick={() => handleMoveDown(index)}
                                disabled={index === conditions.length - 1}
                                className="text-sm px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                              >
                                ⬇ {lang === 'fr' ? 'Bas' : 'أسفل'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* Add New Condition */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-2 border-dashed border-green-300 rounded-lg p-4"
                  >
                    {!showAddForm ? (
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="w-full flex items-center justify-center gap-2 text-green-600 hover:text-green-700 font-semibold py-2"
                      >
                        <Plus size={18} />
                        {lang === 'fr' ? 'Ajouter une condition' : 'إضافة شرط جديد'}
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          value={newCondition}
                          onChange={(e) => setNewCondition(e.target.value)}
                          placeholder={lang === 'fr' ? 'Nouvelle condition...' : 'شرط جديد...'}
                          className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleAddCondition}
                            disabled={!newCondition.trim()}
                            className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <Plus size={14} />
                            {lang === 'fr' ? 'Ajouter' : 'إضافة'}
                          </button>
                          <button
                            onClick={() => {
                              setShowAddForm(false);
                              setNewCondition('');
                            }}
                            className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                          >
                            {lang === 'fr' ? 'Annuler' : 'إلغاء'}
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Right: Formatting & Preview */}
              <div className="space-y-4">
                {/* Formatting Options */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold mb-3 text-sm">
                    {lang === 'fr' ? 'Formatage' : 'التنسيق'}
                  </h3>

                  <div className="space-y-3">
                    {/* Font Size */}
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        {lang === 'fr' ? 'Taille de police' : 'حجم الخط'}
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="18"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-600">{fontSize}px</span>
                    </div>

                    {/* Font Color */}
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        {lang === 'fr' ? 'Couleur du texte' : 'لون النص'}
                      </label>
                      <input
                        type="color"
                        value={fontColor}
                        onChange={(e) => setFontColor(e.target.value)}
                        className="w-full h-8 rounded cursor-pointer"
                      />
                    </div>

                    {/* Background Color */}
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        {lang === 'fr' ? 'Couleur de fond' : 'لون الخلفية'}
                      </label>
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-full h-8 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div
                  className="p-4 rounded-lg border-2 border-blue-200"
                  style={{ backgroundColor, color: fontColor }}
                >
                  <h4 className="font-semibold text-xs mb-2">
                    {lang === 'fr' ? 'Aperçu' : 'معاينة'}
                  </h4>
                  <p style={{ fontSize: `${fontSize}px` }} className="leading-relaxed">
                    {selectedElements !== null ? conditions[selectedElements] : conditions[0]}
                  </p>
                </div>

                {/* Info */}
                <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
                  <strong>{lang === 'fr' ? 'Total:' : 'المجموع:'}</strong> {conditions.length}{' '}
                  {lang === 'fr' ? 'conditions' : 'شرط'}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-100 p-6 flex gap-3 border-t flex-wrap justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition font-semibold"
            >
              {lang === 'fr' ? 'Fermer' : 'إغلاق'}
            </button>
            <button
              onClick={handlePrint}
              disabled={conditions.length === 0}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              <Printer size={18} />
              {lang === 'fr' ? 'Imprimer' : 'طباعة'}
            </button>
            <button
              onClick={handleSaveAll}
              disabled={loading || conditions.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  {lang === 'fr' ? 'Sauvegarde...' : 'جاري الحفظ...'}
                </>
              ) : (
                <>
                  <Save size={18} />
                  {lang === 'fr' ? 'Sauvegarder les conditions' : 'حفظ الشروط'}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm !== null && (
          <motion.div
            key="delete-confirmation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-lg shadow-xl max-w-sm w-full"
            >
              <div className="bg-red-50 p-6 border-b border-red-200">
                <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
                  ⚠️ {lang === 'fr' ? 'Confirmer la suppression' : 'تأكيد الحذف'}
                </h3>
              </div>
              
              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  {lang === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cette condition ?' : 'هل أنت متأكد من رغبتك في حذف هذا الشرط؟'}
                </p>
                <div className="bg-gray-100 rounded p-3 mb-4 max-h-24 overflow-y-auto">
                  <p className="text-sm text-gray-700">
                    <strong>{deleteConfirm + 1}.</strong> {conditions[deleteConfirm]}
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 flex gap-3 justify-end border-t">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold"
                >
                  {lang === 'fr' ? 'Annuler' : 'إلغاء'}
                </button>
                <button
                  onClick={() => {
                    handleDeleteCondition(deleteConfirm);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  {lang === 'fr' ? 'Supprimer' : 'حذف'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showContractTemplates && (
        <ContractTemplates
          onClose={() => setShowContractTemplates(false)}
          onSave={(contract) => {
            setConditions([contract]);
            setShowContractTemplates(false);
          }}
          contractData={{
            agencyName: 'SARL OUKKAL LISAYA',
            language: lang
          }}
        />
      )}
    </>
  );
};
