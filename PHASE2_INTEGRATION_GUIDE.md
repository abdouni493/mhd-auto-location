# Phase 2 Integration Guide: Strict Database-Only Printing System

## Overview
This guide explains how to integrate the new strict database-only printing system that replaces Phase 1 code with breaking changes.

**Key Changes from Phase 1:**
- ❌ No fallback to hardcoded defaults - fails explicitly
- ❌ No auto-creation of templates - requires database templates only
- ❌ No type-specific logic - all documents use identical workflow
- ✅ Unified PrintService with single entry point
- ✅ New ConditionsService for has_conditions feature
- ✅ Reusable TemplateSelector component

---

## Phase 2 Architecture

### Service Layer (Strict Database-Only)

#### 1. TemplateService_v2.ts
**Purpose:** STRICT database operations - throws errors instead of fallback

```typescript
// GETS template by ID - throws if not found
const template = await TemplateService.getTemplateById(templateId);

// GETS all templates for a type - throws if empty
const templates = await TemplateService.getTemplatesByType(documentType, agencyId);

// GETS default template - throws with detailed error if not found
const defaultTemplate = await TemplateService.getDefaultTemplate(documentType, agencyId);

// SAVES template with NEW hasConditions parameter
await TemplateService.saveTemplate(
  documentType,
  agencyId,
  name,
  templateJson,  // { html: string, styles?: {} }
  isDefault,
  hasConditions  // NEW: boolean - append engagement if true
);

// UPDATES existing template
await TemplateService.updateTemplate(templateId, updates);

// CHECKS if template exists (boolean)
const exists = await TemplateService.templateExists(documentType, agencyId);

// SETS as default - unsets others
await TemplateService.setAsDefault(templateId);
```

#### 2. RenderService_v2.ts
**Purpose:** ONLY {{placeholder}} replacement - no data building

```typescript
// CORE: Replaces {{key}} in HTML with data values
const rendered = RenderService.renderTemplate(htmlString, dataObject);

// Extracts {{placeholder}} names from HTML
const placeholders = RenderService.extractPlaceholders(htmlString);

// Validates which placeholders are missing in data
const { valid, missing } = RenderService.validateData(htmlString, dataObject);

// Formats values (handles null, dates, booleans)
const formatted = RenderService.formatValue(value);
```

#### 3. ConditionsService.ts (NEW)
**Purpose:** Append engagement template when has_conditions = true

```typescript
// GETS default engagement template for agency
const engagementTemplate = await ConditionsService.getConditionsTemplate(agencyId);

// APPENDS conditions to HTML if hasConditions = true
const documentWithConditions = await ConditionsService.appendConditionsIfNeeded(
  mainHtml,
  hasConditions,      // boolean: if true, append conditions
  dataObject,         // used to render engagement template
  agencyId
);

// BUILDS complete document with conditions (main workflow)
const finalHtml = await ConditionsService.buildCompleteDocument(
  template,     // DocumentTemplateRow
  dataObject,
  agencyId
);

// CHECKS if conditions will be applied (for UI/logic)
const willApply = await ConditionsService.conditionsWillBeApplied(
  hasConditions,
  agencyId
);
```

#### 4. PrintService_v2.ts (Unified)
**Purpose:** Single entry point for ALL document types

```typescript
// MAIN ENTRY POINT: Print any document type
await PrintService.printDocument(
  documentType,       // 'contrat' | 'devis' | 'facture' | 'engagement' | 'recu'
  agencyId,
  dataObject,         // complete data for template rendering
  selectedTemplateId? // optional: use specific template instead of default
);

// ALTERNATIVE: Preview in new window (no print dialog)
const previewWindow = await PrintService.previewDocument(
  documentType,
  agencyId,
  dataObject,
  selectedTemplateId?
);

// VALIDATE before printing
const { valid, missing } = PrintService.validateDocument(template, dataObject);

// CHECK print support
const supported = PrintService.isPrintSupported();
```

---

## Integration Steps

### Step 1: Update Database

Run migration script to add `has_conditions` column:

