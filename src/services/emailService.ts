import { supabase } from '../supabase';
import { ReservationDetails } from '../types';
import html2pdf from 'html2pdf.js';

/**
 * Email Service for handling contract email operations
 */
export class EmailService {
  /**
   * Convert HTML to PDF Buffer
   */
  static async htmlToPdf(htmlContent: string, fileName: string = 'document'): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        const element = document.createElement('div');
        element.innerHTML = htmlContent;
        
        const options = {
          margin: 0,
          filename: `${fileName}.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
        
        const promise = (html2pdf() as any).set(options).from(element).outputPdf('blob');
        promise.then((pdf: Blob) => {
          resolve(pdf);
        }).catch((error: any) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  /**
   * Generate contract HTML for email
   */
  static async generateContractHTML(
    reservation: ReservationDetails,
    templateLang: 'fr' | 'ar'
  ): Promise<string> {
    try {
      // Fetch agency settings for logo and name
      const { data: settingsData } = await supabase
        .from('website_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

      const agencyName = settingsData?.[0]?.name || 'AUTO LOCATION';
      const logoUrl = settingsData?.[0]?.logo || '';

      const isRTL = templateLang === 'ar';
      const dirAttr = isRTL ? 'rtl' : 'ltr';

      // Format dates
      const departureDate = new Date(reservation.step1.departureDate).toLocaleDateString(
        templateLang === 'ar' ? 'ar-DZ' : 'fr-FR'
      );
      const returnDate = new Date(reservation.step1.returnDate).toLocaleDateString(
        templateLang === 'ar' ? 'ar-DZ' : 'fr-FR'
      );

      // Calculate total days
      const start = new Date(reservation.step1.departureDate);
      const end = new Date(reservation.step1.returnDate);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      // Labels
      const labels = {
        contractTitle: templateLang === 'fr' ? 'CONTRAT DE LOCATION DE VÉHICULE' : 'عقد تأجير السيارة',
        contractNumber: templateLang === 'fr' ? 'N° de Contrat' : 'رقم العقد',
        date: templateLang === 'fr' ? 'Date' : 'التاريخ',
        client: templateLang === 'fr' ? 'CLIENT' : 'العميل',
        clientName: `${reservation.client.firstName} ${reservation.client.lastName}`,
        rentalPeriod: templateLang === 'fr' ? 'PÉRIODE DE LOCATION' : 'فترة الإيجار',
        from: templateLang === 'fr' ? 'Du' : 'من',
        to: templateLang === 'fr' ? 'au' : 'إلى',
        days: templateLang === 'fr' ? 'jours' : 'أيام',
        vehicle: templateLang === 'fr' ? 'VÉHICULE' : 'السيارة',
        driver: templateLang === 'fr' ? 'CONDUCTEUR' : 'السائق',
        pricing: templateLang === 'fr' ? 'TARIFICATION' : 'التسعير',
        pricePerDay: templateLang === 'fr' ? 'Prix par jour' : 'السعر في اليوم',
        total: templateLang === 'fr' ? 'Total' : 'الإجمالي',
        conditions: templateLang === 'fr' ? 'CONDITIONS' : 'الشروط',
        signature: templateLang === 'fr' ? 'SIGNATURE' : 'التوقيع',
        client_sig: templateLang === 'fr' ? 'Client' : 'العميل',
        agency_sig: templateLang === 'fr' ? 'Agence' : 'الوكالة',
      };

      const html = `
<!DOCTYPE html>
<html dir="${dirAttr}" lang="${templateLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${labels.contractTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: white; color: #333; line-height: 1.6; }
    .container { width: 100%; max-width: 210mm; margin: 0 auto; padding: 15mm; background: white; }
    
    /* Header */
    .header { 
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 3px solid #3b82f6;
      page-break-after: avoid;
    }
    
    .logo { width: 50px; height: 50px; }
    .logo img { width: 100%; height: 100%; object-fit: contain; }
    
    .agency-info { 
      text-align: ${isRTL ? 'right' : 'left'};
      flex: 1;
      ${isRTL ? 'margin-right: 15px;' : 'margin-left: 15px;'}
    }
    
    .agency-name { font-size: 20px; font-weight: 900; color: #1f2937; }
    
    .title { 
      text-align: center;
      font-size: 16px;
      font-weight: 900;
      color: #1f2937;
      margin: 15px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    /* Info Rows */
    .info-row { 
      display: flex;
      margin-bottom: 8px;
      font-size: 13px;
      page-break-inside: avoid;
    }
    
    .info-label { 
      font-weight: 700;
      width: 150px;
      color: #4b5563;
      flex-shrink: 0;
    }
    
    .info-value { 
      flex: 1;
      color: #1f2937;
      font-weight: 600;
    }
    
    /* Sections */
    .section { 
      margin-bottom: 15px;
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      background: #f9fafb;
      page-break-inside: avoid;
    }
    
    .section-title { 
      font-size: 13px;
      font-weight: 900;
      color: #fff;
      background: #3b82f6;
      padding: 8px 12px;
      margin: -12px -12px 12px -12px;
      border-radius: 2px 2px 0 0;
    }
    
    .two-column { 
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 10px;
    }
    
    .column-item { padding: 5px; }
    
    /* Signatures */
    .signature-section { 
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 25px;
      page-break-inside: avoid;
    }
    
    .signature-box { 
      text-align: center;
      padding-top: 45px;
      border-top: 1px solid #000;
    }
    
    .signature-label { 
      font-weight: 700;
      margin-top: 5px;
      font-size: 11px;
    }
    
    /* Footer */
    .footer { 
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
      margin-top: 20px;
      border-top: 1px solid #e5e7eb;
      padding-top: 10px;
      page-break-inside: avoid;
    }
    
    @media print {
      body { margin: 0; padding: 0; }
      .container { padding: 10mm; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      ${logoUrl ? `<div class="logo"><img src="${logoUrl}" alt="Logo" onerror="this.style.display='none'"></div>` : ''}
      <div class="agency-info">
        <div class="agency-name">${agencyName}</div>
      </div>
    </div>
    
    <!-- Title -->
    <div class="title">${labels.contractTitle}</div>
    
    <!-- Contract Info -->
    <div style="padding: 0 5px; margin-bottom: 15px;">
      <div class="info-row">
        <div class="info-label">${labels.contractNumber}:</div>
        <div class="info-value">#${reservation?.id?.substring(0, 8).toUpperCase()}</div>
      </div>
      <div class="info-row">
        <div class="info-label">${labels.date}:</div>
        <div class="info-value">${new Date().toLocaleDateString(templateLang === 'ar' ? 'ar-DZ' : 'fr-FR')}</div>
      </div>
    </div>
    
    <!-- Client Section -->
    <div class="section">
      <div class="section-title">👤 ${labels.client}</div>
      <div class="info-row">
        <div class="info-label">${templateLang === 'fr' ? 'Nom:' : 'الاسم:'}:</div>
        <div class="info-value">${labels.clientName}</div>
      </div>
      <div class="info-row">
        <div class="info-label">${templateLang === 'fr' ? 'Téléphone:' : 'الهاتف:'}:</div>
        <div class="info-value">${reservation.client.phone || 'N/A'}</div>
      </div>
      <div class="info-row">
        <div class="info-label">${templateLang === 'fr' ? 'Email:' : 'البريد:'}:</div>
        <div class="info-value">${reservation.client.email || 'N/A'}</div>
      </div>
    </div>
    
    <!-- Rental Period -->
    <div class="section">
      <div class="section-title">📅 ${labels.rentalPeriod}</div>
      <div class="info-row">
        <div class="info-label">${labels.from}:</div>
        <div class="info-value">${departureDate}</div>
      </div>
      <div class="info-row">
        <div class="info-label">${labels.to}:</div>
        <div class="info-value">${returnDate}</div>
      </div>
      <div class="info-row">
        <div class="info-label">${templateLang === 'fr' ? 'Durée:' : 'المدة:'}:</div>
        <div class="info-value">${totalDays} ${labels.days}</div>
      </div>
    </div>
    
    <!-- Vehicle Info -->
    <div class="section">
      <div class="section-title">🚗 ${labels.vehicle}</div>
      <div class="info-row">
        <div class="info-label">${templateLang === 'fr' ? 'Modèle:' : 'الموديل:'}:</div>
        <div class="info-value">${reservation.car.brand} ${reservation.car.model}</div>
      </div>
      <div class="info-row">
        <div class="info-label">${templateLang === 'fr' ? 'Plaque:' : 'اللوحة:'}:</div>
        <div class="info-value">${reservation.car.registration}</div>
      </div>
    </div>
    
    <!-- Pricing -->
    <div class="section">
      <div class="section-title">💰 ${labels.pricing}</div>
      <div class="two-column">
        <div class="column-item">
          <div class="info-row">
            <div class="info-label">${labels.pricePerDay}:</div>
            <div class="info-value">${reservation.car.priceDay.toLocaleString()} ${templateLang === 'ar' ? 'د.ج' : 'DA'}</div>
          </div>
        </div>
        <div class="column-item">
          <div class="info-row">
            <div class="info-label">${templateLang === 'fr' ? 'Jours:' : 'الأيام:'}:</div>
            <div class="info-value">${totalDays}</div>
          </div>
        </div>
      </div>
      <div class="info-row" style="font-weight: 900; font-size: 15px; color: #1f2937; border-top: 2px solid #3b82f6; padding-top: 8px; margin-top: 8px;">
        <div class="info-label">${labels.total}:</div>
        <div class="info-value">${reservation.totalPrice.toLocaleString()} ${templateLang === 'ar' ? 'د.ج' : 'DA'}</div>
      </div>
    </div>
    
    <!-- Signature Section -->
    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-label">${labels.client_sig}</div>
      </div>
      <div class="signature-box">
        <div class="signature-label">${labels.agency_sig}</div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      ${templateLang === 'fr' ? 'Contrat généré automatiquement' : 'تم إنشاء العقد تلقائيًا'} - ${new Date().toLocaleString(templateLang === 'ar' ? 'ar-DZ' : 'fr-FR')}
    </div>
  </div>
</body>
</html>`;

      return html;
    } catch (error) {
      console.error('Error generating contract HTML:', error);
      throw error;
    }
  }

  /**
   * Convert HTML to PDF and return as Blob
   */
  static async htmlToPDF(html: string): Promise<Blob> {
    try {
      // For now, we'll use a simple approach - in production you might use html2pdf or similar
      // This creates a blob of the HTML that can be sent as attachment
      const blob = new Blob([html], { type: 'text/html' });
      return blob;
    } catch (error) {
      console.error('Error converting HTML to PDF:', error);
      throw error;
    }
  }

  /**
   * Convert Blob to Base64 string
   */
  static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix if present
        resolve(base64.includes(',') ? base64.split(',')[1] : base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Send contract email via Supabase Edge Function
   * Converts HTML template to PDF and sends as attachment
   */
  static async sendContractEmail(params: {
    clientEmail: string;
    clientName: string;
    reservationId: string;
    senderEmail: string;
    htmlContent: string;
    templateLang: 'fr' | 'ar';
    documentType?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      // Validate and sanitize email addresses
      const clientEmail = params.clientEmail.trim().toLowerCase();
      const senderEmail = params.senderEmail.trim().toLowerCase();
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clientEmail)) {
        throw new Error(`Invalid client email: ${clientEmail}`);
      }
      if (!emailRegex.test(senderEmail)) {
        throw new Error(`Invalid sender email: ${senderEmail}`);
      }

      // Convert HTML to PDF
      console.log('Converting HTML template to PDF...');
      const pdfBlob = await this.htmlToPdf(params.htmlContent, `${params.documentType || 'document'}-${params.reservationId}`);
      const base64Content = await this.blobToBase64(pdfBlob);

      // DEVELOPMENT: Use local mock proxy server on port 3002
      // PRODUCTION: Use Vercel API route
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      let functionUrl: string;
      
      if (isDevelopment) {
        // Development: Use local mock proxy
        functionUrl = 'http://localhost:3002/functions/v1/send-contract-email';
      } else {
        // Production: Use Vercel API route
        const host = window.location.origin;
        functionUrl = `${host}/api/send-contract-email`;
      }

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: clientEmail,
          clientName: params.clientName,
          reservationId: params.reservationId,
          pdfBase64: base64Content,
          sender: senderEmail,
          language: params.templateLang,
          documentType: params.documentType || 'contract',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Edge Function error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      if (data?.success === false) {
        throw new Error(data.error || 'Edge Function returned an error');
      }

      return {
        success: true,
        message: `${params.documentType || 'Contract'} PDF sent successfully`,
      };
    } catch (error: any) {
      console.error('Error sending contract email:', error);
      return {
        success: false,
        message: error.message || `Failed to send ${params.documentType || 'contract'} email`,
      };
    }
  }

  /**
   * Generate HTML for any document type - using contract template as base with different titles
   */
  static async generateDocumentHTML(
    reservation: ReservationDetails,
    templateLang: 'fr' | 'ar',
    documentType: 'contract' | 'devis' | 'recu' | 'engagement' | 'facture' | 'inspection'
  ): Promise<string> {
    // Get the base contract HTML
    let htmlContent = await this.generateContractHTML(reservation, templateLang);
    
    // Define titles for each document type
    const titles = {
      contract: {
        fr: 'CONTRAT DE LOCATION DE VÉHICULE',
        ar: 'عقد تأجير السيارة'
      },
      devis: {
        fr: 'DEVIS DE LOCATION',
        ar: 'عرض الأسعار'
      },
      recu: {
        fr: 'REÇU DE PAIEMENT',
        ar: 'إيصال الدفع'
      },
      engagement: {
        fr: 'LETTRE D\'ENGAGEMENT',
        ar: 'رسالة الالتزام'
      },
      facture: {
        fr: 'FACTURE',
        ar: 'الفاتورة'
      },
      inspection: {
        fr: 'RAPPORT D\'INSPECTION',
        ar: 'تقرير فحص المركبة'
      }
    };
    
    // Get current and target titles
    const currentTitle = titles.contract[templateLang];
    const newTitle = titles[documentType][templateLang];
    
    // Replace all occurrences of the contract title with the new title
    // Use global regex to replace all occurrences
    const titleRegex = new RegExp(currentTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    htmlContent = htmlContent.replace(titleRegex, newTitle);
    
    // Also replace common title variations
    const contractTitleArabicShort = 'عقد تأجير السيارة';
    const contractTitleFrenchShort = 'CONTRAT DE LOCATION';
    
    if (templateLang === 'ar') {
      const arabicRegex = new RegExp(contractTitleArabicShort.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      htmlContent = htmlContent.replace(arabicRegex, newTitle);
    } else {
      const frenchRegex = new RegExp(contractTitleFrenchShort.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      htmlContent = htmlContent.replace(frenchRegex, newTitle);
    }
    
    // Replace in title tags if present
    htmlContent = htmlContent.replace(/<title>.*?<\/title>/i, `<title>${newTitle}</title>`);
    
    // Route to appropriate template generator based on document type
    switch(documentType) {
      case 'inspection':
        return this.generateInspectionEmailHTML(reservation, templateLang);
      case 'engagement':
        return this.generateEngagementEmailHTML(reservation, templateLang);
      case 'recu':
        return this.generateRecuEmailHTML(reservation, templateLang);
      case 'facture':
        return this.generateFactureEmailHTML(reservation, templateLang);
      case 'devis':
        return this.generateDevisEmailHTML(reservation, templateLang);
      case 'contract':
      default:
        return this.generateContractEmailHTMLForEmail(reservation, templateLang);
    }
  }

  /**
   * Generate inspection-specific email template
   */
  static async generateInspectionEmailHTML(
    reservation: ReservationDetails,
    templateLang: 'fr' | 'ar'
  ): Promise<string> {
    try {
      const { data: settingsData } = await supabase
        .from('website_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

      const agencyName = settingsData?.[0]?.name || 'AUTO LOCATION';
      const logoUrl = settingsData?.[0]?.logo || '';

      const isRTL = templateLang === 'ar';
      const dirAttr = isRTL ? 'rtl' : 'ltr';

      const inspectionData = reservation.departureInspection;
      
      const labels = {
        title: templateLang === 'fr' ? 'RAPPORT D\'INSPECTION' : 'تقرير فحص المركبة',
        date: templateLang === 'fr' ? 'Date' : 'التاريخ',
        reservationNo: templateLang === 'fr' ? 'N° de Réservation' : 'رقم الحجز',
        registration: templateLang === 'fr' ? 'Immatriculation' : 'التسجيل',
        clientInfo: templateLang === 'fr' ? 'Informations Client' : 'معلومات العميل',
        fullName: templateLang === 'fr' ? 'Nom Complet' : 'الاسم الكامل',
        phone: templateLang === 'fr' ? 'Téléphone' : 'الهاتف',
        email: templateLang === 'fr' ? 'Email' : 'البريد الإلكتروني',
        license: templateLang === 'fr' ? 'Permis de Conduire' : 'رقم الرخصة',
        vehicleInfo: templateLang === 'fr' ? 'Informations Véhicule' : 'معلومات المركبة',
        model: templateLang === 'fr' ? 'Modèle' : 'الطراز',
        vin: templateLang === 'fr' ? 'VIN' : 'رقم الهيكل',
        color: templateLang === 'fr' ? 'Couleur' : 'اللون',
        mileage: templateLang === 'fr' ? 'Kilométrage' : 'الكيلومترات',
        inspectionDetails: templateLang === 'fr' ? 'Détails Inspection' : 'تفاصيل الفحص',
        notes: templateLang === 'fr' ? 'Notes' : 'ملاحظات',
      };

      const html = `
<!DOCTYPE html>
<html dir="${dirAttr}" lang="${templateLang}">
<head>
  <meta charset="UTF-8">
  <title>${labels.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; background: white; line-height: 1.5; }
    .page { page-break-after: always; }
    .last-page { page-break-after: avoid; }
    
    .container { width: 100%; max-width: 210mm; margin: 0 auto; padding: 15mm; background: white; }
    
    /* Header Styles */
    .header { 
      text-align: center; 
      border-bottom: 3px solid #2d7a4d;
      padding-bottom: 15px;
      margin-bottom: 20px;
      page-break-after: avoid;
    }
    .agency-name { font-size: 16px; font-weight: bold; color: #2d7a4d; margin-bottom: 5px; }
    .report-title { font-size: 18px; font-weight: bold; color: #2d7a4d; margin: 10px 0; }
    .report-date { font-size: 11px; color: #666; }
    
    /* Section Styles */
    .section { margin-bottom: 15px; page-break-inside: avoid; }
    .section-header { 
      background-color: #2d7a4d;
      color: white;
      padding: 10px 12px;
      font-weight: bold;
      font-size: 13px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }
    
    /* Info Grid */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
    .info-row { display: grid; grid-template-columns: 40% 60%; gap: 10px; padding: 6px 8px; background: #f9f9f9; border-radius: 3px; }
    .info-label { font-weight: bold; color: #2d7a4d; font-size: 12px; }
    .info-value { color: #555; font-size: 12px; }
    
    /* Checklist Styles */
    .category-section { margin-bottom: 12px; page-break-inside: avoid; }
    .category-title { 
      font-weight: bold;
      color: #2d7a4d;
      padding: 8px 10px;
      margin-bottom: 5px;
      border-left: 3px solid #2d7a4d;
      background: #f5f5f5;
      font-size: 12px;
    }
    
    .checklist-items { margin-left: 10px; }
    .checklist-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 8px;
      border-bottom: 1px solid #eee;
      font-size: 12px;
    }
    .item-name { flex: 1; color: #333; }
    .item-status { 
      font-weight: bold; 
      font-size: 14px;
      min-width: 20px;
      text-align: right;
    }
    
    /* Notes Section */
    .notes-section {
      background: #f9f9f9;
      padding: 12px;
      border-left: 3px solid #2d7a4d;
      margin-top: 15px;
      page-break-inside: avoid;
    }
    .notes-label { font-weight: bold; color: #2d7a4d; margin-bottom: 6px; font-size: 12px; }
    .notes-content { color: #555; font-size: 12px; white-space: pre-wrap; word-wrap: break-word; }
    
    /* Footer */
    .footer { 
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 10px;
      color: #999;
      page-break-inside: avoid;
    }
    
    @media print {
      body { margin: 0; padding: 0; }
      .container { padding: 10mm; }
      .page { page-break-after: always; }
      .last-page { page-break-after: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="agency-name">${agencyName}</div>
      <div class="report-title">🔍 ${labels.title}</div>
      <div class="report-date">${new Date().toLocaleDateString(templateLang === 'ar' ? 'ar-DZ' : 'fr-FR')}</div>
    </div>
    
    <!-- Reservation Info Section -->
    <div class="section">
      <div class="section-header">📋 ${templateLang === 'fr' ? 'Informations Réservation' : 'معلومات الحجز'}</div>
      <div class="info-grid">
        <div class="info-row">
          <span class="info-label">${labels.date}</span>
          <span class="info-value">${new Date().toLocaleDateString(templateLang === 'ar' ? 'ar-DZ' : 'fr-FR')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${labels.reservationNo}</span>
          <span class="info-value">#${reservation.id.substring(0, 8).toUpperCase()}</span>
        </div>
      </div>
    </div>
    
    <!-- Client Info Section -->
    <div class="section">
      <div class="section-header">👤 ${labels.clientInfo}</div>
      <div class="info-grid">
        <div class="info-row">
          <span class="info-label">${labels.fullName}</span>
          <span class="info-value">${reservation.client.firstName} ${reservation.client.lastName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${labels.phone}</span>
          <span class="info-value">${reservation.client.phone}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${labels.email}</span>
          <span class="info-value">${reservation.client.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${labels.license}</span>
          <span class="info-value">${reservation.client.licenseNumber || 'N/A'}</span>
        </div>
      </div>
    </div>
    
    <!-- Vehicle Info Section -->
    <div class="section">
      <div class="section-header">🚗 ${labels.vehicleInfo}</div>
      <div class="info-grid">
        <div class="info-row">
          <span class="info-label">${labels.model}</span>
          <span class="info-value">${reservation.car.brand} ${reservation.car.model}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${labels.registration}</span>
          <span class="info-value">${reservation.car.registration}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${labels.vin}</span>
          <span class="info-value">${reservation.car.vin || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${labels.color}</span>
          <span class="info-value">${reservation.car.color || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${labels.mileage}</span>
          <span class="info-value">${reservation.car.mileage || 0} km</span>
        </div>
      </div>
    </div>
    
    <!-- Inspection Checklist Section -->
    <div class="section">
      <div class="section-header">✅ ${labels.inspectionDetails}</div>
      ${(() => {
        const categoryLabels = {
          security: templateLang === 'fr' ? '🛡️ Sécurité' : '🛡️ الأمان',
          equipment: templateLang === 'fr' ? '🔧 Équipements' : '🔧 المعدات',
          comfort: templateLang === 'fr' ? '✨ Confort & Propreté' : '✨ الراحة والنظافة',
          cleanliness: templateLang === 'fr' ? '🧹 Nettoyage' : '🧹 التنظيف'
        };
        
        const groupedItems: any = {};
        (inspectionData?.inspectionItems || []).forEach((item: any) => {
          if (!groupedItems[item.category]) {
            groupedItems[item.category] = [];
          }
          groupedItems[item.category].push(item);
        });
        
        return Object.entries(groupedItems).map(([category, items]: any) => {
          const categoryHeader = categoryLabels[category as keyof typeof categoryLabels];
          const itemsHtml = (items as any[]).map((item: any) => `
            <div class="checklist-item">
              <span class="item-name">${item.name}</span>
              <span class="item-status">${item.checked ? '✅' : '❌'}</span>
            </div>
          `).join('');
          return `
            <div class="category-section">
              <div class="category-title">${categoryHeader}</div>
              <div class="checklist-items">
                ${itemsHtml}
              </div>
            </div>
          `;
        }).join('');
      })()}
    </div>
    
    <!-- Notes Section -->
    <div class="notes-section last-page">
      <div class="notes-label">📝 ${labels.notes}</div>
      <div class="notes-content">${inspectionData?.notes || templateLang === 'fr' ? 'Aucune note' : 'بدون ملاحظات'}</div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>${templateLang === 'fr' ? 'Rapport généré automatiquement - ' : 'تم إنشاء التقرير تلقائيًا - '}${new Date().toLocaleString(templateLang === 'ar' ? 'ar-DZ' : 'fr-FR')}</p>
      <p style="margin-top: 5px;">${agencyName}</p>
    </div>
  </div>
</body>
</html>
      `;

      return html;
    } catch (error) {
      console.error('Error generating inspection HTML:', error);
      // Fallback to contract template if inspection generation fails
      return this.generateContractHTML(reservation, templateLang);
    }
  }

  /**
   * Generate engagement (personal commitment) email template
   */
  private static generateEngagementEmailHTML(reservation: ReservationDetails, templateLang: string = 'ar'): string {
    const client = reservation.client;
    const depDateStr = new Date(reservation.step1.departureDate).toLocaleDateString(templateLang === 'ar' ? 'ar-DZ' : 'fr-FR');
    const retDateStr = new Date(reservation.step1.returnDate).toLocaleDateString(templateLang === 'ar' ? 'ar-DZ' : 'fr-FR');
    const clientName = `${client.firstName} ${client.lastName}`;
    
    return `<!DOCTYPE html>
<html dir="${templateLang === 'ar' ? 'rtl' : 'ltr'}" lang="${templateLang}">
<head>
    <meta charset="UTF-8">
    <title>${templateLang === 'ar' ? 'التزام' : 'Engagement'}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
      .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; }
      .header { text-align: center; border-bottom: 3px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
      .title { font-size: 24px; color: #007bff; margin: 10px 0; }
      .section-title { font-size: 14px; font-weight: bold; color: #007bff; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
      .info-row { display: flex; justify-content: space-between; padding: 8px 0; }
      .label { font-weight: bold; }
      .commitment-box { background: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #007bff; }
      .sig-section { margin-top: 40px; display: flex; justify-content: space-between; }
      .sig-box { text-align: center; }
      .sig-line { border-top: 2px solid #333; width: 150px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">${templateLang === 'ar' ? 'التزام شخصي' : 'Engagement Personnel'}</div>
        </div>

        <div class="section-title">${templateLang === 'ar' ? 'بيانات الراكب' : 'Données du Conducteur'}</div>
        <div class="info-row">
            <span class="label">${templateLang === 'ar' ? 'الاسم:' : 'Nom:'}</span>
            <span>${clientName}</span>
        </div>
        <div class="info-row">
            <span class="label">${templateLang === 'ar' ? 'رقم الهاتف:' : 'Téléphone:'}</span>
            <span>${client.phone}</span>
        </div>
        <div class="info-row">
            <span class="label">${templateLang === 'ar' ? 'رقم الترخيص:' : 'Numéro de Permis:'}</span>
            <span>${client.licenseNumber}</span>
        </div>

        <div class="section-title">${templateLang === 'ar' ? 'بيانات المركبة' : 'Données du Véhicule'}</div>
        <div class="info-row">
            <span class="label">${templateLang === 'ar' ? 'الموديل:' : 'Modèle:'}</span>
            <span>${reservation.car.brand} ${reservation.car.model}</span>
        </div>
        <div class="info-row">
            <span class="label">${templateLang === 'ar' ? 'لوحة التسجيل:' : 'Plaque:'}</span>
            <span>${reservation.car.registration}</span>
        </div>

        <div class="section-title">${templateLang === 'ar' ? 'فترة الإيجار' : 'Période de Location'}</div>
        <div class="info-row">
            <span class="label">${templateLang === 'ar' ? 'من:' : 'De:'}</span>
            <span>${depDateStr}</span>
        </div>
        <div class="info-row">
            <span class="label">${templateLang === 'ar' ? 'إلى:' : 'À:'}</span>
            <span>${retDateStr}</span>
        </div>

        <div class="commitment-box">
            <p>${templateLang === 'ar' 
                ? 'أتعهد بالالتزام بجميع شروط وأحكام عقد الإيجار والعناية الكاملة بالمركبة المؤجرة.' 
                : 'Je m\'engage à respecter toutes les conditions du contrat de location et à prendre soin du véhicule loué.'}</p>
        </div>

        <div class="sig-section">
            <div class="sig-box">
                <div>${templateLang === 'ar' ? 'توقيع الراكب' : 'Signature du Conducteur'}</div>
                <div class="sig-line"></div>
            </div>
            <div class="sig-box">
                <div>${templateLang === 'ar' ? 'توقيع الوكالة' : 'Signature de l\'Agence'}</div>
                <div class="sig-line"></div>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate receipt (reçu) email template
   */
  private static generateRecuEmailHTML(reservation: ReservationDetails, templateLang: string = 'ar'): string {
    const dateStr = new Date().toLocaleDateString(templateLang === 'ar' ? 'ar-DZ' : 'fr-FR');
    const client = reservation.client;
    const totalPrice = reservation.totalPrice;
    const paidAmount = reservation.advancePayment;
    const balance = totalPrice - paidAmount;
    
    return `<!DOCTYPE html>
<html dir="${templateLang === 'ar' ? 'rtl' : 'ltr'}" lang="${templateLang}">
<head>
    <meta charset="UTF-8">
    <title>${templateLang === 'ar' ? 'إيصال الدفع' : 'Reçu'}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
      .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; }
      .header { text-align: center; border-bottom: 3px solid #28a745; padding-bottom: 20px; margin-bottom: 30px; }
      .title { font-size: 24px; color: #28a745; margin: 10px 0; }
      .badge { display: inline-block; background: #28a745; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; margin-top: 10px; }
      .section-title { font-size: 14px; font-weight: bold; color: #333; margin-top: 20px; margin-bottom: 10px; }
      .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
      .amount-section { background: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #28a745; }
      .amount-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 15px; }
      .total { font-size: 18px; font-weight: bold; color: #28a745; margin-top: 10px; border-top: 2px solid #ddd; padding-top: 10px; }
      .thank-you { text-align: center; font-size: 16px; font-weight: bold; color: #28a745; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">${templateLang === 'ar' ? 'إيصال الدفع' : 'Reçu de Paiement'}</div>
            <div class="badge">${templateLang === 'ar' ? '✓ مقبول' : '✓ Accepté'}</div>
        </div>

        <div class="section-title">${templateLang === 'ar' ? 'تفاصيل الدفع' : 'Détails du Paiement'}</div>
        <div class="info-row">
            <span>${templateLang === 'ar' ? 'التاريخ:' : 'Date:'}</span>
            <span>${dateStr}</span>
        </div>
        <div class="info-row">
            <span>${templateLang === 'ar' ? 'العميل:' : 'Client:'}</span>
            <span>${client.firstName} ${client.lastName}</span>
        </div>
        <div class="info-row">
            <span>${templateLang === 'ar' ? 'رقم الهاتف:' : 'Téléphone:'}</span>
            <span>${client.phone}</span>
        </div>
        <div class="info-row">
            <span>${templateLang === 'ar' ? 'رقم الحجز:' : 'Réservation:'}</span>
            <span>${reservation.id.substring(0, 8)}</span>
        </div>

        <div class="amount-section">
            <div class="amount-row">
                <span>${templateLang === 'ar' ? 'المبلغ الكلي:' : 'Montant Total:'}</span>
                <span>${totalPrice.toFixed(2)} DA</span>
            </div>
            <div class="amount-row">
                <span>${templateLang === 'ar' ? 'المبلغ المدفوع:' : 'Montant Payé:'}</span>
                <span>${paidAmount.toFixed(2)} DA</span>
            </div>
            <div class="amount-row">
                <span>${templateLang === 'ar' ? 'الرصيد المتبقي:' : 'Solde:'}</span>
                <span style="color: ${balance > 0 ? '#ff6b6b' : '#28a745'}">${balance.toFixed(2)} DA</span>
            </div>
            <div class="total">
                ${templateLang === 'ar' ? 'المستحصل:' : 'Reçu:'} ${paidAmount.toFixed(2)} DA
            </div>
        </div>

        <div class="thank-you">
            ${templateLang === 'ar' ? '🙏 شكراً على دفعتك 🙏' : '🙏 Merci pour votre paiement 🙏'}
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate invoice (facture) email template
   */
  private static generateFactureEmailHTML(reservation: ReservationDetails, templateLang: string = 'ar'): string {
    const dateStr = new Date().toLocaleDateString(templateLang === 'ar' ? 'ar-DZ' : 'fr-FR');
    const client = reservation.client;
    const depDate = new Date(reservation.step1.departureDate).toLocaleDateString(templateLang === 'ar' ? 'ar-DZ' : 'fr-FR');
    const retDate = new Date(reservation.step1.returnDate).toLocaleDateString(templateLang === 'ar' ? 'ar-DZ' : 'fr-FR');
    const subTotal = reservation.totalPrice / 1.19;
    const tax = reservation.totalPrice - subTotal;
    
    return `<!DOCTYPE html>
<html dir="${templateLang === 'ar' ? 'rtl' : 'ltr'}" lang="${templateLang}">
<head>
    <meta charset="UTF-8">
    <title>${templateLang === 'ar' ? 'الفاتورة' : 'Facture'}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
      .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; }
      .header { text-align: center; border-bottom: 3px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
      .title { font-size: 24px; color: #007bff; margin: 10px 0; }
      .invoice-header { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; }
      .section-title { font-size: 14px; font-weight: bold; color: #333; margin-top: 20px; margin-bottom: 10px; }
      .details-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
      .details-table th { background: #f0f0f0; padding: 10px; text-align: ${templateLang === 'ar' ? 'right' : 'left'}; font-weight: bold; border-bottom: 2px solid #ddd; }
      .details-table td { padding: 10px; border-bottom: 1px solid #ddd; }
      .totals-box { margin-top: 20px; padding: 15px; background: #f9f9f9; border-left: 4px solid #007bff; }
      .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 15px; }
      .final-total { font-size: 18px; font-weight: bold; color: #007bff; margin-top: 10px; border-top: 2px solid #ddd; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">${templateLang === 'ar' ? 'الفاتورة' : 'Facture'}</div>
        </div>

        <div class="invoice-header">
            <div><strong>${templateLang === 'ar' ? 'التاريخ:' : 'Date:'}</strong> ${dateStr}</div>
            <div><strong>${templateLang === 'ar' ? 'الرقم:' : 'N°:'}</strong> ${reservation.id.substring(0, 8)}</div>
        </div>

        <div class="section-title">${templateLang === 'ar' ? 'العميل' : 'Client'}</div>
        <p>${client.firstName} ${client.lastName} - ${client.phone}</p>

        <table class="details-table">
            <thead>
                <tr>
                    <th>${templateLang === 'ar' ? 'الوصف' : 'Description'}</th>
                    <th>${templateLang === 'ar' ? 'المبلغ' : 'Montant'}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${reservation.car.brand} ${reservation.car.model} (${depDate} - ${retDate})</td>
                    <td>${subTotal.toFixed(2)} DA</td>
                </tr>
            </tbody>
        </table>

        <div class="totals-box">
            <div class="total-row">
                <span>${templateLang === 'ar' ? 'الإجمالي الفرعي:' : 'Sous-Total:'}</span>
                <span>${subTotal.toFixed(2)} DA</span>
            </div>
            <div class="total-row">
                <span>${templateLang === 'ar' ? 'الضريبة (19%):' : 'TVA (19%):'}</span>
                <span>${tax.toFixed(2)} DA</span>
            </div>
            <div class="final-total">
                ${templateLang === 'ar' ? 'الإجمالي الكلي:' : 'Total TTC:'} ${reservation.totalPrice.toFixed(2)} DA
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate quote (devis) email template
   */
  private static generateDevisEmailHTML(reservation: ReservationDetails, templateLang: string = 'ar'): string {
    const dateStr = new Date().toLocaleDateString(templateLang === 'ar' ? 'ar-DZ' : 'fr-FR');
    const client = reservation.client;
    const depDate = new Date(reservation.step1.departureDate).toLocaleDateString(templateLang === 'ar' ? 'ar-DZ' : 'fr-FR');
    const retDate = new Date(reservation.step1.returnDate).toLocaleDateString(templateLang === 'ar' ? 'ar-DZ' : 'fr-FR');
    const days = reservation.totalDays;
    const subTotal = (reservation.totalPrice / 1.19);
    const tax = reservation.totalPrice - subTotal;
    
    return `<!DOCTYPE html>
<html dir="${templateLang === 'ar' ? 'rtl' : 'ltr'}" lang="${templateLang}">
<head>
    <meta charset="UTF-8">
    <title>${templateLang === 'ar' ? 'عرض أسعار' : 'Devis'}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
      .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; }
      .header { text-align: center; border-bottom: 3px solid #ff9800; padding-bottom: 20px; margin-bottom: 30px; }
      .title { font-size: 24px; color: #ff9800; margin: 10px 0; }
      .quote-header { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; }
      .section-title { font-size: 14px; font-weight: bold; color: #ff9800; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #ff9800; padding-bottom: 5px; }
      .info-row { display: flex; justify-content: space-between; padding: 8px 0; }
      .pricing-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
      .pricing-table th { background: #ff9800; color: white; padding: 10px; text-align: ${templateLang === 'ar' ? 'right' : 'left'}; }
      .pricing-table td { padding: 10px; border-bottom: 1px solid #ddd; }
      .totals-box { margin-top: 20px; padding: 15px; background: #fff3e0; border-left: 4px solid #ff9800; }
      .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 15px; }
      .final-total { font-size: 18px; font-weight: bold; color: #ff9800; margin-top: 10px; border-top: 2px solid #ff9800; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">${templateLang === 'ar' ? 'عرض أسعار' : 'Devis'}</div>
        </div>

        <div class="quote-header">
            <div><strong>${templateLang === 'ar' ? 'التاريخ:' : 'Date:'}</strong> ${dateStr}</div>
            <div><strong>${templateLang === 'ar' ? 'العميل:' : 'Client:'}</strong> ${client.firstName} ${client.lastName}</div>
        </div>

        <div class="section-title">${templateLang === 'ar' ? 'مواصفات المركبة' : 'Spécifications'}</div>
        <div class="info-row">
            <span>${templateLang === 'ar' ? 'الماركة والموديل:' : 'Marque/Modèle:'}</span>
            <span>${reservation.car.brand} ${reservation.car.model}</span>
        </div>
        <div class="info-row">
            <span>${templateLang === 'ar' ? 'اللوحة:' : 'Plaque:'}</span>
            <span>${reservation.car.registration}</span>
        </div>
        <div class="info-row">
            <span>${templateLang === 'ar' ? 'الفترة:' : 'Période:'}</span>
            <span>${depDate} - ${retDate} (${days} ${templateLang === 'ar' ? 'أيام' : 'jours'})</span>
        </div>

        <table class="pricing-table">
            <thead>
                <tr>
                    <th>${templateLang === 'ar' ? 'البيان' : 'Description'}</th>
                    <th>${templateLang === 'ar' ? 'المبلغ' : 'Montant'}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${days} ${templateLang === 'ar' ? 'يوم × سعر اليوم' : 'jour × tarif/jour'}</td>
                    <td>${subTotal.toFixed(2)} DA</td>
                </tr>
            </tbody>
        </table>

        <div class="totals-box">
            <div class="total-row">
                <span>${templateLang === 'ar' ? 'الإجمالي الفرعي:' : 'Sous-Total:'}</span>
                <span>${subTotal.toFixed(2)} DA</span>
            </div>
            <div class="total-row">
                <span>${templateLang === 'ar' ? 'الضريبة (19%):' : 'TVA (19%):'}</span>
                <span>${tax.toFixed(2)} DA</span>
            </div>
            <div class="final-total">
                ${templateLang === 'ar' ? 'الإجمالي الكلي:' : 'Total TTC:'} ${reservation.totalPrice.toFixed(2)} DA
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate contract email template
   */
  private static generateContractEmailHTMLForEmail(reservation: ReservationDetails, templateLang: string = 'ar'): string {
    // For email, create a simplified contract template
    const client = reservation.client;
    const depDate = new Date(reservation.step1.departureDate).toLocaleDateString(templateLang === 'ar' ? 'ar-DZ' : 'fr-FR');
    const retDate = new Date(reservation.step1.returnDate).toLocaleDateString(templateLang === 'ar' ? 'ar-DZ' : 'fr-FR');
    const dateStr = new Date().toLocaleDateString(templateLang === 'ar' ? 'ar-DZ' : 'fr-FR');
    const subTotal = (reservation.totalPrice / 1.19);
    const tax = reservation.totalPrice - subTotal;
    
    return `<!DOCTYPE html>
<html dir="${templateLang === 'ar' ? 'rtl' : 'ltr'}" lang="${templateLang}">
<head>
    <meta charset="UTF-8">
    <title>${templateLang === 'ar' ? 'عقد التأجير' : 'Contrat'}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
      .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; }
      .header { text-align: center; border-bottom: 3px solid #17a2b8; padding-bottom: 20px; margin-bottom: 30px; }
      .title { font-size: 24px; color: #17a2b8; margin: 10px 0; }
      .section-title { font-size: 14px; font-weight: bold; color: #17a2b8; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #17a2b8; padding-bottom: 5px; }
      .info-row { display: flex; justify-content: space-between; padding: 8px 0; }
      .label { font-weight: bold; min-width: 120px; }
      .checkbox-item { margin: 8px 0; }
      .pricing-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
      .pricing-table th { background: #17a2b8; color: white; padding: 10px; text-align: ${templateLang === 'ar' ? 'right' : 'left'}; }
      .pricing-table td { padding: 10px; border-bottom: 1px solid #ddd; }
      .totals-box { margin-top: 20px; padding: 15px; background: #e8f4f8; border-left: 4px solid #17a2b8; }
      .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 15px; }
      .final-total { font-size: 18px; font-weight: bold; color: #17a2b8; margin-top: 10px; border-top: 2px solid #ddd; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">${templateLang === 'ar' ? 'عقد التأجير' : 'Contrat de Location'}</div>
            <div style="font-size: 12px; color: #666;">${templateLang === 'ar' ? 'التاريخ:' : 'Date:'} ${dateStr}</div>
        </div>

        <div class="section-title">${templateLang === 'ar' ? 'بيانات السائق' : 'Données du Conducteur'}</div>
        <div class="info-row">
            <span class="label">${templateLang === 'ar' ? 'الاسم:' : 'Nom:'}</span>
            <span>${client.firstName} ${client.lastName}</span>
        </div>
        <div class="info-row">
            <span class="label">${templateLang === 'ar' ? 'الهاتف:' : 'Tél:'}</span>
            <span>${client.phone}</span>
        </div>
        <div class="info-row">
            <span class="label">${templateLang === 'ar' ? 'الرخصة:' : 'Permis:'}</span>
            <span>${client.licenseNumber}</span>
        </div>

        <div class="section-title">${templateLang === 'ar' ? 'بيانات المركبة' : 'Données du Véhicule'}</div>
        <div class="info-row">
            <span class="label">${templateLang === 'ar' ? 'الموديل:' : 'Modèle:'}</span>
            <span>${reservation.car.brand} ${reservation.car.model}</span>
        </div>
        <div class="info-row">
            <span class="label">${templateLang === 'ar' ? 'اللوحة:' : 'Plaque:'}</span>
            <span>${reservation.car.registration}</span>
        </div>
        <div class="info-row">
            <span class="label">${templateLang === 'ar' ? 'الوقود:' : 'Carburant:'}</span>
            <span>${reservation.car.energy}</span>
        </div>

        <div class="section-title">${templateLang === 'ar' ? 'فترة الإيجار' : 'Période de Location'}</div>
        <div class="info-row">
            <span class="label">${templateLang === 'ar' ? 'المغادرة:' : 'Départ:'}</span>
            <span>${depDate}</span>
        </div>
        <div class="info-row">
            <span class="label">${templateLang === 'ar' ? 'العودة:' : 'Retour:'}</span>
            <span>${retDate}</span>
        </div>
        <div class="info-row">
            <span class="label">${templateLang === 'ar' ? 'المدة:' : 'Durée:'}</span>
            <span>${reservation.totalDays} ${templateLang === 'ar' ? 'يوم' : 'jours'}</span>
        </div>

        <table class="pricing-table">
            <thead>
                <tr>
                    <th>${templateLang === 'ar' ? 'البيان' : 'Description'}</th>
                    <th>${templateLang === 'ar' ? 'المبلغ' : 'Montant'}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${reservation.car.brand} ${reservation.car.model}</td>
                    <td>${subTotal.toFixed(2)} DA</td>
                </tr>
            </tbody>
        </table>

        <div class="totals-box">
            <div class="total-row">
                <span>${templateLang === 'ar' ? 'الفرعي:' : 'S/Total:'}</span>
                <span>${subTotal.toFixed(2)} DA</span>
            </div>
            <div class="total-row">
                <span>${templateLang === 'ar' ? 'الضريبة:' : 'TVA 19%:'}</span>
                <span>${tax.toFixed(2)} DA</span>
            </div>
            <div class="final-total">
                ${templateLang === 'ar' ? 'الإجمالي:' : 'Total TTC:'} ${reservation.totalPrice.toFixed(2)} DA
            </div>
        </div>

        <div class="section-title">${templateLang === 'ar' ? 'الشروط المقبولة' : 'Conditions'}</div>
        <div class="checkbox-item">✓ ${templateLang === 'ar' ? 'الرخصة سارية' : 'Permis valide'}</div>
        <div class="checkbox-item">✓ ${templateLang === 'ar' ? 'التأمين الشامل' : 'Assurance complète'}</div>
        <div class="checkbox-item">✓ ${templateLang === 'ar' ? 'الإيداع مقبول' : 'Caution acceptée'}</div>
        <div class="checkbox-item">✓ ${templateLang === 'ar' ? 'الخزان ممتلئ' : 'Réservoir plein'}</div>
    </div>
</body>
</html>`;
  }
}
