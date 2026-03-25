-- SQL Code to Insert Document Templates for Contrat Type
-- This script inserts sample document templates for the 'contrat' (contract) document type

-- First, get your agency_id from the agencies table
-- Replace 'YOUR_AGENCY_ID' with the actual agency ID from your database

-- Insert a default contrat template
INSERT INTO public.document_templates (
  id,
  agency_id,
  template_type,
  template,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'YOUR_AGENCY_ID', -- Replace with actual agency_id
  'contrat',
  '{
    "title": {
      "x": 120,
      "y": 40,
      "color": "#000000",
      "fontSize": 24,
      "fontFamily": "Arial",
      "fontWeight": "bold",
      "fontStyle": "normal",
      "textDecoration": "none",
      "textAlign": "center",
      "backgroundColor": "transparent"
    },
    "client_name": {
      "x": 80,
      "y": 140,
      "color": "#000000",
      "fontSize": 12,
      "fontFamily": "Arial",
      "fontWeight": "normal",
      "fontStyle": "normal",
      "textDecoration": "none",
      "textAlign": "left",
      "backgroundColor": "transparent"
    },
    "car_model": {
      "x": 80,
      "y": 180,
      "color": "#000000",
      "fontSize": 12,
      "fontFamily": "Arial",
      "fontWeight": "normal",
      "fontStyle": "normal",
      "textDecoration": "none",
      "textAlign": "left",
      "backgroundColor": "transparent"
    },
    "rental_dates": {
      "x": 80,
      "y": 220,
      "color": "#000000",
      "fontSize": 12,
      "fontFamily": "Arial",
      "fontWeight": "normal",
      "fontStyle": "normal",
      "textDecoration": "none",
      "textAlign": "left",
      "backgroundColor": "transparent"
    },
    "price_total": {
      "x": 80,
      "y": 260,
      "color": "#000000",
      "fontSize": 14,
      "fontFamily": "Arial",
      "fontWeight": "bold",
      "fontStyle": "normal",
      "textDecoration": "none",
      "textAlign": "left",
      "backgroundColor": "transparent"
    },
    "signature_line": {
      "x": 80,
      "y": 450,
      "color": "#000000",
      "fontSize": 10,
      "fontFamily": "Arial",
      "fontWeight": "normal",
      "fontStyle": "normal",
      "textDecoration": "none",
      "textAlign": "left",
      "backgroundColor": "transparent"
    }
  }'::jsonb,
  now(),
  now()
);

-- Insert a professional contrat template variation
INSERT INTO public.document_templates (
  id,
  agency_id,
  template_type,
  template,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'YOUR_AGENCY_ID', -- Replace with actual agency_id
  'contrat',
  '{
    "title": {
      "x": 150,
      "y": 50,
      "color": "#1a365d",
      "fontSize": 28,
      "fontFamily": "Arial",
      "fontWeight": "bold",
      "fontStyle": "normal",
      "textDecoration": "none",
      "textAlign": "center",
      "backgroundColor": "transparent"
    },
    "client_name": {
      "x": 100,
      "y": 150,
      "color": "#2d3748",
      "fontSize": 13,
      "fontFamily": "Arial",
      "fontWeight": "normal",
      "fontStyle": "normal",
      "textDecoration": "none",
      "textAlign": "left",
      "backgroundColor": "transparent"
    },
    "car_model": {
      "x": 100,
      "y": 190,
      "color": "#2d3748",
      "fontSize": 13,
      "fontFamily": "Arial",
      "fontWeight": "normal",
      "fontStyle": "normal",
      "textDecoration": "none",
      "textAlign": "left",
      "backgroundColor": "transparent"
    },
    "rental_dates": {
      "x": 100,
      "y": 230,
      "color": "#2d3748",
      "fontSize": 13,
      "fontFamily": "Arial",
      "fontWeight": "normal",
      "fontStyle": "normal",
      "textDecoration": "none",
      "textAlign": "left",
      "backgroundColor": "transparent"
    },
    "price_total": {
      "x": 100,
      "y": 280,
      "color": "#0066cc",
      "fontSize": 16,
      "fontFamily": "Arial",
      "fontWeight": "bold",
      "fontStyle": "normal",
      "textDecoration": "none",
      "textAlign": "left",
      "backgroundColor": "transparent"
    },
    "signature_line": {
      "x": 100,
      "y": 470,
      "color": "#000000",
      "fontSize": 11,
      "fontFamily": "Arial",
      "fontWeight": "normal",
      "fontStyle": "normal",
      "textDecoration": "none",
      "textAlign": "left",
      "backgroundColor": "transparent"
    }
  }'::jsonb,
  now(),
  now()
);

-- SQL to query your agency ID (run this first to get the correct ID)
-- SELECT id, name FROM public.agencies LIMIT 1;

-- SQL to list all saved templates
-- SELECT id, agency_id, template_type, created_at, updated_at 
-- FROM public.document_templates 
-- WHERE template_type = 'contrat'
-- ORDER BY created_at DESC;

-- SQL to update an existing template
-- UPDATE public.document_templates 
-- SET template = '{...}'::jsonb, updated_at = now()
-- WHERE id = 'TEMPLATE_ID'
-- AND template_type = 'contrat';

-- SQL to delete a template
-- DELETE FROM public.document_templates 
-- WHERE id = 'TEMPLATE_ID'
-- AND template_type = 'contrat';
