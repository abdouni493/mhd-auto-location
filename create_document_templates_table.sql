-- ============================================================================
-- DOCUMENT TEMPLATES TABLE MIGRATION
-- ============================================================================
-- This migration creates the document_templates table for the new
-- template-driven printing system.
-- ============================================================================

-- Drop table if exists (for fresh setup)
-- DROP TABLE IF EXISTS document_templates CASCADE;

-- Create the document_templates table
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL,
  name TEXT NOT NULL,
  template JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_template_type CHECK (
    template_type IN ('contrat', 'devis', 'facture', 'engagement', 'recu')
  ),
  
  -- Ensure only one default per type per agency
  CONSTRAINT one_default_per_type UNIQUE (agency_id, template_type, is_default) 
    WHERE is_default = true
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_templates_agency_id 
  ON document_templates(agency_id);

CREATE INDEX IF NOT EXISTS idx_document_templates_agency_type 
  ON document_templates(agency_id, template_type);

CREATE INDEX IF NOT EXISTS idx_document_templates_default 
  ON document_templates(agency_id, template_type, is_default) 
  WHERE is_default = true;

-- Create index for searching by name
CREATE INDEX IF NOT EXISTS idx_document_templates_name 
  ON document_templates(agency_id, name);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_document_templates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS document_templates_update_timestamp ON document_templates;

CREATE TRIGGER document_templates_update_timestamp
BEFORE UPDATE ON document_templates
FOR EACH ROW
EXECUTE FUNCTION update_document_templates_timestamp();

-- ============================================================================
-- SAMPLE DATA: Default Templates
-- ============================================================================

-- This section inserts default templates for the first agency
-- Replace the agency_id with your actual agency UUID

-- Get the first agency (adjust if needed)
DO $$
DECLARE
  v_agency_id UUID;
