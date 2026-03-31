import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, Download, Edit2, Copy, ChevronRight } from 'lucide-react';
import { supabase } from '../supabase';

interface ContractTemplate {
  id: string;
  name: string;
  language: 'fr' | 'ar';
  content: string;
  description: string;
}

interface ContractData {
  agencyName: string;
  agencyLogo?: string;
  agencyPhone?: string;
  agencyAddress?: string;
  driverName: string;
  driverLicense: string;
  driverBirthDate: string;
  driverPassport?: string;
  carBrand: string;
  carModel: string;
  carColor: string;
  carRegistration: string;
  carMileage: number;
  departureDate: string;
  returnDate: string;
  rentAmount: number;
  insurance: number;
  deposit: number;
  fuelType?: string;
  language: 'fr' | 'ar';
}

interface ContractTemplatesProps {
  onClose: () => void;
  onSave?: (contract: string) => void;
  contractData?: Partial<ContractData>;
}

const FRENCH_CONTRACT_TEMPLATE = `
<div class="contract-fr">
  <div class="contract-header">
    <div class="logo-section">
      {logo}
    </div>
    <div class="header-text">
      <h1>CONTRAT DE LOCATION DE VÉHICULE</h1>
      <h2>{agencyName}</h2>
      <p>Téléphone: {agencyPhone}</p>
      <p>Adresse: {agencyAddress}</p>
    </div>
  </div>

  <div class="contract-info">
    <div class="info-section">
      <h3>INFORMATIONS DU CONDUCTEUR</h3>
      <table>
        <tr>
          <td>Nom et Prénom:</td>
          <td>{driverName}</td>
        </tr>
        <tr>
          <td>Date de Naissance:</td>
          <td>{driverBirthDate}</td>
        </tr>
        <tr>
          <td>Numéro de Permis:</td>
          <td>{driverLicense}</td>
        </tr>
        <tr>
          <td>Numéro Passeport:</td>
          <td>{driverPassport}</td>
        </tr>
      </table>
    </div>

    <div class="info-section">
      <h3>INFORMATIONS DU VÉHICULE</h3>
      <table>
        <tr>
          <td>Marque:</td>
          <td>{carBrand}</td>
        </tr>
        <tr>
          <td>Modèle:</td>
          <td>{carModel}</td>
        </tr>
        <tr>
          <td>Couleur:</td>
          <td>{carColor}</td>
        </tr>
        <tr>
          <td>Immatriculation:</td>
          <td>{carRegistration}</td>
        </tr>
        <tr>
          <td>Kilométrage Initial:</td>
          <td>{carMileage} km</td>
        </tr>
        <tr>
          <td>Carburant:</td>
          <td>{fuelType}</td>
        </tr>
      </table>
    </div>

    <div class="info-section">
      <h3>PÉRIODE DE LOCATION</h3>
      <table>
        <tr>
          <td>Date de Départ:</td>
          <td>{departureDate}</td>
        </tr>
        <tr>
          <td>Date de Retour:</td>
          <td>{returnDate}</td>
        </tr>
      </table>
    </div>

    <div class="info-section">
      <h3>CONDITIONS FINANCIÈRES</h3>
      <table>
        <tr>
          <td>Montant de Location:</td>
          <td>{rentAmount} DZD</td>
        </tr>
        <tr>
          <td>Assurance:</td>
          <td>{insurance} DZD</td>
        </tr>
        <tr>
          <td>Caution Obligatoire:</td>
          <td>{deposit} DZD</td>
        </tr>
        <tr style="font-weight: bold; border-top: 2px solid #000;">
          <td>TOTAL:</td>
          <td>{total} DZD</td>
        </tr>
      </table>
    </div>

    <div class="conditions-section">
      <h3>CONDITIONS DE LOCATION</h3>
      <ul>
        <li>Le conducteur doit être âgé de 20 ans minimum avec un permis depuis 2 ans.</li>
        <li>Une pièce d'identité valide (passeport biométrique) est obligatoire.</li>
        <li>Un dépôt de garantie est requis avant la remise du véhicule.</li>
        <li>Le carburant est à la charge du client.</li>
        <li>Le véhicule doit être retourné à la date convenue.</li>
        <li>Toute rayure ou dommage sera facturé au client.</li>
        <li>Le kilométrage dépasse 150 km/jour sera facturé en supplément.</li>
      </ul>
    </div>
  </div>

  <div class="contract-footer">
    <div class="signature-section">
      <div class="signature-box">
        <p>Signature du Conducteur</p>
        <p>Empreinte Digitale</p>
        <div class="signature-line"></div>
      </div>
      <div class="signature-box">
        <p>Signature de l'Agence</p>
        <div class="signature-line"></div>
      </div>
    </div>
    <p style="text-align: center; margin-top: 20px; font-size: 12px;">
      Ce contrat a été établi en deux exemplaires, un pour le conducteur et un pour l'agence.
    </p>
  </div>
</div>
`;

