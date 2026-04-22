const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/PlannerPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = '  const generateFactureHTML = (templateLang: \'fr\' | \'ar\'): string => {';
const endMarker = '  const generateEngagementHTML = (templateLang: \'fr\' | \'ar\'): string => {';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find markers. startIdx:', startIdx, 'endIdx:', endIdx);
  process.exit(1);
}

const newFunction = `  const generateFactureHTML = (templateLang: 'fr' | 'ar'): string => {
    const isFrench = templateLang === 'fr';

    const subtotal = reservation.totalPrice || 0;
    const tvaAmount = reservation.tvaApplied ? subtotal * 0.19 : 0;
    const timbre = 200;
    const total = subtotal + tvaAmount + timbre;
    const totalPaid = reservation.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || reservation.advancePayment || 0;

    const numberToWords = (num: number): string => {
      const ones = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
        'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
      const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
      if (num === 0) return 'zéro';
      let result = '';
      if (num >= 1000000) { result += numberToWords(Math.floor(num / 1000000)) + ' million '; num = num % 1000000; }
      if (num >= 1000) { const t = Math.floor(num / 1000); result += (t === 1 ? 'mille ' : numberToWords(t) + ' mille '); num = num % 1000; }
      if (num >= 100) { const h = Math.floor(num / 100); result += (h === 1 ? 'cent ' : ones[h] + ' cent '); num = num % 100; }
      if (num >= 20) {
        const t = Math.floor(num / 10); const o = num % 10;
        if (t === 7) result += 'soixante-' + ones[10 + o] + ' ';
        else if (t === 9) result += 'quatre-vingt-' + ones[10 + o] + ' ';
        else result += tens[t] + (o > 0 ? '-' + ones[o] : '') + ' ';
      } else if (num > 0) { result += ones[num] + ' '; }
      return result.trim();
    };

    const totalInt = Math.round(total);
    const totalWordsText = numberToWords(totalInt);
    const totalWords = totalWordsText.charAt(0).toUpperCase() + totalWordsText.slice(1) + ' Dinars Algériens';

    const invoiceNum = '01/' + new Date().getFullYear();
    const invoiceDate = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\\\\//g, '-');
    const departDate = reservation?.step1?.departureDate || '';
    const returnDate = reservation?.step1?.returnDate || '';
    const days = reservation?.totalDays || 0;
    const pricePerDay = (reservation?.car as any)?.priceDay || (reservation?.car as any)?.price_per_day || 0;

    const html = \\\`
    <!DOCTYPE html>
    <html dir="ltr" lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Facture</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 13px; color: #000; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .page { width: 794px; min-height: 1123px; padding: 12mm 15mm; margin: 0 auto; background: white; border: 2px solid #003399; position: relative; }
        
        .fiscal-strip { width: 100%; font-size: 11px; font-weight: bold; border-bottom: 2px solid #003399; padding-bottom: 5px; margin-bottom: 8px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; color: #003399; }
        
        .header-row { display: flex; align-items: stretch; border: 2px solid #003399; margin-bottom: 12px; }
        .header-cell { flex: 1; padding: 8px 12px; border-right: 2px solid #003399; font-size: 13px; }
        .header-cell:last-child { border-right: none; }
        .header-cell label { font-weight: bold; display: block; margin-bottom: 4px; color: #003399; text-transform: uppercase; font-size: 11px; }
        .facture-num-cell { flex: 1.5; padding: 8px 12px; text-align: center; font-size: 18px; font-weight: bold; display: flex; flex-direction: column; align-items: center; justify-content: center; border-left: 2px solid #003399; background: #f0f4ff; }
        .facture-num-label { font-size: 12px; font-weight: bold; text-decoration: underline; color: #003399; margin-bottom: 2px; }
        
        .info-block { display: flex; border: 2px solid #003399; margin-bottom: 12px; }
        .agency-block { flex: 1; padding: 12px 15px; border-right: 2px solid #003399; display: flex; align-items: center; gap: 15px; }
        .agency-logo { width: 75px; height: 75px; object-fit: contain; flex-shrink: 0; }
        .agency-logo-placeholder { width: 75px; height: 75px; border: 2px solid #ccd3e8; display: flex; align-items: center; justify-content: center; font-size: 32px; flex-shrink: 0; }
        .agency-text { flex: 1; }
        .agency-name-big { font-size: 18px; font-weight: 900; color: #003399; margin-bottom: 4px; text-transform: uppercase; }
        .agency-detail { font-size: 11px; line-height: 1.5; color: #333; }
        
        .client-block { flex: 1.2; padding: 12px 15px; }
        .client-block-title { font-weight: 800; font-size: 13px; text-decoration: underline; margin-bottom: 8px; color: #003399; }
        .client-row { font-size: 12px; line-height: 1.7; }
        .client-row strong { font-weight: 700; color: #003399; }
        
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 13px; border: 2px solid #003399; }
        .items-table th { background: #003399; color: white; border: 1px solid #003399; padding: 10px 5px; text-align: center; font-weight: 800; font-size: 11px; text-transform: uppercase; }
        .items-table td { border: 1px solid #003399; padding: 12px 8px; text-align: center; vertical-align: middle; }
        .items-table td.left { text-align: left; padding-left: 12px; }
        
        .totals-wrapper { display: flex; justify-content: flex-end; margin-bottom: 12px; }
        .totals-table { width: 320px; border-collapse: collapse; font-size: 13px; border: 2px solid #003399; }
        .totals-table tr td { border: 1px solid #003399; padding: 8px 12px; }
        .totals-table tr td:first-child { font-weight: bold; background: #f0f4ff; color: #003399; white-space: nowrap; width: 150px; }
        .totals-table tr td:last-child { text-align: right; font-weight: bold; }
        .totals-table tr.total-payer td { background: #cc0000; color: white; font-weight: 900; font-size: 16px; border: 2px solid #cc0000; }
        
        .arretee-section { border: 2px solid #003399; padding: 12px 15px; margin-bottom: 15px; background: #f8faff; }
        .arretee-label { font-weight: 800; font-size: 12px; margin-bottom: 6px; color: #003399; text-decoration: underline; }
        .amount-words-fr { font-weight: 900; font-size: 14px; text-transform: uppercase; margin-bottom: 8px; color: #222; }
        .amount-words-ar { font-size: 14px; text-align: right; direction: rtl; color: #444; font-weight: bold; }
        
        .footer-section { display: flex; align-items: center; gap: 20px; border-top: 2px solid #003399; padding-top: 15px; }
        .footer-stamp { width: 90px; height: 90px; object-fit: contain; flex-shrink: 0; }
        .footer-stamp-placeholder { width: 90px; height: 90px; border: 3px solid #003399; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 36px; flex-shrink: 0; color: #003399; }
        .footer-info { flex: 1; text-align: center; line-height: 1.8; font-size: 12px; color: #333; }
        .footer-info strong { color: #003399; }
        
        @media print { @page { size: A4; margin: 0; } body { background: white; } .page { border: 2px solid #003399; } }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="fiscal-strip">
          <span>ART: \\\${(agencySettings as any)?.art || '—'}</span>
          <span>&nbsp;&nbsp;RC: \\\${(agencySettings as any)?.rc || '—'}</span>
          <span>&nbsp;&nbsp;NIF: \\\${(agencySettings as any)?.nif || '—'}</span>
          <span>&nbsp;&nbsp;NIS: \\\${(agencySettings as any)?.nis || '—'}</span>
        </div>
        
        <div class="header-row">
          <div class="header-cell">
            <label>Mode de paiement</label>
            <span>Virement</span>
          </div>
          <div class="header-cell">
            <label>FAITE LE</label>
            <span>\\\${invoiceDate}</span>
          </div>
          <div class="facture-num-cell">
            <span class="facture-num-label">N° DE FACTURE</span>
            <span>\\\${invoiceNum}</span>
          </div>
        </div>
        
        <div class="info-block">
          <div class="agency-block">
            \\\${agencySettings?.logo ? \\\`<img src="\\\${agencySettings.logo}" alt="Logo" class="agency-logo">\\\` : '<div class="agency-logo-placeholder">🏢</div>'}
            <div class="agency-text">
              <div class="agency-name-big">\\\${agencySettings?.name || 'NOM AGENCE'}</div>
              <div class="agency-detail">
                \\\${agencySettings?.address ? agencySettings.address + '<br>' : ''}
                \\\${agencySettings?.phone ? 'Tél: ' + agencySettings.phone : ''}
                \\\${agencySettings?.phone_number_2 ? ' / ' + agencySettings.phone_number_2 : ''}
              </div>
            </div>
          </div>
          <div class="client-block">
            <div class="client-block-title">CLIENT :</div>
            <div class="client-row">
              <strong>LOCATAIRES :</strong> \\\${reservation?.client?.firstName || ''} \\\${reservation?.client?.lastName || ''}<br>
              <strong>CONDUCTEUR SOCIETE :</strong> \\\${reservation?.client?.firstName || ''} \\\${reservation?.client?.lastName || ''}<br>
              <strong>ADRESSE :</strong> \\\${reservation?.client?.completeAddress || reservation?.client?.wilaya || 'N/A'}<br>
              \\\${reservation?.client?.idCardNumber ? '<strong>BP :</strong> ' + reservation.client.idCardNumber + '<br>' : ''}
              \\\${reservation?.client?.licenseNumber ? '<strong>NIS :</strong> ' + reservation.client.licenseNumber + '<br>' : ''}
              \\\${reservation?.client?.documentNumber ? '<strong>NIF :</strong> ' + reservation.client.documentNumber + '<br>' : ''}
            </div>
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>REF</th>
              <th>MARQUE / MODELE</th>
              <th>IMMATRICULE</th>
              <th>DU</th>
              <th>AU</th>
              <th>N° JR</th>
              <th>PRIX UNIT</th>
              <th>HT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>\\\${reservation?.id ? reservation.id.toString().substring(0, 3).toUpperCase() : '001'}</td>
              <td class="left">\\\${reservation?.car?.brand || ''} \\\${reservation?.car?.model || ''}</td>
              <td>\\\${(reservation?.car as any)?.registration || (reservation?.car as any)?.plateNumber || (reservation?.car as any)?.plate_number || 'N/A'}</td>
              <td>\\\${departDate}</td>
              <td>\\\${returnDate}</td>
              <td>\\\${days}</td>
              <td>\\\${pricePerDay.toLocaleString('fr-FR')} DA</td>
              <td>\\\${subtotal.toLocaleString('fr-FR')} DA</td>
            </tr>
          </tbody>
        </table>
        
        <div class="totals-wrapper">
          <table class="totals-table">
            <tr><td>TOTAL HT :</td><td>\\\${subtotal.toLocaleString('fr-FR')} DA</td></tr>
            <tr><td>TOTAL TVA :</td><td>\\\${tvaAmount.toLocaleString('fr-FR')} DA</td></tr>
            <tr><td>TIMBRE :</td><td>\\\${timbre.toLocaleString('fr-FR')} DA</td></tr>
            <tr class="total-payer"><td>TOTAL A PAYER :</td><td>\\\${total.toLocaleString('fr-FR')} DA</td></tr>
          </table>
        </div>
        
        <div class="arretee-section">
          <div class="arretee-label">ARRETEE LA PRESENTE FACTURE À LA SOMME DE :</div>
          <div class="amount-words-fr">\\\${totalWords}</div>
          <div class="amount-words-ar">حي إبلاغ على 07 محل رقم 2 طريق الأرضي برج الكيفان الجزائر</div>
        </div>
        
        <div class="footer-section">
          \\\${agencySettings?.logo ? \\\`<img src="\\\${agencySettings.logo}" alt="Stamp" class="footer-stamp">\\\` : '<div class="footer-stamp-placeholder">🏢</div>'}
          <div class="footer-info">
            <div>\\\${agencySettings?.address || ''}</div>
            \\\${agencySettings?.phone_number_2 ? '<div>' + agencySettings.phone_number_2 + '</div>' : ''}
            \\\${agencySettings?.bank_number ? '<div><strong>COMPTE BANCAIRE : ' + agencySettings.bank_number + '</strong></div>' : ''}
          </div>
        </div>
      </div>
    </body>
    </html>
    \\\`;
    return html;
  };

`;

const before = content.substring(0, startIdx);
const after = content.substring(endIdx);
const newContent = before + newFunction + after;

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully updated generateFactureHTML function to be BIGGER!');
