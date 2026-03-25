-- ============================================================================
-- COMPREHENSIVE CONTRACT TEMPLATE WITH ALL FIELDS
-- ============================================================================
-- This migration updates the document_templates table with a complete 
-- contract structure that includes:
-- - Logo and agency name support
-- - Contract details (date, number)
-- - Rental period (start, end, duration)
-- - Driver information (name, DOB, place of birth, document info)
-- - Vehicle information (model, color, license plate, VIN, fuel, mileage)
-- - Financials (unit price, total HT, total amount)
-- - Equipment checklist
-- - Signature section
-- ============================================================================

-- First, DELETE old templates to avoid conflicts
DELETE FROM document_templates 
WHERE agency_id = '7dc45746-14ce-455f-98d4-b292a76f0b75' 
AND template_type = 'contrat';

-- INSERT the new comprehensive contract template using raw JSON
-- (avoids PostgreSQL's 100-argument limit on jsonb_build_object)
INSERT INTO document_templates (agency_id, template_type, template, created_at, updated_at)
VALUES (
  '7dc45746-14ce-455f-98d4-b292a76f0b75'::UUID,
  'contrat',
  '{
    "logo": {"x": 50, "y": 20, "width": 80, "height": 80, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "agency_name": {"x": 150, "y": 30, "fontSize": 18, "fontFamily": "Arial", "color": "#1a365d", "fontWeight": "bold", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "title": {"x": 150, "y": 120, "fontSize": 24, "fontFamily": "Arial", "color": "#000000", "fontWeight": "bold", "fontStyle": "normal", "textDecoration": "none", "textAlign": "center", "backgroundColor": "transparent"},
    "contract_details_title": {"x": 50, "y": 170, "fontSize": 14, "fontFamily": "Arial", "color": "#1a365d", "fontWeight": "bold", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "contract_date_label": {"x": 50, "y": 195, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "contract_date": {"x": 200, "y": 195, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "contract_number_label": {"x": 50, "y": 220, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "contract_number": {"x": 200, "y": 220, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "rental_period_title": {"x": 50, "y": 260, "fontSize": 14, "fontFamily": "Arial", "color": "#1a365d", "fontWeight": "bold", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "start_date_label": {"x": 50, "y": 285, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "start_date": {"x": 200, "y": 285, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "end_date_label": {"x": 50, "y": 310, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "end_date": {"x": 200, "y": 310, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "duration_label": {"x": 50, "y": 335, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "duration": {"x": 200, "y": 335, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "driver_info_title": {"x": 50, "y": 375, "fontSize": 14, "fontFamily": "Arial", "color": "#1a365d", "fontWeight": "bold", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "driver_name_label": {"x": 50, "y": 400, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "driver_name": {"x": 200, "y": 400, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "driver_birth_date_label": {"x": 50, "y": 425, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "driver_birth_date": {"x": 200, "y": 425, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "driver_birth_place_label": {"x": 50, "y": 450, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "driver_birth_place": {"x": 200, "y": 450, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "document_type_label": {"x": 50, "y": 475, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "document_type": {"x": 200, "y": 475, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "document_number_label": {"x": 50, "y": 500, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "document_number": {"x": 200, "y": 500, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "issue_date_label": {"x": 50, "y": 525, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "issue_date": {"x": 200, "y": 525, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "expiration_date_label": {"x": 50, "y": 550, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "expiration_date": {"x": 200, "y": 550, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "issue_place_label": {"x": 50, "y": 575, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "issue_place": {"x": 200, "y": 575, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "vehicle_info_title": {"x": 50, "y": 615, "fontSize": 14, "fontFamily": "Arial", "color": "#1a365d", "fontWeight": "bold", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "vehicle_model_label": {"x": 50, "y": 640, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "vehicle_model": {"x": 200, "y": 640, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "vehicle_color_label": {"x": 50, "y": 665, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "vehicle_color": {"x": 200, "y": 665, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "vehicle_license_plate_label": {"x": 50, "y": 690, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "vehicle_license_plate": {"x": 200, "y": 690, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "vehicle_vin_label": {"x": 50, "y": 715, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "vehicle_vin": {"x": 200, "y": 715, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "vehicle_fuel_label": {"x": 50, "y": 740, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "vehicle_fuel": {"x": 200, "y": 740, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "vehicle_mileage_label": {"x": 50, "y": 765, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "vehicle_mileage": {"x": 200, "y": 765, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "financials_title": {"x": 50, "y": 805, "fontSize": 14, "fontFamily": "Arial", "color": "#1a365d", "fontWeight": "bold", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "unit_price_label": {"x": 50, "y": 830, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "unit_price": {"x": 200, "y": 830, "fontSize": 12, "fontFamily": "Arial", "color": "#0066cc", "fontWeight": "bold", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "total_ht_label": {"x": 50, "y": 855, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "total_ht": {"x": 200, "y": 855, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "total_amount_label": {"x": 50, "y": 880, "fontSize": 14, "fontFamily": "Arial", "color": "#0066cc", "fontWeight": "bold", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "total_amount": {"x": 200, "y": 880, "fontSize": 16, "fontFamily": "Arial", "color": "#0066cc", "fontWeight": "bold", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "equipment_title": {"x": 50, "y": 920, "fontSize": 14, "fontFamily": "Arial", "color": "#1a365d", "fontWeight": "bold", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "equipment_list": {"x": 50, "y": 945, "fontSize": 11, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "signature_title": {"x": 50, "y": 1050, "fontSize": 12, "fontFamily": "Arial", "color": "#000000", "fontWeight": "bold", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"},
    "signature_line": {"x": 50, "y": 1080, "fontSize": 10, "fontFamily": "Arial", "color": "#000000", "fontWeight": "normal", "fontStyle": "normal", "textDecoration": "none", "textAlign": "left", "backgroundColor": "transparent"}
  }'::JSONB,
  NOW(),
  NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_document_templates_agency_type 
ON document_templates(agency_id, template_type);

-- Verify the template was inserted
SELECT id, agency_id, template_type, created_at 
FROM document_templates 
WHERE agency_id = '7dc45746-14ce-455f-98d4-b292a76f0b75' 
AND template_type = 'contrat'
ORDER BY created_at DESC
LIMIT 1;

