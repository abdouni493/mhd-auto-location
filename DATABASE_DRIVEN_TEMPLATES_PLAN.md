# Strict Database-Driven Template System Implementation

## Status: IN PROGRESS

### Completed ✅

1. **PrintService.ts (Refactored)** 
   - Replaced entire service with database-driven pipeline
   - `printDocument(data)` - Single unified function
   - Loads templates from database (throws error if not found)
   - Renders with placeholder replacement {{fieldName}}
   - Injects conditions if `has_conditions = true`
   - All documents use identical pipeline
   - NO hardcoded templates

2. **TemplateSelector.tsx (Exists)**
   - Component for users to choose templates
   - Loads from database
   - Shows default first
   - Bilingual (FR/AR)

3. **SaveTemplateModal.tsx (Created)**
   - Component for saving new templates
   - Asks for: name, is_default, has_conditions
   - Auto-unsets other defaults if needed
   - Saves to database
   - Success feedback

### TODO - Remaining Work

#### Phase 1: Remove Hardcoded Templates from PlannerPage

**Files to modify:**
- `src/components/PlannerPage.tsx`

**Functions to remove:**
1. `getInitialElements()` (lines 1205-1412, 207 lines)
   - Returns hardcoded element objects for each document type
   - Used by PersonalizationModal and print dialog
   
2. `generatePersonalizedContent()` (starts at line 1415)
   - Renders hardcoded HTML for print
   - Builds complete document from elements
   - Uses inline HTML generation

**Removal strategy:**
- These functions assume hardcoded structure
- With database templates, we don't need personalization elements
- Instead: Load template from DB → Render placeholders → Print

#### Phase 2: Update PlannerPage Workflow

**Current workflow (WRONG):**
```
User clicks Print
  → getInitialElements() gets hardcoded template
  → PersonalizationModal lets user edit elements
  → generatePersonalizedContent() builds HTML
  → Print window opens
```

**New workflow (CORRECT):**
```
User clicks Print
  → TemplateSelector modal shows available templates
  → User selects template from database
  → PrintService.printDocument() calls:
     - Load template from DB
     - Render with {{placeholders}}
     - Inject conditions if needed
     - Open print window
  → Print
```

**Changes needed in PlannerPage:**
1. Add imports:
   ```tsx
   import { PrintService, PrintData } from '../services/PrintService';
   import { TemplateSelector } from './TemplateSelector';
   import { SaveTemplateModal } from './SaveTemplateModal';
   ```

2. Add state:
   ```tsx
   const [showTemplateSelector, setShowTemplateSelector] = useState(false);
   const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);
   ```

3. Update print button handler:
   ```tsx
   // Old: Opens PersonalizationModal with hardcoded elements
   // New: Opens TemplateSelector, user picks template, then prints
   ```

4. Remove/replace:
   - PersonalizationModal usage for print
   - getInitialElements calls
   - generatePersonalizedContent calls

#### Phase 3: Handle Conditions as Templates

**Current:** Hardcoded conditions modal

**New:** Conditions are also templates with `has_conditions = true`

**Implementation:**
1. Create default "Conditions" template in database
2. When `template.has_conditions = true`:
   - PrintService automatically injects conditions section
   - Look for {{conditions}} placeholder in template HTML
3. ConditionsPersonalizer continues to work (already database-driven)

#### Phase 4: Database Validation

**Check document_templates table:**
- Has correct schema (id, agency_id, template_type, template, is_default, has_conditions, etc.)
- Has RLS policies to restrict by agency
- Has default templates for each document type

**SQL Query to verify:**
```sql
SELECT 
  agency_id,
  template_type,
  COUNT(*) as template_count,
  SUM(CASE WHEN is_default THEN 1 ELSE 0 END) as default_count
FROM document_templates
GROUP BY agency_id, template_type
ORDER BY agency_id, template_type;
```

#### Phase 5: Migration Path

**For existing users:**
1. Run migration to create default templates from old hardcoded versions
2. Prompt to "Migrate Templates" on first print
3. Auto-save their current customizations as new template

---

## Critical Rules - MUST ENFORCE

### Rule 1: No Fallbacks
```tsx
// ❌ WRONG - has fallback to hardcoded
const template = dbTemplate || getHardcodedDefault();

// ✅ CORRECT - throws error
const template = await TemplateService.getDefaultTemplate(type, agencyId);
// If not found → throws error
```

### Rule 2: Single Print Function
```tsx
// ❌ WRONG - multiple print functions
printContractFromTemplate()
printDevisFromTemplate()
printFactureFromTemplate()

// ✅ CORRECT - single function
PrintService.printDocument({
  type: 'contract' | 'devis' | 'facture' | 'invoice' | 'receipt',
  reservation,
  templateId?,
  customConditions?,
  agencyId,
  lang
})
```

### Rule 3: Template Placeholder Format
```tsx
// Template HTML in database uses {{}} format:
<h1>{{label.contract}}</h1>
<p>Client: {{client.fullName}}</p>
<p>Vehicle: {{vehicle.name}}</p>
<p>Total: {{financial.subtotal}} {{financial.currency}}</p>

// PrintService replaces these automatically
```

### Rule 4: Conditions Handling
```tsx
// If template.has_conditions = true:
// 1. PrintService looks for {{conditions}} placeholder
// 2. Replaces with formatted conditions list
// 3. Can be customized by user via ConditionsPersonalizer

// Template must include placeholder:
<section>
  {{conditions}}
</section>
```

### Rule 5: All Documents Identical
```tsx
// Every document type uses SAME pipeline:
// contrat → PrintService.printDocument()
// devis → PrintService.printDocument()
// facture → PrintService.printDocument()
// invoice → PrintService.printDocument()
// receipt → PrintService.printDocument()
// versement → PrintService.printDocument()

// NO document-specific logic
```

