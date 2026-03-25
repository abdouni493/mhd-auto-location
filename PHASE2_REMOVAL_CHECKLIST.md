# Phase 2: Hardcoded Template Removal Checklist

## Critical: Phase 2 REMOVES all hardcoded templates
This document identifies EXACTLY what to remove from old code to complete the Phase 2 migration.

---

## PlannerPage.tsx - REMOVAL LIST

### Methods to Delete
```typescript
❌ generatePersonalizedContent(documentType: string, reservation: any): string
  - Generates hardcoded HTML for contrat, devis, facture
  - Location: Search for "generatePersonalizedContent"
  - Replacement: Use PrintService.printDocument() instead

❌ generatePrintContent(documentType: string, reservation: any): string
  - Alternative method for print HTML generation
  - Location: Search for "generatePrintContent"
  - Replacement: None needed - use PrintService

❌ getInitialElements()
  - Builds hardcoded element positioning
  - Location: Search for "getInitialElements"
  - Replacement: None needed - database templates handle this

❌ buildDocumentData()
  - Constructs data from reservation
  - Location: Search for "buildDocumentData"
  - Replacement: Do this in component, pass to PrintService

❌ getDefaultTemplate(type: string)
  - Returns hardcoded template HTML
  - Location: Search for "getDefaultTemplate"
  - Replacement: TemplateService_v2.getDefaultTemplate()
```

### Constants to Delete
```typescript
❌ CONTRAT_TEMPLATE = `<html>...`
  - Hardcoded contract template
  - Search for: "CONTRAT_TEMPLATE"
  - Lines to remove: All const declarations with HTML

❌ DEVIS_TEMPLATE = `<html>...`
  - Hardcoded estimate template
  - Search for: "DEVIS_TEMPLATE"

❌ FACTURE_TEMPLATE = `<html>...`
  - Hardcoded invoice template
  - Search for: "FACTURE_TEMPLATE"

❌ ENGAGEMENT_TEMPLATE = `<html>...`
  - Hardcoded conditions template
  - Search for: "ENGAGEMENT_TEMPLATE"

❌ FIELD_POSITIONS = { ... }
  - Hardcoded field positioning
  - Search for: "FIELD_POSITIONS"

❌ FIELD_STYLES = { ... }
  - Hardcoded styling
  - Search for: "FIELD_STYLES"
```

### Code Patterns to Replace

**BEFORE (Old print handler):**
```typescript
const handlePrintContrat = async () => {
  const html = generatePersonalizedContent('contrat', reservation);
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.print();
};
```

**AFTER (New unified handler):**
```typescript
const handlePrintContrat = async () => {
  try {
    const data = {
      client_name: reservation.client.name,
      vehicle_brand: reservation.vehicle.brand,
      // ... all template placeholders
    };
    await PrintService.printDocument('contrat', agencyId, data);
  } catch (error) {
    showError(error.message);
  }
};
```

---

## ReservationDetailsView.tsx - REMOVAL LIST

### Methods to Delete
```typescript
❌ handlePrintContrat()
  - Handler for printing contract
  - Location: Search for "handlePrintContrat"
  - Replacement: Use PrintService.printDocument()

❌ handlePrintDevis()
  - Handler for printing estimate
  - Location: Search for "handlePrintDevis"

❌ handlePrintFacture()
  - Handler for printing invoice
  - Location: Search for "handlePrintFacture"

❌ buildContratData()
  - Builds data for contract
  - Location: Search for "buildContratData"
  - Replacement: Do inline in handler

❌ buildDevisData()
  - Builds data for estimate
  - Location: Search for "buildDevisData"

❌ buildFactureData()
  - Builds data for invoice
  - Location: Search for "buildFactureData"

❌ getDocumentHTML(type: string)
  - Returns template HTML
  - Location: Search for "getDocumentHTML"
  - Replacement: TemplateService_v2
```

### Button Handlers to Update

**BEFORE:**
```typescript
<button onClick={handlePrintContrat}>Print Contract</button>
<button onClick={handlePrintDevis}>Print Estimate</button>
<button onClick={handlePrintFacture}>Print Invoice</button>
```

