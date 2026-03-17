import React, { useState, useEffect } from 'react';
import { DocumentType, DocumentTemplate, Invoice, AgencySettings } from '../types';
import { DocumentTemplateService } from '../services/DocumentTemplateService';
import { supabase } from '../supabase';
import { Edit2, Printer, CheckCircle, AlertCircle } from 'lucide-react';

interface DocumentRendererProps {
  documentType: DocumentType;
  invoice: Invoice;
  onEditTemplate?: () => void;
  lang?: 'fr' | 'ar';
}

interface FieldValue {
  [key: string]: string | number;
}

const FIELD_VALUE_MAPPING: Record<DocumentType, FieldValue> = {
  contrat: {
    title: 'Contrat de Location',
    client_name: 'Client Name',
    car_model: 'Vehicle Model',
    rental_dates: 'Rental Dates',
    price_total: 'Total Price',
    signature_line: 'Signature',
  },
  devis: {
    title: 'Devis',
    quote_number: 'Quote Number',
    client_name: 'Client Name',
    car_model: 'Vehicle Model',
    validity_date: 'Valid Until',
    price_total: 'Total Price',
  },
  facture: {
    title: 'Invoice',
    invoice_number: 'Invoice Number',
    invoice_date: 'Date',
    client_name: 'Client Name',
    car_model: 'Vehicle Model',
    amount_due: 'Amount Due',
    payment_terms: 'Payment Terms',
  },
  recu: {
    title: 'Receipt',
    receipt_number: 'Receipt Number',
    receipt_date: 'Date',
    client_name: 'Client Name',
    amount_paid: 'Amount Paid',
    payment_method: 'Payment Method',
  },
  engagement: {
    title: 'Engagement Letter',
    subtitle: 'Engagement de Location de Véhicule',
    engagement_number: 'Engagement Number',
    client_name: 'Client Name',
    client_label: 'Informations du Client:',
    vehicle_info: 'Vehicle Information',
    vehicle_label: 'Informations du Véhicule:',
    commitment_date: 'Date',
    terms_conditions: 'Terms & Conditions',
    terms_label: 'Conditions et Engagements:',
    signature_label: 'Signature du Client:',
    signature_line: '_______________________________',
    date_label: 'Date:',
    date_line: '____________________',
  },
};

