# Document Template Personalization - Quick Start Guide

## What Changed?

The document template system now:
✅ Loads templates **from database** (not hardcoded)
✅ Shows **real data** (client name, car model, dates, prices)
✅ Lets users **save multiple template variations**
✅ Allows **save as new** or **update current** template
✅ Uses **agency logo and name** from settings
✅ Displays **saved templates list** for easy switching

---

## Getting Started

### 1. Insert Initial Templates
Run this SQL to create default templates:

```sql
-- Get your agency ID first
SELECT id FROM public.agencies LIMIT 1;

-- Then replace YOUR_AGENCY_ID and run the SQL from:
-- INSERT_DOCUMENT_TEMPLATES.sql
```

### 2. Open Template Personalisation
- Open a Reservation in BillingPage
- Click **"Personnaliser"** button
- The template editor opens with:
  - Saved templates list on left
  - Document preview in center
  - Field editor on right

### 3. Select a Template
- Click any template name in left sidebar
- Template loads with real data from database
- See actual client name, car model, dates, price

### 4. Customize Fields
- Click a field on the document
- Adjust position with **X/Y sliders**
- Change **color** with color picker
- Change **size** with font size slider
- Drag field directly on document

### 5. Save Your Changes
- Click **Save** button at bottom
- Choose:
  - **"Save as new template"** → Enter name → Save
  - **"Update current template"** → Save
- Template persists in database

---

## Template Interface Overview

### Left Sidebar - Saved Templates
```
📋 Saved Templates
  ├─ Default Contrat Template  [Click to Load]
  ├─ Professional Variant       [Click to Load]
  └─ Custom 2024 Template       [Click to Load] [Delete]
```

### Center - Document Preview
- Shows actual document layout
- Displays real client/car/reservation data
- Drag fields to reposition
- Click field to edit styling

### Right Sidebar - Field Editor
When you select a field:
```
Position X: [====□====] 80px
Position Y: [====□====] 140px

Color: [■] #000000
       [Text input field]

Size: [====□====] 12px

[Delete Field]
```

---

## Example Workflow

### Scenario: Create "Luxury Contract" Template

```
1. Click "Personnaliser" on a reservation
   → Editor opens
   → Default Contrat template loads

2. Click template name in left sidebar
   → Loads current template

3. Customize styling:
   ├─ Click "title" field
   │  └─ Change color to blue (#0066cc)
   │  └─ Increase size to 28px
   ├─ Click "price_total" field
   │  └─ Change color to gold (#FFD700)
   │  └─ Increase size to 16px
   └─ Drag fields to ideal positions

4. Preview shows changes in real-time
   ├─ Title: "CONTRAT DE LOCATION" in blue
   ├─ Price: "150,000 DA" in gold
   └─ All fields with actual data

5. Click Save button
   → Save dialog appears
   
6. Choose "Save as new template"
   → Enter name: "Luxury Contract"
   → Click Save

7. Template saved to database
   → Next time, visible in left sidebar
   → Can load anytime
   → Can print with this layout
```

---

## Data Sources

When you open the editor with a reservation, these are loaded automatically:

| What | From | Example |
|------|------|---------|
| Client Name | `clients` table | "Ahmed Boudjellal" |
| Client Phone | `clients` table | "+213 XXX XXX XXX" |
| Car Brand/Model | `cars` table | "Toyota Camry" |
| Car Year | `cars` table | "2023" |
| Car Color | `cars` table | "Silver" |
| Departure Date | `reservations` table | "15 Mars 2026" |
| Return Date | `reservations` table | "22 Mars 2026" |
| Total Price | `reservations` table | "150,000 DA" |
| Agency Name | `agency_settings` table | "LuxDrive Premium" |
| Agency Logo | `agency_settings` table | `[Image from storage]` |

---

## SQL Commands

### See all saved templates
```sql
SELECT id, name, template_type, created_at
FROM public.document_templates
WHERE template_type = 'contrat'
ORDER BY created_at DESC;
```

### Count templates by agency
```sql
SELECT agency_id, COUNT(*) as total_templates
FROM public.document_templates
WHERE template_type = 'contrat'
GROUP BY agency_id;
```

### Backup a template
```sql
SELECT template
FROM public.document_templates
WHERE id = 'TEMPLATE_ID'
AND template_type = 'contrat';
```

