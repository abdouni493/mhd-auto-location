# Document Template System - Database-Driven Architecture

## Overview

The document template system has been completely redesigned to load templates from the Supabase `document_templates` table instead of using hardcoded mock data. Users can now:

1. **Load Multiple Saved Templates** - View all templates saved for the `contrat` document type in your agency
2. **Select & Edit Templates** - Choose a template from the database and customize it
3. **Save Modifications** - Choose to update the current template or save as a new template
4. **Use Real Data** - Display actual client, car, and reservation data in the preview
5. **Delete Templates** - Remove templates you no longer need
6. **Print with Personalization** - Print contracts with the exact layout and data you've customized

---

## Key Features

### 1. **Database-Driven Templates**
Templates are stored in the `document_templates` table:
```sql
CREATE TABLE public.document_templates (
  id uuid PRIMARY KEY,
  agency_id uuid NOT NULL,
  template_type text NOT NULL, -- 'contrat', 'devis', 'facture', etc.
  template jsonb NOT NULL,     -- Field positions and styling
  name text,                    -- User-defined template name
  created_at timestamp,
  updated_at timestamp
);
```

### 2. **Real Data Integration**
The template editor automatically loads:
- **Client Info**: First name, last name, phone, email
- **Car Info**: Brand, model, year, color
- **Reservation Info**: Departure/return dates, total price
- **Inspection Info**: Mileage, fuel level
- **Agency Info**: Agency name and logo from `agency_settings`

### 3. **Smart Save Dialog**
When users click "Save":
- **Option 1**: Save as a new template with a custom name
- **Option 2**: Update the currently selected template (if one is loaded)
- Both options persist to the database immediately

### 4. **Template Selection Interface**
Left sidebar shows:
- List of all saved templates for the current document type
- Click to select and load a template
- Delete button appears when a template is selected
- Shows template name and creation date

---

## Component Architecture

### DocumentTemplateEditor.tsx
**Main component** that manages:
- Loading templates from database
- Displaying saved templates list
- Managing field positioning and styling
- Real data integration
- Save dialog logic

**Key State Variables**:
```typescript
- template: DocumentTemplate | null          // Currently editing
- savedTemplates: SavedDocumentTemplate[]     // All DB templates
- currentTemplateId: string | null            // Which template is selected
- realData: RealData                          // Actual client/car/reservation data
- saveDialog: SaveDialogState                 // Save confirmation modal
```

**Key Functions**:
```typescript
loadAllData()                    // Load templates and real data
loadRealData()                   // Fetch client/car/reservation info
buildPreviewData()               // Build field content from real data
handleSelectTemplate()           // Load a saved template
handleSave()                     // Show save dialog
handleConfirmSave()              // Persist to database
handleDeleteTemplate()           // Remove a template
```

### DocumentTemplateService.ts
**Enhanced service class** with new methods:

```typescript
// Load all saved templates for a document type
getSavedTemplates(documentType, agencyId): Promise<SavedDocumentTemplate[]>

// Save a new template
saveTemplate(documentType, template, agencyId, name): Promise<SavedDocumentTemplate>

// Update an existing template
updateSavedTemplate(templateId, template, name): Promise<SavedDocumentTemplate>

// Delete a template
deleteTemplate(templateId): Promise<void>

// Get template by ID
getTemplateById(templateId): Promise<SavedDocumentTemplate | null>
```

### BillingPage.tsx
**Updated to pass** real data IDs to DocumentTemplateEditor:
```typescript
<DocumentTemplateEditor
  documentType={editingDocumentType}
  reservationId={selectedInvoice?.reservationId}
  carId={selectedInvoice?.carId}
  clientId={selectedInvoice?.clientId}
  inspectionId={selectedInvoice?.inspectionId}
  onClose={...}
  onSave={...}
/>
```

---

## User Workflow

### 1. Opening the Template Editor
```
BillingPage → Click "Personnaliser" (Personalize)
→ DocumentTemplateEditor opens
→ Loads saved templates from database
→ Loads real data (client, car, reservation)
```

### 2. Loading a Template
```
Left Sidebar → Click on template name
→ Template loaded into editor
→ Real data displayed in preview
→ Ready to customize
```

### 3. Customizing Fields
```
Canvas → Click on field
→ Field selector appears in right panel
→ Adjust position (X, Y) with sliders
→ Change color with color picker
→ Adjust font size
→ See changes in real-time
```

### 4. Saving Changes
```
Bottom "Save" button → Show save dialog
│
├─ Option 1: Save as New
│  └─ Enter template name → Click Save → New template created in DB
│
└─ Option 2: Update Current
   └─ Click Save → Current template updated in DB
```

### 5. Deleting a Template
```
Left Sidebar → Select template
→ "Delete" button appears
→ Confirm deletion
→ Template removed from database
```

---

## Data Structures

### SavedDocumentTemplate Interface
```typescript
interface SavedDocumentTemplate {
  id: string;                    // UUID from database
  agency_id: string;             // Which agency owns this template
  template_type: DocumentType;   // 'contrat', 'devis', etc.
  template: DocumentTemplate;    // Field positioning and styling
  name?: string;                 // User-friendly name
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
}
```

### RealData Interface
```typescript
interface RealData {
  client?: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  };
  car?: {
    brand: string;
    model: string;
    year: number;
    color: string;
  };
  reservation?: {
    departure_date: string;
    return_date: string;
    total_price: number;
  };
  inspection?: {
    mileage: number;
    fuel_level: string;
  };
  agencySettings?: {
    agency_name: string;
    logo: string;
    phone: string;
    address: string;
  };
}
```

