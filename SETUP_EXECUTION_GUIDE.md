# Contract Personalization - Setup and Execution Guide

## Step 1: Apply the SQL Migration

### In Supabase Dashboard:

1. Open **Supabase Dashboard** → Your Project
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy the entire content from `update_contract_template_comprehensive.sql`
5. Paste into the SQL editor
6. Click **Run** (or Ctrl+Enter)

### Expected Output:

```
-- Should see success message and return one row:
-- id: (your template UUID)
-- agency_id: 7dc45746-14ce-455f-98d4-b292a76f0b75
-- template_type: contrat
-- created_at: 2026-03-20...
```

If you get an error about "duplicate key", it means a template already exists. The SQL automatically deletes old ones, so just run it again.

## Step 2: Verify Code Changes

### Check that PlannerPage.tsx was updated:

1. Open `src/components/PlannerPage.tsx`
2. Search for `showSaveDialog` (should find it in state)
3. Search for `renderField` (should find the helper function)
4. Search for `loadTemplateFromDatabase` (should find the async function)

All these should be present in the PersonalizationModal component.

## Step 3: Test the Interface

### In Your Application:

1. **Navigate to Planner Page**
   - Open the application
   - Go to Planner section
   - Select a reservation

2. **Open Personalization Modal**
   - Click on a reservation
   - Find and click the **"Contrat"** button
   - Modal should open showing all contract fields

3. **Verify Fields Display**
   - Should see:
     - Logo at top (if available)
     - Agency name
     - "Contrat de Location / عقد الإيجار" title
     - All sections: Contract Details, Rental Period, Driver Info, Vehicle Info, Financials, Equipment, Signatures

4. **Test Field Dragging**
   - Click on the "Contrat de Location" title
   - You should see a blue ring highlight
   - Drag it to a new position
   - Release - it should stay in the new position

5. **Test Save Dialog**
   - Click **"💾 Sauvegarder"** button
   - A **card dialog** should appear (not a browser alert)
   - Enter a name like "Standard Template 2026"
   - Click **"Sauvegarder"** in the dialog
   - Should see success message

6. **Test Template Loading**
   - Close the modal
   - Open the personalization modal again
   - You should see a dropdown **"Choisir un modèle"**
   - Click it and select your saved template
   - All field positions should load

7. **Test Print**
   - Click **"🖨️ Imprimer"** button
   - Browser print dialog should open
   - Should show the customized contract layout
   - Click "Print" or "Save as PDF"

## Troubleshooting Guide

### Issue 1: Only Seeing "Contrat de Location / عقد الإيجار"

**Cause**: Template fields not loading from database

**Solutions**:
```sql
-- Check 1: Verify template exists
SELECT id, template_type, created_at 
FROM document_templates 
WHERE template_type = 'contrat' 
LIMIT 1;

-- Check 2: Verify template structure
SELECT template::jsonb->>'title' 
FROM document_templates 
WHERE template_type = 'contrat' 
LIMIT 1;

-- Check 3: Check your agency_id
SELECT agency_id 
FROM profiles 
WHERE id = current_user_id();
```

If no template found:
- Run the SQL migration again
- Make sure to use the correct agency_id

### Issue 2: "Sauvegarder" Click Does Nothing

**Cause**: Dialog not showing

**Solutions**:
1. Check browser console (F12) for errors
2. Verify Supabase connection
3. Look for auth errors in console
4. Check if user is logged in

**Debug in Console**:
```javascript
// In browser console, type:
console.log('Check auth:', await supabase.auth.getUser());
```

### Issue 3: Fields Not Draggable

**Cause**: Mouse event handlers not working

**Solutions**:
1. Verify no console errors
2. Check that `selectedElement` shows as blue ring when clicked
3. Try refreshing the page

**Test Click Handler**:
```javascript
// Fields should show blue ring (#ring-2 ring-blue-500) when clicked
// If not blue ring, mouse event handler isn't firing
```

### Issue 4: Save Button Shows "⏳ Saving..." Forever

**Cause**: Database operation hanging

**Solutions**:
1. Check Supabase status (supabase.com/status)
2. Check RLS policies on document_templates table
3. Verify user has permissions

**Check RLS**:
```sql
SELECT *
FROM pg_policies
WHERE tablename = 'document_templates';
```

### Issue 5: Logo Not Displaying

**Cause**: Logo URL invalid or missing

**Solutions**:
```sql
-- Check website_settings
SELECT name, logo 
FROM website_settings 
LIMIT 1;

-- Update if needed
UPDATE website_settings 
SET logo = 'https://your-logo-url.png' 
WHERE id = (SELECT id FROM website_settings LIMIT 1);
```

Logo should be a full URL to the image file.

## Expected Behavior

### When Opening Personalization Modal:

