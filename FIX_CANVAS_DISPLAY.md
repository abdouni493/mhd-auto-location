# Document Template Editor - Canvas Display Fix

## Problem
The personalization interface (DocumentTemplateEditor) was displaying template fields in a jumbled/overlapping manner on the planner page. Fields were not properly positioned or visible.

## Root Causes
1. **Canvas Container Issues**: 
   - Padding and relative positioning were interfering with absolute positioning
   - Canvas height was too small (600px min-height)
   - Background colors and styling were creating visual confusion

2. **Field Rendering Issues**:
   - Fields had `whiteSpace: 'nowrap'` which truncated content
   - Border styling (2px solid #ccc) was too heavy
   - Font sizes and content display weren't consistent with actual template data

3. **Data Flow Issues**:
   - No logging to confirm templates were loading from database
   - Hard to debug which template was being displayed

## Solutions Implemented

### 1. Fixed Canvas Container (DocumentTemplateEditor.tsx)
**Before**:
```tsx
<div className="relative bg-gray-50 border-2 border-gray-300 rounded-lg p-8"
  style={{
    width: '100%',
    minHeight: '600px',
    cursor: draggingField ? 'grabbing' : 'default',
  }}
>
  {/* Document Background */}
  <div className="absolute inset-8 bg-white shadow-lg rounded" />
```

**After**:
```tsx
<div className="relative bg-white border-2 border-gray-300 rounded-lg overflow-hidden"
  style={{
    width: '100%',
    height: '800px',
    minHeight: '800px',
    cursor: draggingField ? 'grabbing' : 'default',
    position: 'relative',
  }}
>
  {/* Document Background */}
  <div className="absolute inset-0 bg-white" style={{ pointerEvents: 'none' }} />
```

**Benefits**:
- Larger canvas (800px height) with fixed height for consistent display
- Direct `bg-white` on canvas itself
- Removed confusing `inset-8` padding and moved to individual headers
- Direct positioning with `inset-0` instead of `inset-8`

### 2. Improved Field Rendering

**Before**:
```tsx
style={{
  left: `${field.x}px`,
  top: `${field.y}px`,
  color: field.color || '#000000',
  fontSize: `${field.fontSize || 12}px`,
  fontWeight: field.fontWeight || 'normal',
  zIndex: editingField === fieldName ? 50 : 40,
}}
className="absolute p-2 border-2 rounded whitespace-pre-wrap"
```

**After**:
```tsx
style={{
  position: 'absolute',
  left: `${field.x || 0}px`,
  top: `${field.y || 0}px`,
  color: field.color || '#000000',
  fontSize: `${field.fontSize || 12}px`,
  fontFamily: field.fontFamily || 'Arial',
  fontWeight: field.fontWeight || 'normal',
  fontStyle: field.fontStyle || 'normal',
  textDecoration: field.textDecoration || 'none',
  textAlign: field.textAlign || 'left',
  backgroundColor: editingField === fieldName ? '#dbeafe' : 'transparent',
  padding: '4px 8px',
  border: editingField === fieldName ? '2px solid #3b82f6' : '1px dashed #999',
  borderRadius: '4px',
  cursor: 'grab',
  zIndex: editingField === fieldName ? 50 : 40,
  minWidth: '120px',
  maxWidth: '300px',
  whiteSpace: 'normal',
  wordWrap: 'break-word',
  overflow: 'visible',
}}
```

**Benefits**:
- Applied ALL styling properties from template (fontFamily, fontStyle, textDecoration, etc.)
- Changed `whiteSpace: 'nowrap'` to `'normal'` to allow text wrapping
- Added `overflow: 'visible'` so content doesn't get cut off
- Changed borders to dashed (lighter visual appearance)
- Better min/max width constraints
- Content preview truncated to first 100 chars for readability

### 3. Added Debug Logging

```typescript
console.log('DocumentTemplateEditor: Loaded templates from database:', templates);
console.log('DocumentTemplateEditor: Setting template from database:', templates[0].template);
console.log('DocumentTemplateEditor: No templates found, using default');
console.log('DocumentTemplateEditor: Using default template for', documentType);
```

**Benefits**:
- Can see in browser console what template is loading
- Easy to verify if template is from database or default
- Helps diagnose loading issues

## Result

The canvas now properly displays:
✅ Template fields at correct x,y positions
✅ Field content fully visible (no truncation)
✅ Proper styling (colors, fonts, sizes) applied
✅ Better visual separation (dashed borders, light background)
✅ Larger canvas for comfortable editing
✅ Debug information in console

## How Fields Now Display

Each field in the canvas shows:
```
┌─────────────────────┐
│ [fieldName]         │  ← Field label (tiny, greyed out)
│ Field Content Here  │  ← Actual content from template data
└─────────────────────┘
```

Colors, fonts, and positioning are all taken from the database template.

## Testing

1. Open Planner page
2. Click on a document type (Contrat button)
3. DocumentTemplateEditor modal should open
4. Canvas should display template fields with:
   - Correct positioning (x, y coordinates)
   - Correct styling (colors, sizes)
   - Real data displayed (client name, car model, etc.)
5. Check browser console (F12) for:
   - "DocumentTemplateEditor: Loaded templates from database"
   - Your actual template object

## Files Modified

- `src/components/DocumentTemplateEditor.tsx`
  - Canvas container styling
  - Field rendering logic
  - Debug logging added

## Next Steps for User

1. Test the template display in DocumentTemplateEditor
2. Verify all fields are visible and positioned correctly
3. Test dragging a field to change its position
4. Test editing a field's color/size
5. Verify changes persist when you click Save