```sql
-- add_conditions_feature.sql
ALTER TABLE document_templates
ADD COLUMN has_conditions BOOLEAN DEFAULT false NOT NULL;

UPDATE document_templates
SET has_conditions = true
WHERE template_type = 'engagement';
```

### Step 2: Update Services in TemplateEditor

Replace old TemplateService with new v2:

```typescript
// OLD - REMOVE
import { TemplateService } from './TemplateService';

// NEW - USE v2
import { TemplateService } from './TemplateService_v2';

// When saving template, add hasConditions parameter
await TemplateService.saveTemplate(
  documentType,
  agencyId,
  name,
  template,
  isDefault,
  hasConditions  // NEW REQUIRED PARAMETER
);
```

### Step 3: Replace Print Calls

**BEFORE (Phase 1 - Multiple methods per type):**
```typescript
// OLD - Remove all of these
await PrintService.printContrat(data);
await PrintService.printDevis(data);
await PrintService.printFacture(data);
```

**AFTER (Phase 2 - Single unified method):**
```typescript
// NEW - Use for ALL types identically
await PrintService.printDocument('contrat', agencyId, data);
await PrintService.printDocument('devis', agencyId, data);
await PrintService.printDocument('facture', agencyId, data);

// With template selection
await PrintService.printDocument('contrat', agencyId, data, selectedTemplateId);
```

### Step 4: Use TemplateSelector Component

Replace old dialog/selector with new reusable component:

```typescript
// In your component
const handlePrint = async (documentType: DocumentType, data: Record<string, any>) => {
  try {
    // Show template selector
    const handleSelectTemplate = (template: DocumentTemplateRow) => {
      // Print with selected template
      await PrintService.printDocument(
        documentType,
        agencyId,
        data,
        template.id
      );
      setShowSelector(false);
    };

    // Render component
    return (
      <TemplateSelector
        documentType={documentType}
        agencyId={agencyId}
        onSelectTemplate={handleSelectTemplate}
        onCancel={() => setShowSelector(false)}
      />
    );
  } catch (error) {
    showError(error.message);
  }
};
```

---

## What to REMOVE from Old Code

### 1. Remove from PlannerPage.tsx
```typescript
// DELETE these methods - they generate hardcoded HTML
❌ generatePersonalizedContent()
❌ generatePrintContent()
❌ getInitialElements()
❌ buildDocumentData()

// DELETE hardcoded HTML templates
❌ CONTRAT_TEMPLATE
❌ DEVIS_TEMPLATE
❌ FACTURE_TEMPLATE
```

### 2. Remove from ReservationDetailsView.tsx
```typescript
// DELETE old print handlers
❌ handlePrintContrat()
❌ handlePrintDevis()
❌ handlePrintFacture()

// DELETE hardcoded document builders
❌ buildContratData()
❌ buildDevisData()
❌ buildFactureData()
```

### 3. Remove from DocumentRenderer.tsx
```typescript
// DELETE hardcoded field positioning
❌ renderContractFields()
❌ renderEstimateFields()
❌ renderInvoiceFields()

// DELETE field mapping constants
❌ FIELD_POSITIONS
❌ FIELD_STYLES
```

### 4. Remove TemplateService Methods
```typescript
// DELETE from TemplateService - STRICT v2 doesn't have these
❌ getOrCreateDefaultTemplate()  // Violates strict rule
❌ getDefaultHtml()              // Hardcoded defaults
❌ buildDocumentData()           // Data prep not service responsibility
```

---

## Error Handling

### Strict Error Behavior

**Old (Phase 1 - Graceful):**
```typescript
// Phase 1: Returns null if template not found
const template = await TemplateService.getDefaultTemplate('contrat', agencyId);
if (!template) {
  // Use hardcoded fallback
  return DEFAULT_CONTRAT_TEMPLATE;
}
```

**New (Phase 2 - Strict):**
```typescript
// Phase 2: Throws explicit error
try {
  const template = await TemplateService.getDefaultTemplate('contrat', agencyId);
  // Guaranteed template exists here
} catch (error) {
  // Handle: No 'contrat' template found for agency
  // NO fallback possible - must have template in database
}
```

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `No default template found for 'contrat'` | Missing default template | Create template in Document Templates |
| `No templates found for 'devis'` | No templates for type | Create at least one template for type |
| `Template not found: [id]` | Invalid template ID | Check template exists in database |
| `Missing engagement template for conditions` | has_conditions=true but no engagement default | Create default engagement template |

