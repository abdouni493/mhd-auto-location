/**
 * Conditions Templates - Arabic and French
 * Used for printing rental conditions without database connection
 * Language: Both Arabic (RTL) and French (LTR)
 */

export interface ConditionItem {
  title: string;
  content: string;
}

export interface ConditionsTemplate {
  language: 'ar' | 'fr';
  title: string;
  subtitle: string;
  conditions: ConditionItem[];
  clientSignatureLabel: string;
  agencySignatureLabel: string;
}

/**
 * ARABIC CONDITIONS TEMPLATE
 * Complete rental agreement conditions in Arabic
 */
export const ARABIC_CONDITIONS_TEMPLATE: ConditionsTemplate = {
  language: 'ar',
  title: 'شروط الإيجار',
  subtitle: 'يكمك قراءة شروط العقد في الأسفل ومصادقة عليها',
  conditions: [
    {
      title: 'السن',
      content: 'يجب أن يكون السانق يبلغ من العمر 20 عامًا على الأقل، وأن يكون حاصلًا على رخصة قيادة منذ سنتين على الأقل'
    },
    {
      title: 'جواز السفر',
      content: 'إيداع جواز السقر اليومتري الزامي، بالإضافة إلى دفع تأمين ابتدائي يبدأ من 30.000,00 دج حسب فة المركبة، ويّعدّ هذا بمناية ضمان تطلبه'
    },
    {
      title: 'الوقود',
      content: 'الوقود يكون على تفقة الزيون'
    },
    {
      title: 'قاتون ونظام',
      content: 'يتم الدفع تقدًا عند تسليم السيارة'
    },
    {
      title: 'النظافة',
      content: 'تسلم السيارة تظيفة ويجب إرجاعها في نفس الحالة، وفي حال عدم ذلك، سيتم احتساب تكلفة الغسيل بمبلغ 1000 دج'
    },
    {
      title: 'مكان التسليم',
      content: 'يتم تسليم السيارات في موقف السيارات التابع لوكالاتتا'
    },
    {
      title: 'جدول المواعيد',
      content: 'يجب على الزبون احترام المواعيد المحددة عند الحجز. يجب الإبلاغ مسيقا عن أي تغير. لا يمكن للزبون تمديد مدة الإيجار إلا يعد الحصول على إذن من وكالتنا للإيجار، وذلك باتعار مسبق لا يقل عن 48 ساعة'
    },
    {
      title: 'الأضرار والضائر',
      content: 'في حالة السرقة أو تضرر المركبة، يجب تقديم تصريح لدى مصالح الشرطة أو الدرك الوطنيقل أي تصريح، يجب على الزيون إيلاغ وكالة الكراء بشكل الزامي'
    },
    {
      title: 'عد السرقة',
      content: 'في حالة السرقة أو تضرر المركبة، يجب تقديم تصريح لدى مصالح الشرطة أو الدرك الوطنيقل أي تصريح، يجب على الزيون إيلاغ وكالة الكراء بشكل الزامي'
    },
    {
      title: 'تأمين',
      content: 'يستفيد من التأمين فقط الساتقون المذكورون في عقد الكراء يمنع منغا باتا إعارة أو تأجير المركبة من الياطن. وتكون جميع الأضرار الناتجة عن مثل هذه الحالات على عائق الزيون بالكامل'
    },
    {
      title: 'عطل ميكانيكى',
      content: 'خلال فترة الإيجار، وبناء على عدد الكيلومترات المقطوعة. يجب على الريون إجراء الفحوصات اللازمة مثل مستوى الزيت، حالة المحرك، ضغط الإطارات. وغيرها.في حال حدوث عطل ميكانيكي بسبب إهمال الزيون في إجراء هذه الفحوصات أو لأي سبب آخر ناتج عن مسؤولية الزبون (مثلاً: سر حوض الزيت، العارضة السفلية، القفل أو غرها)، فإن تكاليف الإصلاح والصياتة تكون على عاتق الزيون بالكامل'
    },
    {
      title: 'خسائر اضافية',
      content: 'الأضرار التي تلحق بالعجلات والإطارات، القيادة بالإطارات المفرغة من الهواع. التدهور، السرقة، تهب الملحقات، أعمال التخريب، الأضرار الميكاتيكي الناتجة عن سوء استخدام المركبة، المخالفات المرورية، الأضرار التي تحدث أسفل المركبة (الصدام الأمامي، الجوانب، حوض الزيت، العادم) والأضرار الناتجة عن الاضطرابات والتغبد كلها سيتم تحميل تكلفتها على الزيون'
    },
    {
      title: 'ضربية التاخر',
      content: 'دة الإيجار تحتسب على فرات كاملة مدتها 24 ساعة غير قابلة للتقسم، بدغا من وقت حجز المركية وحتى الوقت المذكور في العقد يجب على زيون إعادة المركبة فى نفس الوقت، وإلا سيتم احتساب تكلفة تأخير مقدار ها 800 دينار لكل ساعة تأذ'
    },
    {
      title: 'عدد الأميال',
      content: 'عدد الكيلومترات محدود لجميع مركبانتا ب 300 كم يوميا.ويفرض غرامة قدرها 30 دج عن كل كلومتر زائد'
    },
    {
      title: 'شروط',
      content: 'يقرّ الزيون بأنه اطلع على شروط الإيجار هذه وقبولها دون أي تحفظ، ويتعهد بتوقع هذا العقد'
    }
  ],
  clientSignatureLabel: 'امضاء وبصمة الزبون',
  agencySignatureLabel: 'امضاء صاحب وكالة'
};