---

## Template Placeholders Reference

Available in PrintService.flattenReservationData():

### Reservation
- `{{reservation.id}}`
- `{{reservation.number}}`
- `{{reservation.date}}`

### Client
- `{{client.firstName}}`
- `{{client.lastName}}`
- `{{client.fullName}}`
- `{{client.phone}}`
- `{{client.email}}`
- `{{client.address}}`
- `{{client.documentType}}`
- `{{client.documentNumber}}`

### Vehicle
- `{{vehicle.brand}}`
- `{{vehicle.model}}`
- `{{vehicle.name}}`
- `{{vehicle.registration}}`
- `{{vehicle.vin}}`
- `{{vehicle.color}}`
- `{{vehicle.mileage}}`

### Rental
- `{{rental.startDate}}`
- `{{rental.endDate}}`
- `{{rental.days}}`
- `{{rental.duration}}`

### Financial
- `{{financial.subtotal}}`
- `{{financial.subtotal.number}}`
- `{{financial.advance}}`
- `{{financial.advance.number}}`
- `{{financial.paid}}`
- `{{financial.paid.number}}`
- `{{financial.remaining}}`
- `{{financial.remaining.number}}`
- `{{financial.caution}}`
- `{{financial.caution.number}}`
- `{{financial.currency}}`

### Labels (Bilingual)
- `{{label.client}}`
- `{{label.vehicle}}`
- `{{label.rental}}`
- `{{label.total}}`
- `{{label.paid}}`
- `{{label.remaining}}`
- `{{label.signature}}`
- `{{label.date}}`

---

## Example Template HTML

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial; }
    h1 { color: #1a3a52; text-align: center; }
    .section { margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; }
  </style>
</head>
<body>
  <h1>{{label.contract}}</h1>
  
  <div class="section">
    <h2>{{label.client}}</h2>
    <p><strong>Name:</strong> {{client.fullName}}</p>
    <p><strong>Phone:</strong> {{client.phone}}</p>
    <p><strong>Address:</strong> {{client.address}}</p>
  </div>
  
  <div class="section">
    <h2>{{label.vehicle}}</h2>
    <p><strong>Vehicle:</strong> {{vehicle.name}}</p>
    <p><strong>Registration:</strong> {{vehicle.registration}}</p>
    <p><strong>Mileage:</strong> {{vehicle.mileage}}</p>
  </div>
  
  <div class="section">
    <h2>{{label.rental}}</h2>
    <p><strong>From:</strong> {{rental.startDate}}</p>
    <p><strong>To:</strong> {{rental.endDate}}</p>
    <p><strong>Duration:</strong> {{rental.duration}}</p>
  </div>
  
  <div class="section">
    <h2>{{label.total}}</h2>
    <table>
      <tr>
        <td>Subtotal</td>
        <td>{{financial.subtotal}} {{financial.currency}}</td>
      </tr>
      <tr>
        <td>Paid</td>
        <td>{{financial.paid}} {{financial.currency}}</td>
      </tr>
      <tr>
        <td>Remaining</td>
        <td>{{financial.remaining}} {{financial.currency}}</td>
      </tr>
    </table>
  </div>
  
  <!-- Optional: If template.has_conditions = true -->
  <div class="section">
    {{conditions}}
  </div>
  
  <div class="section">
    <p><strong>{{label.signature}}</strong></p>
    <p>_________________________</p>
  </div>
</body>
</html>
```

---

## Next Immediate Steps

1. **Remove hardcoded functions:**
   - Delete `getInitialElements()` function (207 lines)
   - Delete `generatePersonalizedContent()` function (~600+ lines)
   - Remove usage in PersonalizationModal if needed

2. **Update print workflow:**
   - When user clicks Print → Show TemplateSelector
   - On template selection → Call PrintService.printDocument()
   - PrintService handles everything from DB

3. **Verify database:**
   - Ensure document_templates table exists
   - Add RLS policies
   - Insert default templates for each agency

4. **Test all document types:**
   - Print contract → uses database template
   - Print devis → uses database template
   - Print facture → uses database template
   - etc.

---

## Error Messages - Strict

If something goes wrong:

```
❌ "No default template found for type 'contract' in agency 'xxx'. Please create and set a default template in the database."

❌ "Template with ID 'xxx' not found in database"

❌ "Template 'My Template' is missing HTML content. Please ensure the template has valid HTML."
```

NO fallbacks, NO hardcoded defaults - users MUST create templates first.

---

## Benefits of This System

✅ Fully customizable - users control all template HTML  
✅ Multi-agency support - each agency has own templates  
✅ Database persistence - templates saved between sessions  
✅ Bilingual ready - templates support all languages  
✅ No code changes - add new templates without touching code  
✅ Version control - each template version tracked  
✅ A/B testing - multiple templates per document type  
✅ Professional - fully branded documents  

---

## Architecture Diagram

```
User clicks Print
        ↓
    TemplateSelector
        ↓
    Database: document_templates
        ↓
    PrintService.printDocument()
        ├─ Load template
        ├─ Flatten reservation data
        ├─ Replace {{placeholders}}
        ├─ Inject {{conditions}} if needed
        └─ Open print window
        ↓
    Browser print dialog
        ↓
    PDF/Paper
```

All HARDCODED logic REMOVED. ✅

---

## Status Tracking

- [x] PrintService - Database-driven pipeline
- [x] TemplateSelector - UI component
- [x] SaveTemplateModal - Save component
- [ ] Remove getInitialElements from PlannerPage
- [ ] Remove generatePersonalizedContent from PlannerPage
- [ ] Update PlannerPage print workflow
- [ ] Verify RLS policies
- [ ] Insert default templates
- [ ] Full testing of all document types