BEGIN
  -- Get first agency or specific one
  SELECT id INTO v_agency_id FROM agencies LIMIT 1;
  
  IF v_agency_id IS NOT NULL THEN
    -- Delete existing templates for clean insert
    DELETE FROM document_templates 
    WHERE agency_id = v_agency_id AND template_type = 'contrat';
    
    -- Insert Contract Template
    INSERT INTO document_templates (
      agency_id, template_type, name, template, is_default
    ) VALUES (
      v_agency_id,
      'contrat',
      'Contrat Standard',
      jsonb_build_object(
        'html', '<div style="font-family: Arial; line-height: 1.6; color: #333;">
          <div style="text-align: center; border-bottom: 2px solid #003399; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="margin: 0; color: #003399;">CONTRAT DE LOCATION DE VÉHICULE</h1>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">Numéro: {{quote_number}}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #003399; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Informations Client</h2>
            <p><strong>Nom et Prénom:</strong> {{client_name}}</p>
            <p><strong>Téléphone:</strong> {{client_phone}}</p>
            <p><strong>Email:</strong> {{client_email}}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #003399; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Informations du Véhicule</h2>
            <p><strong>Marque et Modèle:</strong> {{car_model}}</p>
            <p><strong>Année:</strong> {{car_year}}</p>
            <p><strong>Couleur:</strong> {{car_color}}</p>
            <p><strong>Immatriculation:</strong> {{car_registration}}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #003399; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Détails de Location</h2>
            <p><strong>Date de Départ:</strong> {{start_date}}</p>
            <p><strong>Date de Retour:</strong> {{end_date}}</p>
            <p><strong>Tarif Journalier:</strong> {{daily_rate}} DA</p>
            <p style="font-weight: bold; font-size: 14px;"><strong>Montant Total:</strong> {{total_price}} DA</p>
          </div>
          
          <div style="margin-bottom: 20px; padding: 15px; background-color: #f5f5f5; border-left: 3px solid #003399;">
            <h3 style="margin-top: 0; color: #003399;">Conditions Générales</h3>
            <p style="font-size: 11px; line-height: 1.4;">Le locataire s''engage à respecter toutes les conditions de location, y compris les règles de conduite, les délais de retour, et les responsabilités financières. Tout dommage ou infraction entraînera des frais supplémentaires selon le barème établi par l''agence.</p>
          </div>
          
          <div style="margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <p style="margin-bottom: 30px;"><strong>Signature de l''Agence:</strong></p>
              <p style="border-top: 1px solid #333; width: 150px; text-align: center; font-size: 11px;">Tampon et Signature</p>
            </div>
            <div>
              <p style="margin-bottom: 30px;"><strong>Signature du Locataire:</strong></p>
              <p style="border-top: 1px solid #333; width: 150px;"></p>
            </div>
          </div>
          
          <p style="text-align: center; font-size: 10px; color: #999; margin-top: 30px;">Document généré automatiquement - {{agency_name}}</p>
        </div>',
        'styles', jsonb_build_object(
          'font', 'Arial',
          'fontSize', '12px',
          'primaryColor', '#003399'
        )
      ),
      true
    );
    
    -- Delete existing devis templates
    DELETE FROM document_templates 
    WHERE agency_id = v_agency_id AND template_type = 'devis';
    
    -- Insert Quote (Devis) Template
    INSERT INTO document_templates (
      agency_id, template_type, name, template, is_default
    ) VALUES (
      v_agency_id,
      'devis',
      'Devis Standard',
      jsonb_build_object(
        'html', '<div style="font-family: Arial; line-height: 1.6; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; color: #003399;">DEVIS</h1>
            <p style="margin: 5px 0; font-size: 12px;">Numéro: {{quote_number}}</p>
          </div>
          
          <p><strong>Client:</strong> {{client_name}}</p>
          <p><strong>Véhicule:</strong> {{car_model}}</p>
          <p><strong>Période:</strong> {{start_date}} au {{end_date}}</p>
          <hr />
          <p><strong>Prix Total:</strong> {{total_price}} DA</p>
          <p style="font-size: 11px; color: #666;">Valable jusqu''au: {{validity_date}}</p>
        </div>',
        'styles', jsonb_build_object(
          'font', 'Arial',
          'fontSize', '12px'
        )
      ),
      true
    );
    
    -- Delete existing facture templates
    DELETE FROM document_templates 
    WHERE agency_id = v_agency_id AND template_type = 'facture';
    
    -- Insert Invoice (Facture) Template
    INSERT INTO document_templates (
      agency_id, template_type, name, template, is_default
    ) VALUES (
      v_agency_id,
      'facture',
      'Facture Standard',
      jsonb_build_object(
        'html', '<div style="font-family: Arial; line-height: 1.6; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0;">FACTURE</h1>
            <p style="margin: 5px 0; font-size: 12px;">N° {{invoice_number}}</p>
            <p style="margin: 5px 0; font-size: 12px;">Date: {{invoice_date}}</p>
          </div>
          
          <p><strong>Agence:</strong> {{agency_name}}</p>
          <p><strong>Client:</strong> {{client_name}}</p>
          <hr />
          <p><strong>Montant Total:</strong> {{amount}} DA</p>
          <p><strong>Conditions de Paiement:</strong> {{payment_terms}}</p>
        </div>',
        'styles', jsonb_build_object(
          'font', 'Arial',
          'fontSize', '12px'
        )
      ),
      true
    );
    
    -- Delete existing engagement templates
    DELETE FROM document_templates 
    WHERE agency_id = v_agency_id AND template_type = 'engagement';
    
    -- Insert Engagement Template
    INSERT INTO document_templates (
      agency_id, template_type, name, template, is_default
    ) VALUES (
      v_agency_id,
      'engagement',
      'Engagement Standard',
      jsonb_build_object(
        'html', '<div style="font-family: Arial; line-height: 1.6; color: #333;">
          <h1 style="text-align: center; color: #003399;">ENGAGEMENT DE LOCATION</h1>
          <p><strong>Numéro:</strong> {{engagement_number}}</p>
          <p><strong>Date:</strong> {{commitment_date}}</p>
          <hr />
          <p><strong>Client:</strong> {{client_name}}</p>
          <p><strong>Véhicule:</strong> {{car_model}}</p>
          <p>L''agence {{agency_name}} s''engage à mettre à la disposition du client le véhicule susmentionné aux conditions et prix convenus.</p>
          <hr />
          <p>Signature: ___________________</p>
        </div>',
        'styles', jsonb_build_object(
          'font', 'Arial',
          'fontSize', '12px'
        )
      ),
      true
    );
    
    -- Delete existing recu templates
    DELETE FROM document_templates 
    WHERE agency_id = v_agency_id AND template_type = 'recu';
    
    -- Insert Receipt (Reçu) Template
    INSERT INTO document_templates (
      agency_id, template_type, name, template, is_default
    ) VALUES (
      v_agency_id,
      'recu',
      'Reçu de Versement Standard',
      jsonb_build_object(
        'html', '<div style="font-family: Arial; line-height: 1.6; color: #333;">
          <h1 style="text-align: center;">REÇU DE VERSEMENT</h1>
          <p><strong>Numéro:</strong> {{receipt_number}}</p>
          <p><strong>Date:</strong> {{receipt_date}}</p>
          <hr />
          <p><strong>Montant Reçu:</strong> {{amount_paid}} DA</p>
          <p><strong>Mode de Paiement:</strong> {{payment_method}}</p>
          <p><strong>Client:</strong> {{client_name}}</p>
          <hr />
          <p style="text-align: center; font-size: 11px; color: #666;">Merci pour votre confiance!</p>
        </div>',
        'styles', jsonb_build_object(
          'font', 'Arial',
          'fontSize', '12px'
        )
      ),
      true
    );
    
    RAISE NOTICE 'Document templates created successfully for agency: %', v_agency_id;
  ELSE
    RAISE NOTICE 'No agency found. Please create an agency first.';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables created
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'document_templates';

-- Count templates
SELECT COUNT(*) as total_templates FROM document_templates;

-- List all templates
SELECT id, agency_id, template_type, name, is_default, created_at 
FROM document_templates 
ORDER BY agency_id, template_type, is_default DESC, created_at DESC;

-- ============================================================================
-- NOTES
-- ============================================================================

-- To manually insert a template:
-- INSERT INTO document_templates (agency_id, template_type, name, template, is_default)
-- VALUES (
--   'agency-uuid-here',
--   'contrat',
--   'My Custom Contract',
--   jsonb_build_object(
--     'html', '<h1>{{title}}</h1>...',
--     'styles', jsonb_build_object('font', 'Arial')
--   ),
--   false
-- );

-- To delete all templates for an agency:
-- DELETE FROM document_templates WHERE agency_id = 'agency-uuid-here';

-- To set a template as default:
-- UPDATE document_templates SET is_default = true WHERE id = 'template-uuid-here';