export const DocumentRenderer: React.FC<DocumentRendererProps> = ({
  documentType,
  invoice,
  onEditTemplate,
  lang = 'fr',
}) => {
  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [agencySettings, setAgencySettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [documentType]);

  const loadAllData = async () => {
    setLoading(true);
    setDataLoaded(false);

    try {
      // Load template and agency settings in parallel
      const [docTemplate, { data: agencyData, error: agencyError }] = await Promise.all([
        DocumentTemplateService.getDocumentTemplate(documentType),
        supabase
          .from('agency_settings')
          .select('agency_name, logo, address, phone')
          .limit(1)
          .single()
      ]);

      if (agencyError) {
        console.error('DocumentRenderer: Error fetching agency_settings:', agencyError);
      }

      setTemplate(docTemplate);
      setAgencySettings(agencyData);
      setDataLoaded(true);

      console.log('DocumentRenderer loaded data:', {
        template: !!docTemplate,
        agencySettings: agencyData,
        agencyName: agencyData?.agency_name,
        logoUrl: agencyData?.logo
      });
    } catch (error) {
      console.error('DocumentRenderer: Error loading data:', error);
      console.error('DocumentRenderer: Detailed error:', {
        message: error?.message,
        stack: error?.stack,
        documentType
      });
      // Fallback to default template on error
      setTemplate(DocumentTemplateService.getDefaultTemplate(documentType));
      setDataLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const getFieldValue = (fieldName: string): string => {
    // Check for custom fields or fields with customText
    if (fieldName.startsWith('custom_') || template?.[fieldName]?.customText) {
      return template?.[fieldName]?.customText || '';
    }

    // Map standard fields to invoice data
    switch (fieldName) {
      case 'client_name':
        return invoice.clientName || 'N/A';
      case 'car_model':
      case 'vehicle_info':
        return invoice.carInfo || 'N/A';
      case 'invoice_number':
      case 'quote_number':
      case 'receipt_number':
      case 'engagement_number':
        return invoice.invoiceNumber || 'N/A';
      case 'invoice_date':
      case 'receipt_date':
      case 'commitment_date':
        return invoice.date || 'N/A';
      case 'amount_due':
      case 'amount_paid':
      case 'price_total':
        return `${invoice.totalAmount.toLocaleString('fr-FR')} DA`;
      case 'rental_dates':
        return invoice.date || 'N/A';
      case 'validity_date':
        return 'Valid for 30 days';
      case 'payment_terms':
      case 'payment_method':
        return 'Cash or Card';
      case 'signature_line':
        return '_____________________';
      case 'terms_conditions':
        return 'Le client s\'engage à respecter toutes les conditions de location, y compris les règles de conduite, les délais de retour, et les responsabilités financières. Tout dommage ou infraction entraînera des frais supplémentaires.';
      default:
        return FIELD_VALUE_MAPPING[documentType][fieldName] || '';
    }
  };

  if (loading || !dataLoaded) {
    return <div className="animate-pulse bg-gray-200 h-96 rounded"></div>;
  }

  // Specialized render for contract with new structure
  if (documentType === 'contrat') {
    return (
      <div className="relative">
        {/* Document Container */}
        <div className="relative bg-white border-2 border-gray-300 p-8 shadow-lg rounded print:shadow-none print:border-none" style={{ minHeight: '1400px' }}>
          
          {/* Header with Logo and Agency Info */}
          <div className="flex justify-between items-start mb-8 pb-6 border-b-4 border-blue-600">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-blue-900 mb-2">
                {agencySettings?.agency_name || 'SARL OUKKAL LISAYARAT'}
              </h1>
              <p className="text-sm text-gray-600 mb-1 font-semibold">MHD-AUTO</p>
              {agencySettings?.address && (
                <p className="text-sm text-gray-700 mb-1">
                  📍 {agencySettings.address}
                </p>
              )}
              {agencySettings?.phone && (
                <p className="text-sm text-gray-700">
                  📞 Tél: {agencySettings.phone}
                </p>
              )}
            </div>
            {agencySettings?.logo && (
              <div className="ml-6">
                <img
                  src={agencySettings.logo}
                  alt="Agency Logo"
                  style={{ height: 90, width: 'auto' }}
                  className="object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-2">اتفاقية إيجار السيارة</h2>
            <h3 className="text-xl font-semibold text-gray-700">Contrat de Location de Véhicule</h3>
          </div>

          {/* Contract Details Section */}
          <div className="mb-8">
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600 mb-4">
              <h4 className="text-lg font-bold text-blue-900 mb-3">📋 تفاصيل العقد / Détails du Contrat</h4>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">رقم العقد / N° Contrat:</p>
                  <p className="text-lg font-bold text-gray-900">{invoice.invoiceNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">تاريخ العقد / Date du Contrat:</p>
                  <p className="text-lg font-bold text-gray-900">{invoice.date || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Rental Period Section */}
          <div className="mb-8">
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-600 mb-4">
              <h4 className="text-lg font-bold text-green-900 mb-3">📅 فترة الإيجار / Période de Location</h4>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">من / Du:</p>
                  <p className="text-lg font-bold text-gray-900">14/02/2026</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">إلى / Au:</p>
                  <p className="text-lg font-bold text-gray-900">20/02/2026</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">المدة / Durée:</p>
                  <p className="text-lg font-bold text-green-600">06 أيام / jours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Driver Information Section */}
          <div className="mb-8">
            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-600 mb-4">
              <h4 className="text-lg font-bold text-purple-900 mb-3">👤 معلومات السائق 01 / Informations du Conducteur 01</h4>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">الاسم / Nom:</p>
                  <p className="text-base font-bold text-gray-900">{invoice.clientName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">تاريخ الميلاد / Date de Naissance:</p>
                  <p className="text-base font-bold text-gray-900">03/08/1978</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">مكان الميلاد / Lieu de Naissance:</p>
                  <p className="text-base font-bold text-gray-900">El Harrouch</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">نوع الرخصة / Type Permis:</p>
                  <p className="text-base font-bold text-gray-900">Biometric driver's license</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">رقم الرخصة / N° Permis:</p>
                  <p className="text-base font-bold text-gray-900">312657043</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">تاريخ الإصدار / Date Délivrance:</p>
                  <p className="text-base font-bold text-gray-900">07/11/2024</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">تاريخ الانتهاء / Date Expiration:</p>
                  <p className="text-base font-bold text-gray-900">06/11/2034</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">مكان الإصدار / Lieu Délivrance:</p>
                  <p className="text-base font-bold text-gray-900">Lyon</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Information Section */}
          <div className="mb-8">
            <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-600 mb-4">
              <h4 className="text-lg font-bold text-orange-900 mb-3">🚗 معلومات المركبة / Informations du Véhicule</h4>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">الموديل / Modèle:</p>
                  <p className="text-base font-bold text-gray-900">Doblo Blanc</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">اللون / Couleur:</p>
                  <p className="text-base font-bold text-gray-900">Bleu</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">لوحة التسجيل / Plaque d'Immatriculation:</p>
                  <p className="text-base font-bold text-gray-900">032045.125.16</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">رقم المسلسل / Numéro de Série:</p>
                  <p className="text-base font-bold text-gray-900">BRYEKNFJ2S5718503</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">نوع الوقود / Type Carburant:</p>
                  <p className="text-base font-bold text-gray-900">Essence Sans plomb</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">قراءة العداد / Kilométrage:</p>
                  <p className="text-base font-bold text-gray-900">8400 km</p>
                </div>
              </div>
            </div>
          </div>

          {/* Financials Section */}
          <div className="mb-8">
            <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-600 mb-4">
              <h4 className="text-lg font-bold text-red-900 mb-3">💰 التفاصيل المالية / Détails Financiers</h4>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">سعر الوحدة / Prix Unitaire:</p>
                  <p className="text-lg font-bold text-gray-900">10,000.00 DA</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">السعر الإجمالي بدون ضريبة / Total HT:</p>
                  <p className="text-lg font-bold text-gray-900">60,000.00 DA</p>
                </div>
                <div className="bg-white p-3 rounded border-2 border-red-600">
                  <p className="text-sm text-gray-600 font-semibold">إجمالي العقد / Montant Total:</p>
                  <p className="text-2xl font-bold text-red-600">{invoice.totalAmount.toLocaleString('fr-FR')} DA</p>
                </div>
              </div>
            </div>
          </div>

          {/* Equipment Checklist Section */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border-l-4 border-indigo-600 mb-4">
              <h4 className="text-lg font-bold text-indigo-900 mb-4">✅ قائمة المعدات / Checklist de l'Équipement</h4>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Equipment Items */}
                {[
                  { ar: 'الإطارات', fr: 'Pneus', checked: true },
                  { ar: 'الفرامل', fr: 'Freins', checked: true },
                  { ar: 'الأضواء', fr: 'Éclairage', checked: true },
                  { ar: 'المرايا', fr: 'Rétroviseurs', checked: true },
                  { ar: 'المقاعد', fr: 'Sièges', checked: true },
                  { ar: 'الزجاج', fr: 'Vitres', checked: true },
                  { ar: 'المحرك', fr: 'Moteur', checked: true },
                  { ar: 'جهاز التكييف', fr: 'Climatisation', checked: true },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center p-3 rounded-lg border-2 transition-all ${
                      item.checked
                        ? 'bg-green-50 border-green-300'
                        : 'bg-red-50 border-red-300'
                    }`}
                  >
                    {item.checked ? (
                      <CheckCircle size={20} className="text-green-600 mr-3 flex-shrink-0" />
                    ) : (
                      <AlertCircle size={20} className="text-red-600 mr-3 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">{item.ar}</p>
                      <p className="text-xs text-gray-600">{item.fr}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="border-t-2 border-gray-300 pt-8 mt-8">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-sm font-bold text-gray-700 mb-8">توقيع السائق</p>
                <p className="text-xs text-gray-600 mb-8">Signature Conducteur</p>
                <div className="border-b-2 border-gray-900 h-2"></div>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700 mb-8">توقيع الوكالة</p>
                <p className="text-xs text-gray-600 mb-8">Signature Agence</p>
                <div className="border-b-2 border-gray-900 h-2"></div>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700 mb-8">التاريخ</p>
                <p className="text-xs text-gray-600 mb-8">Date</p>
                <div className="border-b-2 border-gray-900 h-2"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Print Button */}
        <div className="mt-4 flex gap-4">
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 transition-colors"
          >
            <Printer size={16} /> Print Document
          </button>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .relative {
              box-shadow: none !important;
              border: none !important;
            }
            button {
              display: none !important;
            }
          }
        `}</style>
      </div>
    );
  }

  // Default render for other document types
  return (
    <div className="relative">
      {/* Document Container */}
      <div className="relative bg-white border-2 border-gray-300 p-8 shadow-lg rounded" style={{ minHeight: '600px' }}>
        {/* Agency Header - Always render with defaults except for engagement */}
        {documentType !== 'engagement' && (
          <div className="document-header mb-8 pb-4 border-b-2 border-gray-300" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {agencySettings?.agency_name || 'LuxDrive Premium Car Rental'}
                </h1>
                {agencySettings?.address && (
                  <p className="text-gray-700 mb-1">
                    {agencySettings.address}
                  </p>
                )}
                {agencySettings?.phone && (
                  <p className="text-gray-700">
                    Tél: {agencySettings.phone}
                  </p>
                )}
              </div>
              {agencySettings?.logo && (
                <div className="ml-4">
                  <img
                    src={agencySettings.logo}
                    alt="Agency Logo"
                    style={{ height: 70 }}
                    className="object-contain"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Template Edit Button */}
        {onEditTemplate && (
          <button
            onClick={onEditTemplate}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors z-10 flex items-center gap-2 text-gray-600 hover:text-gray-900"
            title="Edit template"
          >
            <Edit2 size={16} /> Edit Template
          </button>
        )}

        {/* Rendered Fields */}
        {template &&
          Object.entries(template).map(([fieldName, fieldValue]) => {
            const field = fieldValue as any;
            return (
              <div
                key={fieldName}
                className="absolute whitespace-pre-wrap break-words"
                style={{
                  left: `${field.x}px`,
                  top: `${field.y}px`,
                  color: field.color || '#000000',
                  fontSize: `${field.fontSize || 12}px`,
                  fontWeight: field.fontWeight || 'normal',
                  textAlign: field.textAlign || 'left',
                  maxWidth: `${field.maxWidth || 200}px`,
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                {getFieldValue(fieldName)}
              </div>
            );
          })}

        {/* Fallback if no template */}
        {!template && (
          <div className="text-center text-gray-500 pt-12">
            <p>No template found for {documentType}</p>
          </div>
        )}
      </div>

      {/* Print Button */}
      <div className="mt-4 flex gap-4">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 transition-colors"
        >
          <Printer size={16} /> Print Document
        </button>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .relative {
            box-shadow: none !important;
            border: none !important;
          }
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
