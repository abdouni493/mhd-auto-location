# Phase 2: Quick Reference Card

## One-Page Summary for Developers

### Core Concept
**STRICT database-only printing system** - All documents use identical workflow, fail loudly on errors, no hardcoded templates.

---

## The Four Services

### 1️⃣ TemplateService_v2
```typescript
const template = await TemplateService.getDefaultTemplate('contrat', agencyId);
// Throws if template not found ⚠️

const templates = await TemplateService.getTemplatesByType('devis', agencyId);
// Throws if no templates exist

await TemplateService.saveTemplate(type, agencyId, name, {html, styles}, isDefault, hasConditions);
```

### 2️⃣ RenderService_v2
```typescript
const html = RenderService.renderTemplate(template.html, {
  client_name: 'John Doe',
  vehicle_brand: 'Toyota'
});
// Replaces {{client_name}} with 'John Doe', etc.

const validation = RenderService.validateData(html, data);
// { valid: true, missing: [] }
```

### 3️⃣ ConditionsService (NEW)
```typescript
const finalHtml = await ConditionsService.buildCompleteDocument(
  template,    // has has_conditions property
  data,
  agencyId
);
// If template.has_conditions = true:
//   - Loads engagement template
//   - Renders with same data
//   - Appends with <hr/> separator
// Throws if engagement template missing ⚠️
```

### 4️⃣ PrintService_v2 (Unified Entry Point)
```typescript
// This ONE method works for ALL 5 document types
await PrintService.printDocument(
  'contrat',           // or devis, facture, engagement, recu
  agencyId,
  { client_name: '...', vehicle_brand: '...', ... },
  selectedTemplateId?  // optional: use specific template
);

// That's it! Same pattern for all types.
```

---

## The Component

### TemplateSelector
```typescript
<TemplateSelector
  documentType="contrat"
  agencyId={agencyId}
  onSelectTemplate={async (template) => {
    await PrintService.printDocument('contrat', agencyId, data, template.id);
  }}
  onCancel={() => setShowSelector(false)}
/>
```

---

## The 5 Rules (STRICT Enforcement)

| Rule | Do ✅ | Don't ❌ |
|------|------|---------|
| **Database** | Fetch from DB | Hardcode HTML |
| **Errors** | Throw error | Use fallback |
| **Logic** | Same for all types | Type-specific branches |
| **Service** | Single printDocument() | printContrat(), printDevis(), ... |
| **Selection** | User chooses | Auto-select default |

---

## Common Patterns

### Print a Document (All Types)
```typescript
try {
  const data = {
    client_name: reservation.client.name,
    vehicle_brand: reservation.vehicle.brand,
    rental_start: reservation.startDate.toLocaleDateString('fr-FR'),
    rental_end: reservation.endDate.toLocaleDateString('fr-FR'),
    total_price: reservation.totalPrice.toFixed(2),
    // ... all template placeholders
  };

  await PrintService.printDocument('contrat', agencyId, data);
} catch (error) {
  showError(`Print failed: ${error.message}`);
  // Common: "No default template found for 'contrat'"
}
```

### With Template Selection
```typescript
const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplateRow | null>(null);

// Show selector
setShowTemplateSelector(true);

// After selection
await PrintService.printDocument('facture', agencyId, data, selectedTemplate.id);
```

---

## Database Setup

```sql
-- Must have has_conditions column
ALTER TABLE document_templates
ADD COLUMN has_conditions BOOLEAN DEFAULT false;

-- Each type needs default template
SELECT template_type, COUNT(*) FROM document_templates 
WHERE is_default = true GROUP BY template_type;
-- Should return 5 rows: contrat, devis, facture, engagement, recu

-- If has_conditions=true, engagement must exist
SELECT * FROM document_templates 
WHERE template_type = 'engagement' AND is_default = true;
```

---

## Template JSON Format

```json
{
  "html": "<h1>{{client_name}}</h1><p>Vehicle: {{vehicle_brand}}</p>",
  "styles": {
    "font": "Arial",
    "fontSize": "12px"
  },
  "has_conditions": false
}
```

Placeholders: `{{key}}` or `{{nested.key}}`  
Safe: Missing keys render as empty string  

---

## Error Messages → Solutions

| Error | Fix |
|-------|-----|
| `No default template found for 'contrat'` | Create template with is_default=true |
| `No templates found for 'devis'` | Create at least one template of this type |
| `Template not found: xxx-id` | Check template ID exists in DB |
| `Missing engagement template for conditions` | Create engagement template with is_default=true |
| `Print window blocked` | Allow popups in browser |

---

## Removal Checklist (Old Code)

Delete from codebase:
- ❌ `generatePersonalizedContent()` 
- ❌ `renderContractFields()`, `renderEstimateFields()`, etc.
- ❌ `CONTRAT_TEMPLATE`, `DEVIS_TEMPLATE` constants
- ❌ `getOrCreateDefaultTemplate()`, `getDefaultHtml()`
- ❌ `handlePrintContrat()`, `handlePrintDevis()` (replace with unified handler)
- ❌ All hardcoded field positioning

---

## File Locations

| File | Purpose |
|------|---------|
| `TemplateService_v2.ts` | Fetch templates, strict DB access |
| `RenderService_v2.ts` | {{placeholder}} replacement |
| `ConditionsService.ts` | Append engagement template |
| `PrintService_v2.ts` | Unified entry point (use this!) |
| `TemplateSelector.tsx` | Reusable component for template selection |

---

## Imports

```typescript
import { TemplateService } from './services/TemplateService_v2';
import { RenderService } from './services/RenderService_v2';
import { ConditionsService } from './services/ConditionsService';
import { PrintService } from './services/PrintService_v2';
import { TemplateSelector, DocumentTemplateRow } from './components/TemplateSelector';
import type { DocumentType } from './types';
```

---

## Document Types (All Identical)

```typescript
type DocumentType = 'contrat' | 'devis' | 'facture' | 'engagement' | 'recu';

// Same method signature for all:
await PrintService.printDocument(type, agencyId, data);
```

---

## Key Differences from Phase 1

| Phase 1 | Phase 2 |
|---------|---------|
| Fallback to defaults | Throw error if missing |
| Type-specific methods | Single unified method |
| Auto-create templates | Fail if not found |
| Graceful degradation | Explicit errors |
| Multiple hard-coded templates | Database only |
| Optional user selection | Required selection |
| Type-specific rendering | Identical workflow |
| `getDefaultHtml()` exists | Removed entirely |

---

## Testing (Quick)

```typescript
// All types should work identically
await PrintService.printDocument('contrat', agencyId, testData);
await PrintService.printDocument('devis', agencyId, testData);
await PrintService.printDocument('facture', agencyId, testData);
await PrintService.printDocument('engagement', agencyId, testData);
await PrintService.printDocument('recu', agencyId, testData);

// Should throw for missing template
try {
  await PrintService.printDocument('contrat', 'invalid-agency', testData);
} catch (e) {
  console.log('Expected error:', e.message);
  // "No default template found for 'contrat'"
}
```

---

## Remember

1. **ONE method to print everything:** `PrintService.printDocument()`
2. **Fail loudly:** Errors mean template missing, not graceful fallback
3. **Identical for all types:** No special case logic anywhere
4. **Database only:** No hardcoded HTML constants allowed
5. **User chooses:** Always show TemplateSelector, require selection

---

## Support

- PHASE2_INTEGRATION_GUIDE.md - Full reference with examples
- PHASE2_REMOVAL_CHECKLIST.md - What to delete from old code
- PHASE2_COMPLETE_SUMMARY.md - Architecture and details