const ARABIC_CONTRACT_TEMPLATE = `
<div class="contract-ar" dir="rtl">
  <div class="contract-header">
    <div class="header-text">
      <h1>عقد استئجار المركبة</h1>
      <h2>{agencyName}</h2>
      <p>الهاتف: {agencyPhone}</p>
      <p>العنوان: {agencyAddress}</p>
    </div>
    <div class="logo-section">
      {logo}
    </div>
  </div>

  <div class="contract-info">
    <div class="info-section">
      <h3>معلومات السائق</h3>
      <table>
        <tr>
          <td>{driverName}</td>
          <td>الاسم الكامل:</td>
        </tr>
        <tr>
          <td>{driverBirthDate}</td>
          <td>تاريخ الميلاد:</td>
        </tr>
        <tr>
          <td>{driverLicense}</td>
          <td>رقم رخصة القيادة:</td>
        </tr>
        <tr>
          <td>{driverPassport}</td>
          <td>رقم جواز السفر:</td>
        </tr>
      </table>
    </div>

    <div class="info-section">
      <h3>معلومات المركبة</h3>
      <table>
        <tr>
          <td>{carBrand}</td>
          <td>الماركة:</td>
        </tr>
        <tr>
          <td>{carModel}</td>
          <td>الموديل:</td>
        </tr>
        <tr>
          <td>{carColor}</td>
          <td>اللون:</td>
        </tr>
        <tr>
          <td>{carRegistration}</td>
          <td>رقم التسجيل:</td>
        </tr>
        <tr>
          <td>{carMileage} كم</td>
          <td>المسافة الأولية:</td>
        </tr>
        <tr>
          <td>{fuelType}</td>
          <td>نوع الوقود:</td>
        </tr>
      </table>
    </div>

    <div class="info-section">
      <h3>فترة الاستئجار</h3>
      <table>
        <tr>
          <td>{departureDate}</td>
          <td>تاريخ البداية:</td>
        </tr>
        <tr>
          <td>{returnDate}</td>
          <td>تاريخ النهاية:</td>
        </tr>
      </table>
    </div>

    <div class="info-section">
      <h3>الشروط المالية</h3>
      <table>
        <tr>
          <td>{rentAmount} دج</td>
          <td>سعر الإيجار:</td>
        </tr>
        <tr>
          <td>{insurance} دج</td>
          <td>التأمين:</td>
        </tr>
        <tr>
          <td>{deposit} دج</td>
          <td>الكفالة الإجبارية:</td>
        </tr>
        <tr style="font-weight: bold; border-top: 2px solid #000;">
          <td>{total} دج</td>
          <td>الإجمالي:</td>
        </tr>
      </table>
    </div>

    <div class="conditions-section">
      <h3>شروط الإيجار</h3>
      <ul>
        <li>يجب أن يكون السائق بعمر 20 سنة على الأقل مع رخصة قيادة منذ سنتين.</li>
        <li>وثيقة هوية صالحة (جواز سفر حيوي) إلزامية.</li>
        <li>يجب دفع كفالة قبل تسليم السيارة.</li>
        <li>الوقود على حساب العميل.</li>
        <li>يجب إرجاع السيارة في التاريخ المتفق عليه.</li>
        <li>أي خدش أو ضرر سيتم فرض رسوم على العميل.</li>
        <li>ستكون هناك رسوم إضافية للمسافة التي تتجاوز 150 كم يومياً.</li>
      </ul>
    </div>
  </div>

  <div class="contract-footer">
    <div class="signature-section">
      <div class="signature-box">
        <p>توقيع السائق</p>
        <p>البصمة</p>
        <div class="signature-line"></div>
      </div>
      <div class="signature-box">
        <p>توقيع الوكالة</p>
        <div class="signature-line"></div>
      </div>
    </div>
    <p style="text-align: center; margin-top: 20px; font-size: 12px;">
      تم إعداد هذا العقد بنسختين، واحدة للسائق وواحدة للوكالة.
    </p>
  </div>
</div>
`;