/**
 * FRENCH CONDITIONS TEMPLATE
 * Complete rental agreement conditions in French
 */
export const FRENCH_CONDITIONS_TEMPLATE: ConditionsTemplate = {
  language: 'fr',
  title: 'Conditions Générales de location véhicule',
  subtitle: 'Vous pouvez lire les conditions de location, elles apparaîtront sur le contra de location',
  conditions: [
    {
      title: 'Age',
      content: 'Le conducteur doit être âgé au minimum de 20 ans et être titulaire d\'un permis de conduire d\'au moins 2 ans.'
    },
    {
      title: 'Passeport',
      content: 'Dépôt obligatoire du passeport biométrique et le consionement a partir de 30.000,00Da selon la catégorie du vhécule qui constitue une garantie que nous de mandons.'
    },
    {
      title: 'Carburant',
      content: 'Le carburant est à la charge du client.'
    },
    {
      title: 'Règlement',
      content: 'Le paiement se fait à la livraison de la voiture en espèces.'
    },
    {
      title: 'Propreté',
      content: 'Le véhicule est livré propre et doit être restitué dans le même état, faute de quoi le lavage sera facturé au prix de 1000 Da.'
    },
    {
      title: 'Lieux de livraisons',
      content: 'La livraison des voitures s\'effectue sur le parking de nos agences.'
    },
    {
      title: 'Horaire',
      content: 'Le client doit respecter les horaires établit à la réservation. Tout changement doit être signalé à l\'avance. Le client ne peut prolonger sa location que sur autorisation de notre agence location avec un préavis de 48 heures.'
    },
    {
      title: 'Cas de sinistre',
      content: 'Assurance de base : Le client s\'engage à payer tout dégât occasionné sur le véhicule qu\'il soit fautif ou non faut if. Toutes dégats sur le véhicule feras l\'objet d\'un ponctionnement sur la contion de garantie'
    },
    {
      title: 'Cas de vol',
      content: 'Avant toute déclaration au préalable le client doit obligatoirement informé l\'agence de location Le vol ou la dégradation du véhicule doivent faire lobjet d\'une déclaration auprès des services de police ou de la gendarmerie.'
    },
    {
      title: 'Assurances',
      content: 'Seuls les conducteurs mentionnés sur le contrat de location bénéficient de l\'assurance. Le prêt et la sous-location du véhicule sont strictement interdits. L\'intégralité des dommages survenus dans ces circonstances est à la charge du client.'
    },
    {
      title: 'Panne mécanique',
      content: 'Au cours de la location en fonction du kilométrage parcourus le client doit effectuer les contrôles d\'usage (niveau d\'huile, moteur, pression des pneus, etc....). En cas de panne mécanique due à la négligence du client pour ne pas avoir effectué les contrôles d\'usage ou pour tout autre raisons due à la responsabilité du client (ex: casse carter d\'huile, triangle inférieur, serrure ou autres etc.), la prise en charge du dépannage et de la réparation sont à la charge totale du client.'
    },
    {
      title: 'Dégâts supplémentaire',
      content: 'Les dégâts aux jantes et pneumatiques, le roude à plat des pneumatiques, la détérioration, les vols, les pillages d\'accessoires, les actes de vandalisme, les dégâts mécaniques dus à une mauvaise utilisation du véhicule, les procès verbaux, les dégâts survenus en dessous du véhicule (jupe, bas de caisse, carter d\'huile, échappement) et les dommages causés par les troubles et émeutes seront facturés au client.'
    },
    {
      title: 'Pénalité de retard',
      content: 'La durée de location se calcul par tranche de 24 heure non fractionnable depuis l\'heure de la réservation du véhicule et l\'heure mentionnée sur le contrat. Le client doit restituer le véhicule à la même heure autrement chaque heure de retard sera facturée au prix de 800 dinars/heure.'
    },
    {
      title: 'Kilométrage',
      content: 'Le kilométrage est limité pour tous nos véhicules a 300Km/Jour. Le client déclare avoir pris connaissance et accepter sans réserve les présentes conditions de location.et s engage a signé ce contrat.'
    },
    {
      title: 'Acceptation',
      content: 'Le client déclare avoir pris connaissance et accepter sans réserve les présentes conditions de location.et s engage a signé ce contrat.'
    }
  ],
  clientSignatureLabel: 'Signature et empreinte du client',
  agencySignatureLabel: 'Signature et scellés de l\'Agence'
};

