/**
 * INTEGRATION EXAMPLE
 * 
 * This file demonstrates how to integrate the new dynamic printing system
 * into your existing components.
 */

// ============================================================================
// EXAMPLE 1: Using DynamicDocumentPrinter in ReservationDetailsView
// ============================================================================

import React, { useEffect, useState } from 'react';
import { DynamicDocumentPrinter } from '../components/DynamicDocumentPrinter';
import { supabase } from '../supabase';
import { DocumentType } from '../types';

const ReservationDetailsViewExample = () => {
  const [currentAgencyId, setCurrentAgencyId] = useState<string>('');
  const [agencySettings, setAgencySettings] = useState<any>(null);
  const [reservation, setReservation] = useState<any>(null);

  useEffect(() => {
    loadAgencyInfo();
    loadReservationData();
  }, []);

  const loadAgencyInfo = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('id', userData?.user?.id)
        .single();

      if (userProfile?.agency_id) {
        setCurrentAgencyId(userProfile.agency_id);

        const { data: settings } = await supabase
          .from('agency_settings')
          .select('*')
          .eq('id', userProfile.agency_id)
          .single();

        setAgencySettings(settings);
      }
    } catch (error) {
      console.error('Error loading agency info:', error);
    }
  };

  const loadReservationData = async () => {
    // Fetch reservation, client, car data
    // This is a simplified example
    const reservationData = {
      id: 'res-123',
      clientData: {
        first_name: 'Ahmed',
        last_name: 'Ali',
        phone: '+213 555 1234',
        email: 'ahmed@example.com',
      },
      carData: {
        brand: 'Toyota',
        model: 'Camry',
        year: 2023,
        color: 'White',
      },
      departure_date: '2024-03-25',
      return_date: '2024-03-28',
      total_price: 25000,
      payments: [
        { id: '1', amount: 5000 },
        { id: '2', amount: 5000 },
      ],
    };

    setReservation(reservationData);
  };

  if (!reservation || !currentAgencyId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Other reservation details */}

      {/* Print Devis (Quote) */}
      <div className="border rounded-lg p-4">
        <h3 className="text-xl font-bold mb-4">📋 Devis</h3>
        <DynamicDocumentPrinter
          documentType="devis"
          agencyId={currentAgencyId}
          documentData={{
            client: reservation.clientData,
            reservation: reservation,
            car: reservation.carData,
            payments: reservation.payments,
            agencySettings: agencySettings,
          }}
          customTitle="Devis"
        />
      </div>

      {/* Print Contrat (Contract) */}
      <div className="border rounded-lg p-4">
        <h3 className="text-xl font-bold mb-4">📄 Contrat</h3>
        <DynamicDocumentPrinter
          documentType="contrat"
          agencyId={currentAgencyId}
          documentData={{
            client: reservation.clientData,
            reservation: reservation,
            car: reservation.carData,
            payments: reservation.payments,
            agencySettings: agencySettings,
          }}
          customTitle="Contrat de Location"
        />
      </div>

      {/* Print Reçu (Receipt) */}
      <div className="border rounded-lg p-4">
        <h3 className="text-xl font-bold mb-4">🧾 Reçu de Versement</h3>
        <DynamicDocumentPrinter
          documentType="recu"
          agencyId={currentAgencyId}
          documentData={{
            client: reservation.clientData,
            reservation: reservation,
            car: reservation.carData,
            payments: reservation.payments,
            agencySettings: agencySettings,
          }}
          customTitle="Reçu de Versement"
        />
      </div>
    </div>
  );
};

// ============================================================================
// EXAMPLE 2: Using Services Directly
// ============================================================================

import { TemplateService } from '../services/TemplateService';
import { RenderService } from '../services/RenderService';
import { PrintService } from '../services/PrintService';

const DirectServiceUsageExample = async () => {
  const agencyId = 'agency-123';
  const documentType: DocumentType = 'contrat';

  try {
    // Step 1: Get or create default template
    const template = await TemplateService.getOrCreateDefaultTemplate(
      documentType,
      agencyId
    );

    console.log('Loaded template:', template.name);

    // Step 2: Build document data
    const documentData = RenderService.buildDocumentData(
      {
        first_name: 'Ahmed',
        last_name: 'Ali',
        phone: '+213 555 1234',
        email: 'ahmed@example.com',
      },
      {
        id: 'res-123',
        departure_date: '2024-03-25',
        return_date: '2024-03-28',
        total_price: 25000,
      },
      {
        brand: 'Toyota',
        model: 'Camry',
        year: 2023,
        color: 'White',
      },
      [
        { id: '1', amount: 5000 },
        { id: '2', amount: 5000 },
      ],
      {
        agency_name: 'Luxdrive',
        phone: '+213 555 5555',
        address: 'Downtown Algiers',
      }
    );

    // Step 3: Validate data
    const validation = RenderService.validateData(
      template.template.html,
      documentData
    );

    if (!validation.valid) {
      console.warn('Missing variables:', validation.missing);
    }

    // Step 4: Print
    await PrintService.printTemplatedDocument(
      'Contrat de Location',
      template.template.html,
      documentData,
      template.template.styles
    );
  } catch (error) {
    console.error('Error:', error);
  }
};