### Delete all templates (use with caution)
```sql
DELETE FROM public.document_templates
WHERE template_type = 'contrat'
AND agency_id = 'YOUR_AGENCY_ID';
```

---

## Common Tasks

### How to create a new template from scratch?
1. Load any existing template
2. Make changes
3. Click Save
4. Choose "Save as new template"
5. Enter unique name
6. Click Save

### How to duplicate a template?
1. Load the template you want to copy
2. Make a small change (or no change)
3. Click Save
4. Choose "Save as new template"
5. Enter new name like "Original Copy"

### How to undo changes?
1. Don't save - just click Cancel
2. Changes are only saved when you click Save

### How to restore a template?
1. Click Reset button at bottom left
2. Confirm the reset
3. Template reverts to default positions

### How to use a template for printing?
1. Select the template
2. Customize with real data (auto-populated)
3. Click Save
4. Click Print button in document renderer
5. Document prints with your custom layout

---

## Troubleshooting

### Templates don't appear in sidebar
- ✓ Check agency_id is set in user profile
- ✓ Verify templates exist in database
- ✓ Check browser console for errors

### Real data doesn't show
- ✓ Verify reservation has client and car assigned
- ✓ Check that client/car records exist
- ✓ Refresh page

### Can't save template
- ✓ Enter template name if saving as new
- ✓ Check database permissions
- ✓ Look for error message in dialog

### Logo doesn't show
- ✓ Verify logo URL is correct in agency_settings
- ✓ Check image file is accessible
- ✓ Try different image format

### Changes not persisting
- ✓ Make sure to click Save, not Cancel
- ✓ Check save confirmation in dialog
- ✓ Refresh page to verify

---

## Browser DevTools Debugging

Open DevTools Console (F12) and look for:

```javascript
// Successful template load
console.log('All data loaded:', { templates: [...], realData: {...} })

// Template save
console.log('Template saved:', newTemplate)

// Errors
console.error('Error loading templates:', error)
console.error('Error saving template:', error)
```

---

## Performance Tips

1. **Don't create too many templates** - Keep 5-10 per agency
2. **Delete unused templates** - Reduces sidebar clutter
3. **Reuse templates** - Duplicate instead of creating new
4. **Close editor after saving** - Frees up resources

---

## Best Practices

1. ✅ Name templates descriptively
   - "Professional Legal" vs "Template 1"

2. ✅ Create variations for different scenarios
   - "Standard Contract"
   - "Luxury Contract"
   - "Long-term Rental"

3. ✅ Test on actual data
   - Load a real reservation
   - Verify data appears correctly
   - Print preview before actual print

4. ✅ Keep backup of important templates
   - Export template JSON
   - Store in separate document

5. ✅ Update regularly
   - Keep logo current
   - Update company info
   - Adjust formatting as needed

---

## File Structure

```
src/
  components/
    DocumentTemplateEditor.tsx          ← Main editor component
    BillingPage.tsx                      ← Calls editor
    DocumentRenderer.tsx                 ← Displays templates
  services/
    DocumentTemplateService.ts           ← Database operations
  types/
    index.ts                              ← Interfaces

Database/
  document_templates table               ← Stores templates
  agencies table                         ← Stores agency info
  agency_settings table                  ← Logo and name

SQL/
  INSERT_DOCUMENT_TEMPLATES.sql          ← Initial templates
```

---

## Support & Resources

- **Full Documentation**: See `DOCUMENT_TEMPLATE_DATABASE_GUIDE.md`
- **SQL Examples**: See `INSERT_DOCUMENT_TEMPLATES.sql`
- **TypeScript Interfaces**: See `src/types/index.ts`

---

## Summary

The new document template system is **database-driven**, **user-friendly**, and **powerful**:

| Feature | Before | After |
|---------|--------|-------|
| Data Source | Hardcoded mock data | Real database |
| Multiple Templates | ❌ No | ✅ Yes |
| Save Options | ❌ Limited | ✅ Update or New |
| Real Data | ❌ Fake examples | ✅ Actual values |
| Template Deletion | ❌ No | ✅ Yes |
| Logo Display | ❌ No | ✅ From settings |
| Agency Name | ❌ Generic | ✅ Your actual name |

**Start using it today!**