✅ All contract fields appear with real data
✅ Logo visible at top-left (if configured)
✅ Agency name visible next to logo
✅ Sections properly organized:
   - Contract Details
   - Rental Period
   - Driver Information
   - Vehicle Information
   - Financials
   - Equipment Checklist
   - Signatures

### When Dragging a Field:

✅ Field gets blue ring highlight
✅ Cursor changes to "move" (grabbing hand)
✅ Field follows mouse as you drag
✅ Field stays in new position when released
✅ New position is stored when you save

### When Clicking Save:

✅ Card dialog appears (not browser alert)
✅ Has input field for template name
✅ Has "Save" and "Cancel" buttons
✅ Shows warning if updating existing template
✅ Shows success message after save

### When Selecting a Template:

✅ Dropdown shows available templates
✅ Shows creation date for each template
✅ Current template marked with checkmark
✅ Clicking a template loads it
✅ Field positions change to match template

### When Printing:

✅ Print dialog opens
✅ Shows customized contract layout
✅ All fields in their repositioned locations
✅ Colors and fonts applied
✅ Can print or save as PDF

## Performance Tips

1. **First Load**: Takes ~500ms to load template from database
2. **Dragging**: Smooth - updates immediately on mouse movement
3. **Saving**: Takes ~1-2 seconds (network dependent)
4. **Printing**: Opens in ~1 second

## Browser Console Monitoring

To see what's happening:

1. Open Browser DevTools (F12)
2. Go to **Console** tab
3. Look for these logs when opening modal:

```
"Loaded contract template from database:" {template object}
"Elements loaded from database template:" {elements object}
"All contract templates loaded:" [{...}, {...}]
```

If you see errors, they'll be displayed in red.

## Common Error Messages

### "Error loading template from database:"
- Check Supabase connection
- Verify agency_id is correct
- Check user authentication

### "Error in saveTemplate: ..."
- Check RLS policies
- Verify user has write permissions
- Check for unique constraint violations

### "No template found in database, using defaults"
- This is normal first time
- After saving, this message won't appear next time

## Configuration

### To Change Default Positions:

Edit in `update_contract_template_comprehensive.sql`:

```sql
'title', jsonb_build_object(
  'x', 150,    -- Change this X position
  'y', 120,    -- Change this Y position
  'fontSize', 24,
  ...
)
```

Then re-run the SQL.

### To Change Default Colors:

Edit in the SQL:

```sql
'title', jsonb_build_object(
  ...
  'color', '#000000',        -- Change to any hex color
  'backgroundColor', '#ffffff',  -- Add background color
  ...
)
```

### To Change Default Font Sizes:

Edit in the SQL:

```sql
'title', jsonb_build_object(
  ...
  'fontSize', 24,    -- Change from 24 to any size
  'fontFamily', 'Arial',  -- Or other font
  ...
)
```

## Mobile Considerations

The personalization interface is optimized for desktop:
- Drag-and-drop works on desktop/laptop
- Touch devices: May have limited drag functionality
- Recommend using desktop for template customization

## Multi-Language Support

The interface automatically detects language:
- **French**: Shows "Sauvegarder", "Imprimer", "Annuler"
- **Arabic**: Shows "حفظ", "طباعة", "إلغاء"

Language comes from the app's `lang` prop.

## Advanced: Custom Field Styling

After saving a template, you can further customize it:

1. **In Supabase SQL Editor**:

```sql
UPDATE document_templates 
SET template = jsonb_set(
  template, 
  '{title,color}', 
  '"#FF0000"'  -- Change title to red
)
WHERE id = 'your-template-id';
```

2. **Refresh** the personalization modal to see changes

## Performance Optimization

To speed up template loading:

1. **Indexes already created**: `idx_document_templates_agency_type`
2. **Templates cached in**: React component state
3. **No repeated queries**: Uses useEffect with proper dependencies

## Verification Checklist

Before considering setup complete:

- [ ] SQL migration executed successfully
- [ ] Template visible in database
- [ ] All fields display in personalization modal
- [ ] Logo and agency name visible
- [ ] Can drag fields to new positions
- [ ] Save dialog appears as card (not alert)
- [ ] Template saves successfully to database
- [ ] Template dropdown shows saved templates
- [ ] Can load saved template
- [ ] Print preview shows customized layout
- [ ] No errors in browser console

## Need Help?

Check these in order:

1. **Browser Console** (F12) - Look for red errors
2. **Supabase Logs** - Dashboard → Logs section
3. **SQL Queries** - Run verification queries above
4. **User Auth** - Verify user is logged in with correct agency
5. **Network** - Check internet connection

---

**Setup Time**: ~5 minutes
**Complexity**: Low
**Status**: Ready to Deploy ✅
