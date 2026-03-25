-- Migration: Add has_conditions feature to document templates
-- Purpose: Support conditional appending of engagement templates to other documents
-- Created: Phase 2 Refactoring

-- Add has_conditions column to document_templates table
ALTER TABLE document_templates
ADD COLUMN has_conditions BOOLEAN DEFAULT false NOT NULL;

-- Update engagement templates to have has_conditions = true
UPDATE document_templates
SET has_conditions = true
WHERE template_type = 'engagement';

-- Create index for querying templates with conditions
CREATE INDEX IF NOT EXISTS idx_document_templates_has_conditions
ON document_templates(agency_id, template_type, has_conditions);

-- Add comment explaining the feature
COMMENT ON COLUMN document_templates.has_conditions IS
'Boolean flag: when true, the engagement template will be automatically appended as conditions to this document. Engagement template MUST have is_default = true for the same agency.';

-- Verify migration results
SELECT 
  id,
  agency_id,
  template_type,
  name,
  is_default,
  has_conditions,
  created_at
FROM document_templates
ORDER BY agency_id, template_type, is_default DESC;