---

## Database Operations

### Insert a New Template
```sql
INSERT INTO public.document_templates (
  id,
  agency_id,
  template_type,
  template,
  name,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'YOUR_AGENCY_ID',
  'contrat',
  '{...}'::jsonb,  -- Field positioning JSON
  'My Custom Template',
  now(),
  now()
);
```

### Query Saved Templates
```sql
SELECT * FROM public.document_templates
WHERE agency_id = 'YOUR_AGENCY_ID'
  AND template_type = 'contrat'
ORDER BY created_at DESC;
```

### Update a Template
```sql
UPDATE public.document_templates
SET template = '{...}'::jsonb,
    updated_at = now()
WHERE id = 'TEMPLATE_ID'
  AND template_type = 'contrat';
```

### Delete a Template
```sql
DELETE FROM public.document_templates
WHERE id = 'TEMPLATE_ID'
  AND template_type = 'contrat';
```

---

## Implementation Steps

### Step 1: Insert Initial Templates
Run the SQL code in `INSERT_DOCUMENT_TEMPLATES.sql` to create initial templates for your agency:
```sql
-- First get your agency ID
SELECT id FROM public.agencies LIMIT 1;

-- Then replace YOUR_AGENCY_ID in the INSERT statements
-- Run the insert commands
```

### Step 2: Verify Database Tables
Ensure the `document_templates` table exists:
```sql
SELECT * FROM public.document_templates LIMIT 1;
```

### Step 3: Test the Interface
1. Open BillingPage
2. Click "Personnaliser" on any reservation
3. Verify saved templates load in left sidebar
4. Select a template and verify real data appears
5. Make a change and save

### Step 4: Monitor Console Logs
The component logs important events:
```javascript
console.log('Error loading data:', error);      // Data loading issues
console.log('Error saving template:', error);   // Save failures
```

---

## Field Preview Data

The preview automatically builds content from real data:

| Field Name | Source | Example |
|-----------|--------|---------|
| `client_name` | clients table | "Ahmed Boudjellal" |
| `car_model` | cars table | "Toyota Camry 2023 - Silver" |
| `rental_dates` | reservations table | "15 Mars 2026 - 22 Mars 2026" |
| `price_total` | reservations.total_price | "150,000 DA" |
| `agenceName` | agency_settings.agency_name | "LuxDrive Premium" |

If a field doesn't have real data, it displays `[fieldName]` placeholder.

---

## Error Handling

### Template Not Loading
- Check that `agency_id` is correctly retrieved from `profiles` table
- Verify user has an agency assigned
- Check browser console for detailed error messages

### Save Failures
- Verify `document_templates` table permissions
- Ensure `agency_id` in INSERT statement matches user's agency
- Check for duplicate template names in save dialog

### Real Data Not Appearing
- Verify `reservationId`, `carId`, `clientId` are passed correctly
- Check that records exist in respective database tables
- Verify user has read permissions on those tables

---

## Configuration

### To Change Template Type
Currently the system loads **contrat** templates only:
```typescript
// In loadAllData():
if (documentType === 'contrat') {
  const templates = await DocumentTemplateService.getSavedTemplates(documentType, currentAgencyId);
  // ...
}
```

To enable other types, remove this condition:
```typescript
// For all types:
const templates = await DocumentTemplateService.getSavedTemplates(documentType, currentAgencyId);
```

### To Add More Template Fields
1. Add field name to `DEFAULT_FIELD_NAMES`
2. Add data source in `buildPreviewData()` function
3. Add to `INSERT_DOCUMENT_TEMPLATES.sql` template JSON

---

## Testing Checklist

- [ ] Can open template editor from BillingPage
- [ ] Saved templates appear in left sidebar
- [ ] Can click to select a template
- [ ] Real client data appears in preview
- [ ] Real car data appears in preview
- [ ] Real reservation data appears in preview
- [ ] Can drag fields to new positions
- [ ] Can change field colors and sizes
- [ ] Save dialog shows when clicking Save
- [ ] Can save as new template with custom name
- [ ] Can update existing template
- [ ] Updated template persists after page reload
- [ ] Can delete a template
- [ ] Can reset to default template
- [ ] Logo from agency_settings displays correctly
- [ ] Agency name displays in header

---

## Security Considerations

1. **Row Level Security**: Templates are filtered by `agency_id`
2. **User Authentication**: Only authenticated users can access templates
3. **Agency Isolation**: Users only see templates from their assigned agency
4. **Database Permissions**: Ensure RLS policies are in place on `document_templates` table

---

## Performance Notes

- Templates are loaded on component mount
- Real data is queried in parallel for faster loading
- Template list is limited to one document type to reduce payload
- Saved templates are sorted by `created_at DESC` to show newest first

---

## Related Files

- `src/components/DocumentTemplateEditor.tsx` - Main editor component
- `src/services/DocumentTemplateService.ts` - Database service class
- `src/components/BillingPage.tsx` - Parent component that calls editor
- `INSERT_DOCUMENT_TEMPLATES.sql` - SQL to create initial templates
- `src/types/index.ts` - TypeScript interfaces

---

## Future Enhancements

1. **Template Categories** - Organize templates by custom tags
2. **Template Cloning** - Duplicate existing templates
3. **Version History** - Track template changes over time
4. **Import/Export** - Share templates between agencies
5. **Template Preview PDF** - Generate PDF before printing
6. **Batch Apply** - Apply template to multiple documents
7. **Template Lock** - Prevent accidental modifications
8. **Collaborative Editing** - Multiple users editing same template