export const ContractTemplates: React.FC<ContractTemplatesProps> = ({
  onClose,
  onSave,
  contractData = {}
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<'fr' | 'ar' | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [templates, setTemplates] = useState<ContractTemplate[]>([
    {
      id: 'fr-standard',
      name: 'Contrat Standard',
      language: 'fr',
      content: FRENCH_CONTRACT_TEMPLATE,
      description: 'Contrat de location en français avec tous les détails requis'
    },
    {
      id: 'ar-standard',
      name: 'العقد القياسي',
      language: 'ar',
      content: ARABIC_CONTRACT_TEMPLATE,
      description: 'عقد الإيجار باللغة العربية مع جميع التفاصيل المطلوبة'
    }
  ]);

  const handleSelectTemplate = (lang: 'fr' | 'ar') => {
    const template = templates.find(t => t.language === lang);
    if (template) {
      setSelectedTemplate(lang);
      setEditContent(template.content);
      setIsEditing(false);
    }
  };

  const handleEditTemplate = () => {
    setIsEditing(true);
  };

  const handleSaveTemplate = () => {
    if (selectedTemplate && editContent) {
      const updatedTemplates = templates.map(t => 
        t.language === selectedTemplate 
          ? { ...t, content: editContent }
          : t
      );
      setTemplates(updatedTemplates);
      setIsEditing(false);
    }
  };

  const handlePrint = () => {
    if (editContent) {
      window.print();
    }
  };

  const handleSaveContract = () => {
    if (editContent && onSave) {
      onSave(editContent);
      onClose();
    }
  };

  const renderTemplatePreview = (content: string) => {
    let rendered = content;
    Object.entries(contractData).forEach(([key, value]) => {
      rendered = rendered.replace(`{${key}}`, String(value || ''));
    });
    
    const total = (contractData.rentAmount || 0) + (contractData.insurance || 0) + (contractData.deposit || 0);
    rendered = rendered.replace('{total}', String(total));
    
    return rendered;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-black text-slate-900">
            {selectedTemplate ? 'Éditer Contrat' : 'Sélectionner un Modèle'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {!selectedTemplate ? (
            // Template Selection
            <div className="space-y-4">
              {templates.map((template) => (
                <motion.button
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectTemplate(template.language)}
                  className="w-full p-6 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600">
                        {template.name}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {template.description}
                      </p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            // Contract Editor
            <div className="space-y-4">
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-96 p-4 border-2 border-blue-500 rounded-lg font-mono text-sm focus:outline-none"
                />
              ) : (
                <div
                  className="prose prose-sm max-w-none p-6 border-2 border-slate-200 rounded-lg bg-white"
                  dangerouslySetInnerHTML={{ __html: renderTemplatePreview(editContent) }}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
          {selectedTemplate ? (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedTemplate(null)}
                className="px-6 py-2 text-slate-700 font-bold hover:bg-slate-200 rounded-lg transition-colors"
              >
                ← Retour
              </motion.button>

              <div className="flex gap-4">
                {isEditing ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveTemplate}
                    className="px-6 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Enregistrer
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleEditTemplate}
                      className="px-6 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Éditer
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePrint}
                      className="px-6 py-2 bg-slate-500 text-white font-bold rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimer
                    </motion.button>
                  </>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveContract}
                  className="px-6 py-2 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Utiliser
                </motion.button>
              </div>
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="ml-auto px-6 py-2 bg-slate-500 text-white font-bold rounded-lg hover:bg-slate-600 transition-colors"
            >
              Fermer
            </motion.button>
          )}
        </div>
      </motion.div>

      <style>{`
        .contract-fr, .contract-ar {
          font-family: 'Arial', sans-serif;
          color: #333;
          background: white;
          padding: 40px;
          max-width: 8.5in;
          margin: 0 auto;
        }

        .contract-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #333;
          padding-bottom: 20px;
        }

        .logo-section {
          width: 100px;
          height: 100px;
          background: #f0f0f0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: #999;
        }

        .header-text {
          flex: 1;
          text-align: center;
        }

        .header-text h1 {
          font-size: 24px;
          font-weight: bold;
          margin: 0;
          color: #000;
        }

        .header-text h2 {
          font-size: 16px;
          font-weight: bold;
          margin: 5px 0;
          color: #333;
        }

        .header-text p {
          font-size: 12px;
          margin: 3px 0;
          color: #666;
        }

        .contract-info {
          margin: 20px 0;
        }

        .info-section {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }

        .info-section h3 {
          font-size: 14px;
          font-weight: bold;
          background: #f0f0f0;
          padding: 8px 12px;
          margin: 0 0 10px 0;
          border-left: 4px solid #333;
        }

        .info-section table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .info-section table tr {
          border-bottom: 1px solid #ddd;
        }

        .info-section table tr:last-child {
          border-bottom: 2px solid #333;
        }

        .info-section table td {
          padding: 8px;
          text-align: left;
        }

        .info-section table td:first-child {
          font-weight: bold;
          width: 50%;
        }

        .conditions-section {
          margin-top: 20px;
        }

        .conditions-section h3 {
          font-size: 14px;
          font-weight: bold;
          background: #f0f0f0;
          padding: 8px 12px;
          margin: 0 0 10px 0;
          border-left: 4px solid #333;
        }

        .conditions-section ul {
          margin: 0;
          padding-left: 20px;
          font-size: 11px;
          line-height: 1.6;
        }

        .conditions-section li {
          margin-bottom: 5px;
        }

        .contract-footer {
          margin-top: 30px;
          page-break-inside: avoid;
        }

        .signature-section {
          display: flex;
          justify-content: space-around;
          margin-top: 40px;
        }

        .signature-box {
          text-align: center;
          flex: 1;
        }

        .signature-box p {
          font-size: 11px;
          font-weight: bold;
          margin: 5px 0;
        }

        .signature-line {
          border-top: 1px solid #333;
          width: 150px;
          margin: 30px auto 5px;
        }

        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .contract-fr, .contract-ar {
            padding: 20px;
            max-width: 100%;
          }
        }
      `}</style>
    </motion.div>
  );
};
