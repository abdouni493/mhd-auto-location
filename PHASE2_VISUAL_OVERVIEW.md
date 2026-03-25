# Phase 2 Visual Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Components                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ReservationDetailsView / PlannerPage / etc.             │  │
│  │  - Prepare data object                                  │  │
│  │  - Show TemplateSelector                               │  │
│  │  - Call PrintService.printDocument()                   │  │
│  └────────────────────────┬─────────────────────────────────┘  │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              UNIFIED ENTRY POINT (PrintService_v2)             │
│                                                                 │
│   printDocument(type, agencyId, data, templateId?)            │
│   - Accepts: 'contrat'|'devis'|'facture'|'engagement'|'recu'  │
│   - NO type-specific logic - identical for all                │
└────────┬──────────────────────┬─────────────────────────┬──────┘
         │                      │                         │
         ↓                      ↓                         ↓
    ┌─────────┐         ┌──────────────┐         ┌──────────────┐
    │Template  │         │Conditions    │         │RenderService │
    │Service_v2│         │Service (NEW) │         │_v2            │
    │          │         │              │         │               │
    │• Strict  │         │• Checks      │         │• Replace      │
    │• Throws  │         │  has_conditio│         │  {{placeholds │
    │• DB only │         │• Appends     │         │• Format values│
    │• No     │         │  engagement  │         │• Validate    │
    │  fallback│         │  template    │         │               │
    └────┬─────┘         └──────┬───────┘         └────┬──────────┘
         │                      │                      │
         └──────────────┬───────┴──────────────────────┘
                        │
                        ↓
        ┌───────────────────────────────────┐
        │  Supabase Database                │
        │                                   │
        │  document_templates table:        │
        │  ├─ id                            │
        │  ├─ agency_id                     │
        │  ├─ template_type                 │
        │  ├─ template (JSONB):             │
        │  │  ├─ html: string               │
        │  │  ├─ styles: {...}              │
        │  │  └─ has_conditions: boolean    │
        │  ├─ is_default                    │
        │  ├─ name                          │
        │  └─ created_at                    │
        └───────────────────────────────────┘
```

---

## Data Flow Example: Print Contract

```
1. User clicks "Print Contract" button
   ↓
2. Component shows TemplateSelector
   User chooses template → onSelectTemplate() called
   ↓
3. Component calls PrintService.printDocument()
   await PrintService.printDocument(
     'contrat',           // document type
     'agency-123',        // agency ID
     {                    // data
       client_name: 'John',
       vehicle_brand: 'Toyota'
     },
     'template-id-456'    // selected template
   )
   ↓
4. PrintService_v2 loads template
   TemplateService_v2.getTemplateById('template-id-456')
   ↓
5. PrintService checks for conditions
   ConditionsService.buildCompleteDocument()
   ├─ Renders main template HTML
   │  RenderService_v2.renderTemplate(html, data)
   │  Result: <h1>John</h1><p>Toyota</p>
   │
   └─ If has_conditions = true:
      ├─ Load engagement template
      ├─ Render it with same data
      └─ Append with <hr/> separator
   ↓
6. PrintService opens print window
   ├─ Creates HTML document
   ├─ Injects CSS styles
   ├─ Adds generated date footer
   └─ Triggers browser print dialog
   ↓
7. User sees document ready to print
   Can print to paper or PDF
```

---

## File Organization

```
Your Workspace/
├── src/
│   ├── services/
│   │   ├── TemplateService_v2.ts ......... (NEW) Strict DB access
│   │   ├── RenderService_v2.ts .......... (NEW) {{placeholder}} rendering
│   │   ├── ConditionsService.ts ......... (NEW) Conditions system
│   │   └── PrintService_v2.ts ........... (NEW) Unified print entry
│   │
│   └── components/
│       └── TemplateSelector.tsx ......... (UPDATED) Template selection
│
├── Database/
│   └── add_conditions_feature.sql ....... (NEW) Migration script
│
└── Documentation/
    ├── PHASE2_START_HERE.md ............. 👈 Begin here
    ├── PHASE2_QUICK_REFERENCE.md ........ API cheat sheet
    ├── PHASE2_INTEGRATION_GUIDE.md ...... Step-by-step guide
    ├── PHASE2_REMOVAL_CHECKLIST.md ...... What to delete
    ├── PHASE2_COMPLETE_SUMMARY.md ....... Full details
    ├── PHASE2_DELIVERABLES_MANIFEST.md .. File inventory
    └── PHASE2_IMPLEMENTATION_COMPLETE.md  (This summary)
```

---

## Request Flow Diagram

```
┌────────────────────────┐
│   React Component      │
│  (e.g., Print Button)  │
└───────────┬────────────┘
            │
            │ 1. User selects template
            ↓
┌────────────────────────────────┐
│  TemplateSelector Component    │
│  Shows all templates for type  │
│  User clicks "Print"           │
└───────────┬────────────────────┘
            │
            │ 2. onSelectTemplate(template)
            ↓
┌────────────────────────────────────┐
│ Component calls:                   │
│ PrintService.printDocument(        │
│   type, agencyId, data, templateId │
│ )                                  │
└───────────┬────────────────────────┘
            │
            │ 3. Load template
            ↓
┌────────────────────────────────────┐
│ TemplateService_v2                 │
│ getTemplateById(templateId)         │
│ Returns: DocumentTemplateRow        │
│ (throws if not found - STRICT!)    │
└───────────┬────────────────────────┘
            │
            │ 4. Build complete document
            ↓
┌────────────────────────────────────┐
│ ConditionsService                  │
│ buildCompleteDocument(             │
│   template,                        │
│   data,                            │
│   agencyId                         │
│ )                                  │
│                                    │
│ If has_conditions = true:          │
│  ├─ Load engagement template       │
│  ├─ Render with same data          │
│  └─ Append with <hr/>              │
└───────────┬────────────────────────┘
            │
            │ 5. Render HTML
            ↓
┌────────────────────────────────────┐
│ RenderService_v2                   │
│ renderTemplate(html, data)         │
│                                    │
│ Replaces {{key}} with data[key]   │
│ {{client_name}} → 'John'           │
│ {{vehicle_brand}} → 'Toyota'       │
└───────────┬────────────────────────┘
            │
            │ 6. Final HTML ready
            ↓
┌────────────────────────────────────┐
│ PrintService opens window           │
│ ├─ window.open('', '_blank')       │
│ ├─ write HTML content              │
│ ├─ apply styles (font, size)      │
│ └─ call window.print()             │
└───────────┬────────────────────────┘
            │
            ↓
┌────────────────────────────────────┐
│ Browser Print Dialog               │
│ User can:                          │
│ ├─ Print to paper                  │
│ ├─ Save as PDF                     │
│ └─ Cancel                          │
└────────────────────────────────────┘
```

---

## Service Interaction Diagram

```
PrintService_v2 (Main)
│
├─→ TemplateService_v2
│   • getTemplateById()
│   • getDefaultTemplate() [THROWS if not found]
│   • Strict: No fallback!
│
├─→ ConditionsService
│   • getConditionsTemplate() [THROWS if not found]
│   • appendConditionsIfNeeded()
│   • buildCompleteDocument()
│   │
│   └─→ RenderService_v2
│       • renderTemplate()
│       • formatValue()
│
└─→ RenderService_v2
    • renderTemplate() [Final render]
    • validateData()
    • formatValue()
```

---

## Error Handling Flow

```
PrintService.printDocument()
    │
    ├─ No template found?
    │  └─ ❌ THROW ERROR (strict!)
    │     "No default template found for 'contrat'"
    │
    ├─ has_conditions = true but no engagement template?
    │  └─ ❌ THROW ERROR
    │     "Missing engagement template for conditions"
    │
    ├─ Missing placeholder in data?
    │  └─ ⚠️  Renders as empty string (safe)
    │
    └─ Print window blocked?
       └─ ❌ THROW ERROR
          "Print window blocked. Check popup blocker."

No graceful fallback anywhere! 
Either it works or user gets explicit error.
```

---

## 5 Document Types - Same Code

```
await PrintService.printDocument('contrat', agencyId, data);
await PrintService.printDocument('devis', agencyId, data);
await PrintService.printDocument('facture', agencyId, data);
await PrintService.printDocument('engagement', agencyId, data);
await PrintService.printDocument('recu', agencyId, data);

     ↓↓↓ IDENTICAL CODE ↓↓↓

All use same workflow:
1. Load template from database
2. Render with data
3. Append conditions if needed
4. Open print window

NO TYPE-SPECIFIC BRANCHES!
```

---

## Strict Rules Visualization

```
Phase 1 (Old)                  Phase 2 (New - STRICT)
────────────────              ──────────────────────

Hardcoded HTML            →    Database Templates Only
const TEMPLATE = `...`        await TemplateService.get()

Fallback to Default       →    Fail Explicitly
if (!template) use old        if (!template) throw new Error()

Type-Specific Logic       →    Unified Workflow
if (type='contrat') {...      printDocument(type) {...
else if (type='devis')        // Same for all types

Multiple Methods          →    Single Method
printContrat()               printDocument('contrat')
printDevis()                 printDocument('devis')
printFacture()               printDocument('facture')

Auto-Create Missing       →    Require Database Template
autoCreateDefault()          requiresExisting()

Graceful Degradation      →    Loud Errors
silentlyFallback()           throwExplicitError()
```

---

## Template JSON Structure

```json
{
  "id": "uuid-123",
  "agency_id": "agency-456",
  "template_type": "contrat",
  "name": "Standard Contract - 2024",
  "is_default": true,
  "has_conditions": true,
  "template": {
    "html": "<html>
      <h1>Contract for {{client_name}}</h1>
      <p>Vehicle: {{vehicle_brand}} {{vehicle_model}}</p>
      <p>Rental: {{rental_start}} to {{rental_end}}</p>
      <p>Amount: {{total_price}} €</p>
    </html>",
    "styles": {
      "font": "Arial",
      "fontSize": "12px",
      "lineHeight": "1.6"
    }
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:45:00Z"
}
```

**Key Fields:**
- `html`: Contains {{placeholder}} that get replaced with data
- `has_conditions`: Boolean - if true, engagement template auto-appends
- `is_default`: Boolean - used when no template specified
- `template_type`: One of 5 types (contrat, devis, facture, engagement, recu)

---

## Document Lifecycle

```
1. LOAD TEMPLATE
   ├─ Database: SELECT * FROM document_templates
   ├─ Where: agency_id = ? AND template_type = ?
   ├─ If multiple: Use is_default = true
   └─ If none: THROW ERROR ❌

2. BUILD DOCUMENT
   ├─ Render main template HTML
   ├─ Check: has_conditions = true?
   │  └─ If yes:
   │     ├─ Load engagement template
   │     ├─ Render engagement with same data
   │     └─ Append both with <hr/> separator
   └─ Result: Complete HTML

3. PRINT
   ├─ Open browser print window
   ├─ Inject HTML
   ├─ Apply styles (font, size, etc.)
   └─ Show print dialog

4. USER ACTION
   ├─ Print to paper
   ├─ Save as PDF
   └─ Cancel
```

---

## Success Indicators After Integration

✅ All checks passing?

```typescript
// 1. Database
✓ has_conditions column exists
✓ All 5 types have default templates
✓ Engagement template marked default

// 2. Code
✓ PrintService imported and used
✓ Old hardcoded templates deleted
✓ No type-specific print methods
✓ TemplateSelector component shown

// 3. Functionality
✓ All 5 document types print
✓ Template selector appears
✓ Conditions append correctly
✓ Styles/fonts render properly
✓ {{placeholders}} render with data

// 4. Error Handling
✓ Missing template throws error (not fallback)
✓ Error message helpful and clear
✓ No console errors

// 5. User Experience
✓ User must select template (no auto-select)
✓ Error if required data missing
✓ Print dialog opens correctly
```

---

## Phase 2 at a Glance

```
BEFORE (Phase 1)           AFTER (Phase 2)
────────────────────      ────────────────────

Multiple methods    →      Single method
Type-specific       →      Unified workflow
Hardcoded HTML      →      Database templates
Auto-creates        →      Requires existing
Graceful fallback   →      Explicit errors
No conditions       →      Conditions system
Special logic       →      No special cases
```

---

## Integration Checklist (Visual)

```
Step 1: DATABASE
  ☐ Run migration script
  ☐ Add has_conditions column
  ☐ Verify 5 template types exist

Step 2: COPY FILES
  ☐ TemplateService_v2.ts → src/services/
  ☐ RenderService_v2.ts → src/services/
  ☐ ConditionsService.ts → src/services/
  ☐ PrintService_v2.ts → src/services/
  ☐ TemplateSelector.tsx → src/components/

Step 3: UPDATE IMPORTS
  ☐ Find old TemplateService imports
  ☐ Replace with TemplateService_v2
  ☐ Replace old RenderService with _v2
  ☐ Replace old PrintService with _v2
  ☐ Add ConditionsService imports

Step 4: REPLACE CODE
  ☐ Find all print button handlers
  ☐ Replace with PrintService.printDocument()
  ☐ Remove type-specific methods
  ☐ Add TemplateSelector component

Step 5: REMOVE OLD CODE
  ☐ Delete hardcoded template constants
  ☐ Delete type-specific rendering methods
  ☐ Delete old field positioning code
  ☐ Delete old import statements

Step 6: TEST
  ☐ Print contract (contrat)
  ☐ Print estimate (devis)
  ☐ Print invoice (facture)
  ☐ Print conditions (engagement)
  ☐ Print receipt (recu)
  ☐ Verify errors throw (not fallback)
  ☐ Verify conditions append
```

---

## Phase 2: Complete ✅

All visuals show complete integration flow from UI to database and back to print dialog, with strict enforcement of database-only templates and unified workflow for all document types.