**AFTER:**
```typescript
<button onClick={() => printDocument('contrat')}>Print Contract</button>
<button onClick={() => printDocument('devis')}>Print Estimate</button>
<button onClick={() => printDocument('facture')}>Print Invoice</button>

// Unified handler:
const printDocument = async (type: DocumentType) => {
  try {
    const data = prepareData(reservation, type);
    await PrintService.printDocument(type, agencyId, data);
  } catch (error) {
    showError(error.message);
  }
};
```

---

## DocumentRenderer.tsx - REMOVAL LIST

### Methods to Delete
```typescript
❌ renderContractFields(data: any, styles: any): JSX.Element
  - Renders hardcoded contract fields
  - Location: Search for "renderContractFields"
  - Replacement: Use database template HTML

❌ renderEstimateFields(data: any, styles: any): JSX.Element
  - Renders hardcoded estimate fields
  - Location: Search for "renderEstimateFields"

❌ renderInvoiceFields(data: any, styles: any): JSX.Element
  - Renders hardcoded invoice fields
  - Location: Search for "renderInvoiceFields"

❌ renderFieldPositions()
  - Calculates hardcoded field positions
  - Location: Search for "renderFieldPositions"

❌ applyFieldStyles()
  - Applies hardcoded styles
  - Location: Search for "applyFieldStyles"
```

### JSX to Remove
```typescript
❌ All <div> elements with hardcoded positions
❌ All inline style={{}} with field positioning
❌ All class names for document fields
❌ All hardcoded <table> layouts for documents
```

### Example Removals

**BEFORE (Hardcoded field rendering):**
```typescript
return (
  <div style={{ position: 'relative' }}>
    <h1 style={{ top: '100px', left: '50px' }}>{data.clientName}</h1>
    <p style={{ top: '150px', left: '50px' }}>{data.vehicleBrand}</p>
    <p style={{ top: '200px', left: '50px' }}>{data.rentalStart}</p>
    {/* ... more hardcoded fields */}
  </div>
);
```

**AFTER (Database template only):**
```typescript
// Component removed entirely or replaced with:
const { html } = template;
const rendered = RenderService.renderTemplate(html, data);
return <div dangerouslySetInnerHTML={{ __html: rendered }} />;
```

---

## TemplateService (Old) - REMOVAL LIST

### Methods to Delete (Don't use _v2)
```typescript
❌ getOrCreateDefaultTemplate(type: string, agencyId: string)
  - Auto-creates default template
  - Violates strict rule: must fail if not found
  - Replacement: TemplateService_v2.getDefaultTemplate() (throws error)

❌ getDefaultHtml(type: string)
  - Returns hardcoded template HTML
  - Location: Search for "getDefaultHtml"
  - Replacement: TemplateService_v2.getTemplatesByType()

❌ buildDocumentData(reservation: any, type: string)
  - Prepares data for template
  - This is caller responsibility now
  - Replacement: Do data prep in component before PrintService

❌ All methods in old TemplateService file
  - Replaced by TemplateService_v2
  - Migration: Replace imports only
```

### Import Changes

**BEFORE:**
```typescript
import { TemplateService } from './services/TemplateService';
import { RenderService } from './services/RenderService';
import { PrintService } from './services/PrintService';
```

**AFTER:**
```typescript
import { TemplateService } from './services/TemplateService_v2';
import { RenderService } from './services/RenderService_v2';
import { PrintService } from './services/PrintService_v2';
import { ConditionsService } from './services/ConditionsService';
```

---

## Database Cleaning

### Deprecated Columns/Tables to DROP (Optional)
```sql
-- If these exist from Phase 1, can be removed after migration:
❌ agency_settings.document_templates JSONB column
-- Reason: Now using separate document_templates table

❌ Any hardcoded_templates table or similar
-- Reason: All templates now in document_templates table
```

### What to KEEP
```sql
✅ document_templates table (with new has_conditions column)
✅ All template_type values: contrat, devis, facture, engagement, recu
✅ All existing template data (migrate if needed)
```