---

## Configuration Requirements

### Database Setup

All 5 document types must have at least one template:

```sql
SELECT template_type, COUNT(*) as template_count, 
       BOOL_OR(is_default) as has_default
FROM document_templates
WHERE agency_id = 'your-agency-id'
GROUP BY template_type;
```

Expected result for each type: contrat, devis, facture, engagement, recu

### Engagement Template Special Rules

When setting `has_conditions = true` on any document:
- Agency MUST have default engagement template
- Engagement template is automatically appended
- Same rendering data is used for both

Example in database:
```sql
-- Contrat with conditions
INSERT INTO document_templates (template_type, agency_id, name, is_default, has_conditions, template)
VALUES ('contrat', 'agency-1', 'Contrat Standard', true, true, ...);

-- Engagement (for conditions)
INSERT INTO document_templates (template_type, agency_id, name, is_default, has_conditions, template)
VALUES ('engagement', 'agency-1', 'Conditions Standard', true, false, ...);
```

---

## Complete Example: Print Reservation Contract

### Old Code (Phase 1 - Multiple hardcoded methods)
```typescript
// OLD - Remove all of this
async function printReservationContrat(reservation: Reservation) {
  // Generate hardcoded contrat HTML
  const html = generatePersonalizedContent('contrat', reservation);
  
  // Open print window
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.print();
}
```

### New Code (Phase 2 - Single unified method)
```typescript
// NEW - Replace with this
async function printReservationContrat(reservation: Reservation) {
  try {
    // Prepare complete data for template
    const data = {
      client_name: reservation.client.name,
      client_email: reservation.client.email,
      vehicle_brand: reservation.vehicle.brand,
      vehicle_model: reservation.vehicle.model,
      rental_start: reservation.startDate,
      rental_end: reservation.endDate,
      total_price: reservation.totalPrice,
      // ... all other template placeholders
    };

    // Print using unified service
    await PrintService.printDocument(
      'contrat',                    // document type
      reservation.agency_id,        // agency
      data,                        // complete data
      selectedTemplateId           // optional: specific template
    );
  } catch (error) {
    showError(`Failed to print contract: ${error.message}`);
  }
}
```

---

## Testing Checklist

- [ ] Database has `has_conditions` column
- [ ] All 5 document types have default templates
- [ ] Engagement template exists and is marked default
- [ ] PrintService.printDocument() works for all 5 types identically
- [ ] ConditionsService appends engagement when has_conditions=true
- [ ] TemplateSelector shows all templates for type
- [ ] Error thrown when template not found (not fallback)
- [ ] No hardcoded templates in React components
- [ ] All old print methods removed from old code
- [ ] Template rendering uses {{placeholder}} format
- [ ] Conditions only append for documents with has_conditions=true

---

## Migration Rollback

If issues arise, restore Phase 1 by:

1. Revert service imports
2. Keep has_conditions column but set all to false
3. Re-add old print methods
4. Note: Phase 2 is a breaking change - requires full migration

---

## Key Principles (STRICT Enforcement)

1. **Database ONLY** - No hardcoded templates anywhere
2. **Fail Loudly** - Throw errors instead of graceful degradation
3. **No Special Cases** - All 5 document types use identical workflow
4. **Explicit Selection** - User chooses template, no auto-selection
5. **Unified Service** - Single `printDocument()` for all types
6. **Conditions Link** - has_conditions=true → append engagement

---

## Support & Debugging

### Common Issues

**Q: "No templates found for 'contrat'"**
- A: Create template in Document Templates UI or run SQL insert

**Q: "Missing engagement template for conditions"**
- A: Create default engagement template with has_conditions=false

**Q: Print window didn't open**
- A: Check browser popup blocker settings

**Q: Template placeholders not rendering**
- A: Ensure placeholder format is {{key}} matching data property names

**Q: Old print code still being called**
- A: Search codebase for old methods and replace with PrintService.printDocument()

