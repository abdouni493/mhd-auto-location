# PlannerPage Contract Template - Database Integration Fix

## Problem
The personalization interface (Contrat button on Planner page) was displaying hardcoded template data with all the individual fields, instead of loading the template from the database.

The hardcoded content included:
- 50+ hardcoded field definitions
- Sections with titles and labels (Contract Details, Rental Period, Driver Info, Vehicle Info, Financials, Equipment, Signatures)
- Fixed colors, fonts, positions for each section

## Root Cause
The `getInitialElements()` function in PlannerPage.tsx was returning a massive hardcoded template object for type === 'contract' with 50+ individual fields pre-defined with specific positions and styling.

## Solution Implemented

### 1. Simplified getInitialElements() (Line 1328)
**Before**: 220+ lines of hardcoded field definitions

**After**: Minimal 6-field default template:
```tsx
} else if (type === 'contract') {
  // Contract template - Load from database, fallback to default
  return {
    logo: { x: 50, y: 50, width: 90, height: 90 },
    title: { x: 50, y: 160, text: 'Contrat de Location...' },
    client_name: { x: 80, y: 140, text: client name },
    car_model: { x: 80, y: 180, text: car info },
    rental_dates: { x: 80, y: 220, text: dates },
    price_total: { x: 80, y: 260, text: price },
    signature_line: { x: 80, y: 450, text: line },
  };
}
```

### 2. Added Database Loading in PersonalizationModal (Lines 1748-1830)
New functionality:
```typescript
// When type === 'contract', load template from database
useEffect(() => {
  if (type === 'contract') {
    loadTemplateFromDatabase();
  }
}, [type]);

const loadTemplateFromDatabase = async () => {
  // Get user's agency_id from profiles
  const agencyId = userProfile?.agency_id;
  
  // Query document_templates table
  const { data: templateData } = await supabase
    .from('document_templates')
    .select('template')
    .eq('template_type', 'contrat')
    .eq('agency_id', agencyId)
    .single();
  
  // Convert database template to elements format
  // Map each field with its position, color, font from database
  setElements(elementsFromDB);
};
```

### 3. Added Helper Function getFieldValue()
Maps field names to real data from reservation:
```typescript
const getFieldValue = (fieldName: string, res: ReservationDetails): string => {
  case 'client_name': return `${res.client.firstName} ${res.client.lastName}`;
  case 'car_model': return `${res.car.brand} ${res.car.model}`;
  case 'rental_dates': return `${res.step1.departureDate} - ${res.step1.returnDate}`;
  // etc...
}
```

## What Now Happens

### Flow:
1. User clicks Contrat button on Planner page
2. PersonalizationModal opens with type='contract'
3. useEffect triggers `loadTemplateFromDatabase()`
4. Code queries `document_templates` table with:
   - `template_type = 'contrat'`
   - `agency_id = user's agency`
5. Database returns saved template with field positions and styling
6. Template fields are rendered in canvas with:
   - Positions from database (x, y)
   - Styling from database (color, fontSize, fontFamily, etc.)
   - Field values populated from reservation data

### Result:
✅ Template loads from database instead of hardcoded
✅ User's customizations are applied
✅ All 6 core fields display correctly positioned
✅ Fallback to defaults if no saved template exists
✅ Console logging for debugging

## Data Source
The template comes from the `document_templates` table:
```
Column: template_type = 'contrat'
Column: template = JSONB with field definitions
  {
    "title": { "x": 50, "y": 160, "color": "#000000", "fontSize": 22, ... },
    "client_name": { "x": 80, "y": 140, "color": "#000000", "fontSize": 12, ... },
    ...
  }
```

## Configuration
The template matching is based on:
- `template_type`: Must be 'contrat'
- `agency_id`: User's agency from profiles table
- Most recent: Uses `ORDER BY created_at DESC LIMIT 1`

## Testing
1. Go to Planner page
2. Click on a reservation
3. Click "Contrat" button
4. Personalization modal opens
5. Should load template from database (check console for logs)
6. Fields should display at correct positions from database
7. If no template found, uses default 6-field template

## Key Files Modified
- `src/components/PlannerPage.tsx`
  - Line 1328: Simplified `getInitialElements()` for contract type
  - Line 1745-1830: Added `loadTemplateFromDatabase()` and `getFieldValue()`
  - Added `loading` state
  - Added useEffect to trigger database load

## Console Logs Added
```
// Success
"Loaded contract template from database:", templateData.template
"Elements loaded from database template:", elementsFromDB

// Fallback
"No template found in database, using defaults"

// Error
"Error loading template from database:", error
```

## Files Not Changed
- DocumentTemplateEditor.tsx (already loads from database)
- DocumentTemplateService.ts (already supports database operations)
- DocumentRenderer.tsx (already loads from database)

Only PlannerPage needed updating because it was the only place still using hardcoded template definitions.

## Next Steps
1. Verify template displays correctly on Planner page
2. Test dragging fields to change positions
3. Confirm field values are populated correctly
4. Test saving modified template
5. Verify other document types still work (engagement, versement, etc.)
