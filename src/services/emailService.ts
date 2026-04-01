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
   * Generate HTML for any document type
   */
  static async generateDocumentHTML(
    reservation: ReservationDetails,
    templateLang: 'fr' | 'ar',
    documentType: 'contract' | 'devis' | 'recu' | 'engagement' | 'facture' | 'inspection'
  ): Promise<string> {
    // For now, all document types will use the same contract template
    // This ensures consistent content across all document types
    return this.generateContractHTML(reservation, templateLang);
  }
}
