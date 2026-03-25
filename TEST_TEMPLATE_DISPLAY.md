# Template Display Testing Guide

## Issue Fixed
The DocumentRenderer for 'contrat' type was using hardcoded layout instead of loading templates from the database. This has been fixed.

## What Was Changed

### 1. DocumentTemplateService.ts
Updated `getDocumentTemplate()` method to:
- Load saved templates from the `document_templates` table
- Accept agencyId parameter for agency-specific templates
- Fall back to defaults if no saved template exists
- First checks database, then uses defaults

```typescript
static async getDocumentTemplate(documentType: DocumentType, agencyId?: string): Promise<DocumentTemplate>
```

### 2. DocumentRenderer.tsx
- Now loads agency ID from user profile
- Passes agencyId to `getDocumentTemplate()`
- For 'contrat' type: Renders template dynamically using database fields instead of hardcoded layout
- Fields are positioned and styled according to template data

### 3. DocumentTemplateEditor.tsx
- Already correctly loading templates from `document_templates` table
- Using real data from clients, cars, reservations, inspections

## How to Test

### Step 1: Verify You Have Templates in Database
Run this SQL query in Supabase:

```sql
SELECT id, agency_id, template_type, created_at, updated_at 
FROM public.document_templates 
WHERE template_type = 'contrat'
ORDER BY created_at DESC;
```

Expected result: You should see at least one template for your agency_id.

### Step 2: Test DocumentRenderer Display
1. Navigate to Billing Page
2. Click on an invoice to view it
3. The contrat should display with fields positioned according to your database template
4. Check browser console for logs: "Loaded saved template for contrat from database"

### Step 3: Test Field Customization
1. Click "Edit Template" button on the rendered document
2. DocumentTemplateEditor should load your saved template
3. Modify field positions (drag them)
4. Change colors, sizes
5. Click "Save Changes"
6. Go back to document view - changes should be applied

### Step 4: Verify Field Values Are Populated
Fields should display real data:
- `client_name` → Client name from reservation
- `car_model` → Car model from vehicle
- `rental_dates` → Rental period from reservation
- `price_total` → Total amount
- `title` → "Contrat de Location"

## Database Schema

Template data is stored as JSONB:

```typescript
interface DocumentTemplate {
  [fieldName: string]: {
    x: number;              // X position in pixels
    y: number;              // Y position in pixels
    color?: string;         // Hex color
    fontSize?: number;      // Font size in pixels
    fontFamily?: string;    // Font name
    fontWeight?: string;    // 'normal' or 'bold'
    fontStyle?: string;     // 'normal' or 'italic'
    textDecoration?: string;
    textAlign?: string;
    backgroundColor?: string;
    maxWidth?: number;
    customText?: string;    // For custom fields
  }
}
```

## Troubleshooting

### Template Not Loading from Database
1. Check browser console for errors
2. Verify agency_id is correct:
   ```sql
   SELECT agency_id FROM profiles WHERE id = 'YOUR_USER_ID';
   ```
3. Check that document_templates table exists:
   ```sql
   \dt public.document_templates
   ```

### Fields Not Displaying
1. Verify template structure is valid JSON
2. Check that field names match expected field names in DocumentRenderer.tsx
3. Ensure coordinates (x, y) are reasonable numbers (0-1000)

### Template Updates Not Showing
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check database to confirm update was saved

## Files Modified

1. **src/services/DocumentTemplateService.ts**
   - Updated `getDocumentTemplate()` method

2. **src/components/DocumentRenderer.tsx**
   - Modified `loadAllData()` to get agencyId
   - Replaced hardcoded contrat render with template-driven render
   - Template fields now rendered dynamically from database

3. **src/components/DocumentTemplateEditor.tsx**
   - No changes needed (already working correctly)

## Testing Checklist

- [ ] Templates load from database without errors
- [ ] Fields display with correct positions
- [ ] Field values show real data (client, car, reservation info)
- [ ] Edit template button opens editor
- [ ] Customizations from editor apply to display
- [ ] Print preview shows correct layout
- [ ] Document can be printed with saved template layout
- [ ] Multiple templates can be saved (if unique constraint removed)
- [ ] Template sidebar shows all saved templates
- [ ] Delete template removes it from list

## Sample Template JSON (for manual testing)

If you need to create a template manually:

```json
{
  "title": {
    "x": 120,
    "y": 40,
    "color": "#000000",
    "fontSize": 24,
    "fontFamily": "Arial",
    "fontWeight": "bold",
    "textAlign": "center"
  },
  "client_name": {
    "x": 80,
    "y": 140,
    "color": "#000000",
    "fontSize": 12,
    "fontFamily": "Arial",
    "textAlign": "left"
  },
  "car_model": {
    "x": 80,
    "y": 180,
    "color": "#000000",
    "fontSize": 12,
    "fontFamily": "Arial",
    "textAlign": "left"
  },
  "price_total": {
    "x": 80,
    "y": 260,
    "color": "#000000",
    "fontSize": 14,
    "fontFamily": "Arial",
    "fontWeight": "bold"
  }
}
```

## Next Steps

1. Drop the unique index constraint (if not already done):
   ```sql
   DROP INDEX public.document_templates_unique_per_agency_type;
   ```

2. Insert your two template variations:
   ```sql
   INSERT INTO public.document_templates (...)
   -- See INSERT_DOCUMENT_TEMPLATES.sql for full template data
   ```

3. Test the system following the steps above

4. Verify all document types display correctly (contrat, devis, facture, recu, engagement)
