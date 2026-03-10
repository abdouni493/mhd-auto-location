-- Add document_templates column to agency_settings table
ALTER TABLE public.agency_settings
ADD COLUMN IF NOT EXISTS document_templates jsonb DEFAULT '{
  "contrat": {
    "title": {"x": 120, "y": 40, "color": "#000000", "fontSize": 24},
    "client_name": {"x": 80, "y": 140, "color": "#000000", "fontSize": 12},
    "car_model": {"x": 80, "y": 180, "color": "#000000", "fontSize": 12},
    "rental_dates": {"x": 80, "y": 220, "color": "#000000", "fontSize": 12},
    "price_total": {"x": 80, "y": 260, "color": "#000000", "fontSize": 14},
    "signature_line": {"x": 80, "y": 450, "color": "#000000", "fontSize": 10}
  },
  "devis": {
    "title": {"x": 120, "y": 40, "color": "#000000", "fontSize": 24},
    "quote_number": {"x": 80, "y": 100, "color": "#000000", "fontSize": 12},
    "client_name": {"x": 80, "y": 140, "color": "#000000", "fontSize": 12},
    "car_model": {"x": 80, "y": 180, "color": "#000000", "fontSize": 12},
    "validity_date": {"x": 80, "y": 220, "color": "#000000", "fontSize": 11},
    "price_total": {"x": 80, "y": 260, "color": "#000000", "fontSize": 14}
  },
  "facture": {
    "title": {"x": 120, "y": 40, "color": "#000000", "fontSize": 24},
    "invoice_number": {"x": 80, "y": 100, "color": "#000000", "fontSize": 12},
    "invoice_date": {"x": 80, "y": 120, "color": "#000000", "fontSize": 11},
    "client_name": {"x": 80, "y": 160, "color": "#000000", "fontSize": 12},
    "car_model": {"x": 80, "y": 200, "color": "#000000", "fontSize": 12},
    "amount_due": {"x": 80, "y": 380, "color": "#000000", "fontSize": 14},
    "payment_terms": {"x": 80, "y": 420, "color": "#000000", "fontSize": 10}
  },
  "recu": {
    "title": {"x": 120, "y": 40, "color": "#000000", "fontSize": 24},
    "receipt_number": {"x": 80, "y": 100, "color": "#000000", "fontSize": 12},
    "receipt_date": {"x": 80, "y": 120, "color": "#000000", "fontSize": 11},
    "client_name": {"x": 80, "y": 160, "color": "#000000", "fontSize": 12},
    "amount_paid": {"x": 80, "y": 200, "color": "#000000", "fontSize": 14},
    "payment_method": {"x": 80, "y": 240, "color": "#000000", "fontSize": 11}
  },
  "engagement": {
    "title": {"x": 120, "y": 40, "color": "#000000", "fontSize": 24},
    "engagement_number": {"x": 80, "y": 100, "color": "#000000", "fontSize": 12},
    "client_name": {"x": 80, "y": 140, "color": "#000000", "fontSize": 12},
    "vehicle_info": {"x": 80, "y": 180, "color": "#000000", "fontSize": 12},
    "commitment_date": {"x": 80, "y": 220, "color": "#000000", "fontSize": 11},
    "terms_conditions": {"x": 80, "y": 260, "color": "#000000", "fontSize": 10}
  }
}'::jsonb;