// ============================================================================
// EXAMPLE 3: Custom Template Workflow
// ============================================================================

const CustomTemplateWorkflowExample = async () => {
  const agencyId = 'agency-123';

  try {
    // Step 1: Get all templates for a type
    const templates = await TemplateService.getTemplatesByType('contrat', agencyId);
    console.log('Available templates:', templates.map(t => t.name));

    // Step 2: Let user select one or create new
    const selectedTemplate = templates[0]; // Or let user choose

    // Step 3: Get template content
    const html = selectedTemplate.template.html;
    const styles = selectedTemplate.template.styles;

    // Step 4: Extract placeholders to show user
    const placeholders = RenderService.extractPlaceholders(html);
    console.log('Required fields:', placeholders);

    // Step 5: Render with data
    const data = RenderService.buildDocumentData(
      /* ... */
    );

    const renderedHtml = RenderService.renderTemplate(html, data);

    // Step 6: Save as new template if modified
    const newTemplate = await TemplateService.saveTemplate(
      'contrat',
      agencyId,
      'My Custom Contract',
      { html: renderedHtml, styles: styles },
      false // Not default
    );

    console.log('Saved new template:', newTemplate.id);

    // Step 7: Print
    PrintService.printDocument('My Contract', renderedHtml);
  } catch (error) {
    console.error('Error:', error);
  }
};

// ============================================================================
// EXAMPLE 4: Error Handling
// ============================================================================

const ErrorHandlingExample = async () => {
  try {
    const template = await TemplateService.getOrCreateDefaultTemplate(
      'contrat',
      'invalid-agency'
    );

    if (!template) {
      throw new Error('No template found and could not create default');
    }

    // Continue with template...
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Failed to save')) {
        console.error('Database error saving template');
        // Show user-friendly error
      } else if (error.message.includes('popup')) {
        console.error('Popup blocked by browser');
        // Suggest to disable popup blocker
      } else {
        console.error('Unknown error:', error.message);
      }
    }
  }
};

// ============================================================================
// EXAMPLE 5: Component Integration - Before & After
// ============================================================================

// BEFORE (OLD WAY - HARDCODED):
/*
const OldReservationPrint = () => {
  const handlePrint = () => {
    const printContent = `
      <h1>Contrat</h1>
      <p>Client: ${client.name}</p>
      <p>Car: ${car.model}</p>
    `;
    
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  return <button onClick={handlePrint}>Print</button>;
};
*/

// AFTER (NEW WAY - DYNAMIC):
const NewReservationPrint = () => {
  const [agencyId, setAgencyId] = useState('');

  useEffect(() => {
    loadAgencyId();
  }, []);

  const loadAgencyId = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', userData?.user?.id)
      .single();
    setAgencyId(userProfile?.agency_id);
  };

  return (
    <DynamicDocumentPrinter
      documentType="contrat"
      agencyId={agencyId}
      documentData={{
        client: clientData,
        reservation: reservationData,
        car: carData,
        payments: paymentsData,
      }}
    />
  );
};

// ============================================================================
// EXAMPLE 6: Creating Sample Templates
// ============================================================================

export const createSampleTemplates = async (agencyId: string) => {
  const templates = [
    {
      type: 'contrat' as DocumentType,
      name: 'Contrat Luxe',
      html: `
        <div style="border: 2px solid gold; padding: 20px;">
          <h1 style="color: gold; text-align: center;">CONTRAT PREMIUM</h1>
          <p><strong>Client:</strong> {{client_name}}</p>
          <p><strong>Véhicule:</strong> {{car_model}}</p>
          <p><strong>Prix:</strong> {{total_price}} DA</p>
          <p style="margin-top: 40px; text-align: center;">
            Signature: ___________________
          </p>
        </div>
      `,
      styles: { font: 'Georgia', primaryColor: '#DAA520' },
      isDefault: true,
    },
    {
      type: 'devis' as DocumentType,
      name: 'Devis Simple',
      html: `
        <h1>DEVIS</h1>
        <p>Numéro: {{quote_number}}</p>
        <p>Client: {{client_name}}</p>
        <p>Montant: {{total_price}} DA</p>
      `,
      styles: { font: 'Arial' },
      isDefault: true,
    },
  ];

  for (const tmpl of templates) {
    await TemplateService.saveTemplate(
      tmpl.type,
      agencyId,
      tmpl.name,
      { html: tmpl.html, styles: tmpl.styles },
      tmpl.isDefault
    );
  }
};

// ============================================================================
// EXPORT
// ============================================================================

export {
  ReservationDetailsViewExample,
  DirectServiceUsageExample,
  CustomTemplateWorkflowExample,
  ErrorHandlingExample,
  NewReservationPrint,
};