---

## Search Strings for Finding Code to Remove

Use these to find all occurrences:

```
Search in: src/
Pattern: "generatePersonalizedContent|generatePrintContent|getInitialElements|buildDocumentData|getDefaultTemplate|CONTRAT_TEMPLATE|DEVIS_TEMPLATE|FACTURE_TEMPLATE|ENGAGEMENT_TEMPLATE|FIELD_POSITIONS|renderContractFields|renderEstimateFields|renderInvoiceFields|getOrCreateDefaultTemplate|getDefaultHtml|handlePrintContrat|handlePrintDevis|handlePrintFacture"

Search for imports:
- "import.*TemplateService.*from.*TemplateService\'"  // OLD - replace with _v2
- "import.*RenderService.*from.*RenderService\'"      // OLD - replace with _v2
- "import.*PrintService.*from.*PrintService\'"        // OLD - replace with _v2
```

---

## Removal Process (Step-by-Step)

### 1. Identify Files with Hardcoded Content
```bash
grep -r "CONTRAT_TEMPLATE\|DEVIS_TEMPLATE\|FACTURE_TEMPLATE" src/
grep -r "generatePersonalizedContent\|renderContractFields" src/
grep -r "getDefaultHtml\|getOrCreateDefaultTemplate" src/
```

### 2. For Each File Found

**a) Update Imports**
```typescript
// REMOVE (old)
import { TemplateService } from './TemplateService';

// ADD (new)
import { TemplateService } from './TemplateService_v2';
import { ConditionsService } from './ConditionsService';
import { PrintService } from './PrintService_v2';
```

**b) Remove Constants**
```typescript
// DELETE all:
const CONTRAT_TEMPLATE = `...`;
const DEVIS_TEMPLATE = `...`;
const FIELD_POSITIONS = { ... };
```

**c) Remove Methods**
```typescript
// DELETE all:
generatePersonalizedContent() { ... }
renderContractFields() { ... }
buildDocumentData() { ... }
```

**d) Update Event Handlers**
```typescript
// OLD handler
const handlePrintContrat = () => {
  const html = generatePersonalizedContent('contrat', data);
  // ...
};

// NEW handler
const handlePrintContrat = async () => {
  try {
    await PrintService.printDocument('contrat', agencyId, data);
  } catch (error) {
    showError(error.message);
  }
};
```

### 3. Test Each File

After removal:
- [ ] No TypeScript errors
- [ ] No runtime errors
- [ ] Print functionality works
- [ ] All 5 document types print correctly

### 4. Verify Complete Removal

```bash
# Should return no results:
grep -r "CONTRAT_TEMPLATE\|DEVIS_TEMPLATE" src/
grep -r "generatePersonalizedContent\|renderContractFields" src/
grep -r "getOrCreateDefaultTemplate\|getDefaultHtml" src/
```

---

## Verification Checklist

After completing all removals:

- [ ] No hardcoded template constants in codebase
- [ ] No document-type-specific rendering methods
- [ ] No getOrCreateDefaultTemplate() calls
- [ ] All print calls use PrintService.printDocument()
- [ ] All imports updated to _v2 versions
- [ ] Database migration applied (has_conditions column added)
- [ ] TemplateSelector component used in UI
- [ ] PrintService works for all 5 document types
- [ ] Error thrown when template not found (not fallback)
- [ ] No TypeScript errors
- [ ] All functionality tested and working

---

## Rollback (if needed)

If migration fails severely:
1. Restore old service files (TemplateService.ts, RenderService.ts, etc.)
2. Restore old component files (old DocumentRenderer, old handlers)
3. Revert database migration (drop has_conditions column)
4. Revert imports in files
5. Note: Phase 2 is BREAKING - full rollback required

---

## Support

If stuck or unsure:
- Reference PHASE2_INTEGRATION_GUIDE.md for examples
- Check Phase 1 code in git history for "how it was done"
- New strict approach: Always call PrintService.printDocument(), not individual methods
- Always ensure templates exist in database before printing

