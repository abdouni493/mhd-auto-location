import { supabase } from '../supabase';
import { ReservationDetails } from '../types';

/**
 * Email Service for handling contract email operations
 */
export class EmailService {
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
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: white;
      color: #333;
      line-height: 1.6;
    }
    
    .container {
      width: 210mm;
      height: 297mm;
      margin: 0 auto;
      padding: 20px;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 3px solid #3b82f6;
    }
    
    .logo {
      width: 60px;
      height: 60px;
    }
    
    .logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    
    .agency-info {
      text-align: ${isRTL ? 'right' : 'left'};
      flex: 1;
      ${isRTL ? 'margin-right: 15px;' : 'margin-left: 15px;'}
    }
    
    .agency-name {
      font-size: 24px;
      font-weight: 900;
      color: #1f2937;
    }
    
    .title {
      text-align: center;
      font-size: 20px;
      font-weight: 900;
      color: #1f2937;
      margin: 15px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 12px;
      font-size: 14px;
    }
    
    .info-label {
      font-weight: 700;
      width: 120px;
      color: #4b5563;
    }
    
    .info-value {
      flex: 1;
      color: #1f2937;
      font-weight: 600;
    }
    
    .section {
      margin-bottom: 20px;
      padding: 12px;
      border: 2px solid #e5e7eb;
      border-radius: 6px;
      background: #f9fafb;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 900;
      color: #fff;
      background: #3b82f6;
      padding: 8px 12px;
      margin: -12px -12px 12px -12px;
      border-radius: 4px 4px 0 0;
    }
    
    .two-column {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
    }
    
    .column-item {
      padding: 8px;
    }
    
    .signature-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 30px;
    }
    
    .signature-box {
      text-align: center;
      padding-top: 50px;
      border-top: 1px solid #000;
    }
    
    .signature-label {
      font-weight: 700;
      margin-top: 5px;
      font-size: 12px;
    }
    
    .footer {
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
      margin-top: 20px;
      border-top: 1px solid #e5e7eb;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      ${logoUrl ? `<div class="logo"><img src="${logoUrl}" alt="Logo"></div>` : ''}
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
   * 
   * NOTE: During development, this uses a local mock proxy server.
   * In production, ensure the Edge Function is deployed to Supabase and
   * use: supabase.functions.invoke('send-contract-email', ...)
   */
  static async sendContractEmail(params: {
    clientEmail: string;
    clientName: string;
    reservationId: string;
    senderEmail: string;
    htmlContent: string;
    templateLang: 'fr' | 'ar';
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

      // Convert HTML to base64
      const htmlBlob = new Blob([params.htmlContent], { type: 'text/html' });
      const base64Content = await this.blobToBase64(htmlBlob);

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
          htmlBase64: base64Content,
          sender: senderEmail,
          language: params.templateLang,
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
        message: 'Contract email sent successfully',
      };
    } catch (error: any) {
      console.error('Error sending contract email:', error);
      return {
        success: false,
        message: error.message || 'Failed to send contract email',
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
    
    // If it's an inspection document, generate the inspection template instead
    if (documentType === 'inspection') {
      return this.generateInspectionEmailHTML(reservation, templateLang);
    }
    
    return htmlContent;
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
        date: templateLang === 'fr' ? 'التاريخ' : 'التاريخ',
        reservationNo: templateLang === 'fr' ? 'رقم الحجز' : 'رقم الحجز',
        registration: templateLang === 'fr' ? 'التسجيل' : 'التسجيل',
        clientInfo: templateLang === 'fr' ? 'معلومات العميل' : 'معلومات العميل',
        fullName: templateLang === 'fr' ? 'الاسم الكامل' : 'الاسم الكامل',
        phone: templateLang === 'fr' ? 'الهاتف' : 'الهاتف',
        email: templateLang === 'fr' ? 'البريد الإلكتروني' : 'البريد الإلكتروني',
        license: templateLang === 'fr' ? 'رقم الرخصة' : 'رقم الرخصة',
        vehicleInfo: templateLang === 'fr' ? 'معلومات المركبة' : 'معلومات المركبة',
        model: templateLang === 'fr' ? 'الطراز' : 'الطراز',
        vin: templateLang === 'fr' ? 'رقم الهيكل' : 'رقم الهيكل',
        color: templateLang === 'fr' ? 'اللون' : 'اللون',
        mileage: templateLang === 'fr' ? 'الكيلومترات' : 'الكيلومترات',
        inspectionDetails: templateLang === 'fr' ? 'تفاصيل الفحص' : 'تفاصيل الفحص',
        notes: templateLang === 'fr' ? 'ملاحظات' : 'ملاحظات',
      };

      const html = `
<!DOCTYPE html>
<html dir="${dirAttr}" lang="${templateLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${labels.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: white;
      color: #333;
      line-height: 1.6;
    }
    
    .container {
      width: 210mm;
      height: 297mm;
      margin: 0 auto;
      padding: 20px;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 3px solid #2d7a4d;
    }
    
    .logo {
      font-weight: bold;
      font-size: 18px;
      color: #2d7a4d;
    }
    
    .agency-name {
      text-align: center;
      font-weight: bold;
      font-size: 16px;
      color: #333;
      margin-bottom: 10px;
    }
    
    .title {
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      color: #2d7a4d;
      margin: 20px 0;
      text-decoration: underline;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 15px 0;
    }
    
    .info-item {
      padding: 10px;
      background: #f5f5f5;
      border-radius: 5px;
    }
    
    .info-label {
      font-weight: bold;
      color: #2d7a4d;
      font-size: 12px;
      margin-bottom: 3px;
    }
    
    .info-value {
      font-size: 13px;
      color: #333;
    }
    
    .section-title {
      font-weight: bold;
      color: white;
      background-color: #2d7a4d;
      padding: 8px 12px;
      margin: 15px 0 10px 0;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .category-title {
      font-weight: bold;
      color: #2d7a4d;
      margin: 12px 0 8px 0;
      padding-left: 10px;
      border-left: 4px solid #2d7a4d;
      font-size: 13px;
    }
    
    .checklist-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 10px;
      border-bottom: 1px solid #eee;
      font-size: 13px;
    }
    
    .item-name {
      flex: 1;
    }
    
    .item-status {
      font-size: 16px;
      font-weight: bold;
      margin-left: 10px;
    }
    
    .notes-section {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
      border-left: 4px solid #2d7a4d;
    }
    
    .footer {
      margin-top: 20px;
      font-size: 11px;
      color: #999;
      text-align: center;
      padding-top: 15px;
      border-top: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">MHD-AUTO</div>
    <div class="agency-name">${agencyName}</div>
    <div class="title">🔍 ${labels.title}</div>
    
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">📅 ${labels.date}</div>
        <div class="info-value">${new Date().toLocaleDateString(templateLang === 'ar' ? 'ar-DZ' : 'fr-FR')}</div>
      </div>
      <div class="info-item">
        <div class="info-label">🗂️ ${labels.reservationNo}</div>
        <div class="info-value">#${reservation.id}</div>
      </div>
    </div>
    
    <div class="section-title">👤 ${labels.clientInfo}</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">${labels.fullName}</div>
        <div class="info-value">${reservation.client.firstName} ${reservation.client.lastName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">${labels.phone}</div>
        <div class="info-value">${reservation.client.phone}</div>
      </div>
      <div class="info-item">
        <div class="info-label">${labels.email}</div>
        <div class="info-value">${reservation.client.email}</div>
      </div>
      <div class="info-item">
        <div class="info-label">${labels.license}</div>
        <div class="info-value">${reservation.client.licenseNumber || 'N/A'}</div>
      </div>
    </div>
    
    <div class="section-title">🚗 ${labels.vehicleInfo}</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">${labels.model}</div>
        <div class="info-value">${reservation.car.brand} ${reservation.car.model}</div>
      </div>
      <div class="info-item">
        <div class="info-label">${labels.registration}</div>
        <div class="info-value">${reservation.car.registration}</div>
      </div>
      <div class="info-item">
        <div class="info-label">${labels.vin}</div>
        <div class="info-value">${reservation.car.vin || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">${labels.color}</div>
        <div class="info-value">${reservation.car.color || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">${labels.mileage}</div>
        <div class="info-value">${reservation.car.mileage || 0} km</div>
      </div>
    </div>
    
    <div class="section-title">✅ ${labels.inspectionDetails}</div>
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
          <div class="category-title">${categoryHeader}</div>
          ${itemsHtml}
        `;
      }).join('');
    })()}
    
    <div class="notes-section">
      <div style="font-weight: bold; color: #2d7a4d; margin-bottom: 8px;">📝 ${labels.notes}</div>
      <div style="font-size: 13px; color: #333; white-space: pre-wrap;">${inspectionData?.notes || ''}</div>
    </div>
    
    <div class="footer">
      ${templateLang === 'fr' ? 'Rapport généré automatiquement' : 'تم إنشاء التقرير تلقائيًا'} - ${new Date().toLocaleString(templateLang === 'ar' ? 'ar-DZ' : 'fr-FR')}
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
}