/**
 * Get conditions template by language
 */
export const getConditionsTemplate = (language: 'ar' | 'fr'): ConditionsTemplate => {
  return language === 'ar' ? ARABIC_CONDITIONS_TEMPLATE : FRENCH_CONDITIONS_TEMPLATE;
};

/**
 * Generate HTML content for printing conditions
 */
export const generateConditionsPrintHTML = (language: 'ar' | 'fr'): string => {
  const template = getConditionsTemplate(language);
  const isArabic = language === 'ar';
  const dir = isArabic ? 'rtl' : 'ltr';
  const textAlign = isArabic ? 'right' : 'left';

  // Compact conditions HTML - optimized for single page
  const conditionsHTML = template.conditions
    .map((condition, index) => `
      <tr>
        <td style="width: 5%; text-align: center; color: #1a3a52; font-weight: 700; font-size: 9px; padding: 4px 3px; border-bottom: 0.5px solid #e0e0e0; vertical-align: top;">${index + 1}</td>
        <td style="width: 25%; font-weight: 600; color: #1a3a52; font-size: 8.5px; padding: 4px 6px; border-bottom: 0.5px solid #e0e0e0; vertical-align: top;">${condition.title}</td>
        <td style="width: 70%; color: #333; font-size: 8px; padding: 4px 6px; border-bottom: 0.5px solid #e0e0e0; line-height: 1.2; vertical-align: top;">${condition.content}</td>
      </tr>
    `)
    .join('');

  return `
    <!DOCTYPE html>
    <html dir="${dir}" lang="${language}">
    <head>
      <meta charset="utf-8">
      <title>شروط الإيجار - Conditions de Location</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Arial', sans-serif;
          background: #f5f5f5;
          color: #333;
          line-height: 1.6;
          direction: ${dir};
          text-align: ${textAlign};
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .page {
          width: 210mm;
          height: 297mm;
          margin: 0 auto;
          padding: 12mm 12mm;
          background: white;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          page-break-after: avoid;
          page-break-inside: avoid;
          border: 2px solid #003399;
        }

        .header {
          flex-shrink: 0;
          text-align: center;
          border-bottom: 3px solid #003399;
          padding: 12mm 0 10mm 0;
          margin-bottom: 10mm;
          background: linear-gradient(to bottom, #f0f4ff 0%, #ffffff 100%);
        }

        .header h1 {
          font-size: 24px;
          color: #003399;
          margin: 0 0 6px 0;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .header p {
          font-size: 12px;
          color: #555;
          font-style: normal;
          line-height: 1.4;
          margin: 6px 0 0 0;
        }

        .conditions-section {
          flex-grow: 1;
          margin-bottom: 10mm;
          overflow: hidden;
          background: white;
          border: 1px solid #ddd;
          border-radius: 2px;
          padding: 10mm 12mm;
          page-break-inside: avoid;
        }

        .conditions-title {
          font-size: 15px;
          font-weight: 700;
          color: #003399;
          margin-bottom: 8mm;
          text-transform: none;
          letter-spacing: 0;
          padding-bottom: 8px;
          border-bottom: 2px solid #003399;
          text-align: left;
        }

        .conditions-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .conditions-table tbody tr:nth-child(odd) {
          background-color: #ffffff;
        }

        .conditions-table tbody tr:nth-child(even) {
          background-color: #f8f9fa;
        }

        .conditions-table tbody tr:hover {
          background-color: #f0f4ff;
        }

        .conditions-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #e0e0e0;
          vertical-align: top;
          line-height: 1.5;
        }

        .conditions-table td:first-child {
          font-weight: 700;
          color: #003399;
          text-align: center;
          width: 6%;
          background: #f0f4ff;
          border-right: 2px solid #ddd;
          padding: 8px 6px;
        }

        .conditions-table td:nth-child(2) {
          font-weight: 700;
          color: #003399;
          width: 22%;
          font-size: 12px;
        }

        .conditions-table td:nth-child(3) {
          color: #333;
          line-height: 1.5;
          width: 72%;
          font-size: 12px;
        }

        .signatures-section {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 8mm;
          background: linear-gradient(to right, #f0f4ff 0%, #ffffff 100%);
          border: 1px solid #ddd;
          border-left: 4px solid #003399;
          border-radius: 2px;
          padding: 12mm 14mm;
          page-break-inside: avoid;
        }

        .signatures-title {
          font-size: 14px;
          font-weight: 700;
          color: #003399;
          text-align: left;
          margin-bottom: 4mm;
          text-transform: none;
          letter-spacing: 0;
          padding-bottom: 6px;
          border-bottom: 2px solid #003399;
        }

        .signatures-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15mm;
        }

        .signature-block {
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 3mm;
        }

        .signature-line {
          border-top: 1.5px solid #003399;
          height: 22px;
          margin-bottom: 2mm;
          background: white;
          border-radius: 1px;
        }

        .signature-label {
          font-size: 11px;
          font-weight: 600;
          color: #003399;
          text-transform: none;
          letter-spacing: 0;
        }

        .print-date {
          text-align: center;
          font-size: 11px;
          color: #666;
          margin-top: 6mm;
          padding-top: 6mm;
          border-top: 1px solid #ddd;
          font-weight: 500;
        }

        @media print {
          @page {
            size: A4;
            margin: 0;
            padding: 0;
          }

          html, body {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            background: white;
            overflow: visible !important;
          }

          body {
            display: block;
            margin: 0;
            padding: 0;
          }

          .page {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 10mm 12mm;
            box-sizing: border-box;
            page-break-after: avoid;
            page-break-inside: avoid;
            display: flex;
            flex-direction: column;
          }

          .conditions-section {
            page-break-inside: avoid;
            margin-bottom: 8mm;
          }

          .signatures-section {
            page-break-inside: avoid;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <!-- Header -->
        <div class="header">
          <h1>${template.title}</h1>
          <p>${template.subtitle}</p>
        </div>

        <!-- Conditions -->
        <div class="conditions-section">
          <div class="conditions-title">${language === 'ar' ? 'شروط التأجير' : 'Conditions de Location'}</div>
          <table class="conditions-table">
            <tbody>
              ${conditionsHTML}
            </tbody>
          </table>
        </div>

        <!-- Signatures -->
        <div class="signatures-section">
          <div class="signatures-title">${language === 'ar' ? 'التوقيعات' : 'Signatures'}</div>

          <div class="signatures-grid">
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-label">${template.clientSignatureLabel}</div>
            </div>

            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-label">${template.agencySignatureLabel}</div>
            </div>
          </div>

          <div class="print-date">
            ${language === 'ar' ? 'التاريخ: ' : 'Date: '}${new Date().toLocaleDateString(language === 'ar' ? 'en-US' : 'fr-FR')}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};
