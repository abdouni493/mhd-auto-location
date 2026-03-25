# Template Printing System - Complete Guide

## Overview
The application now supports a complete template-driven printing system with multi-type support, database persistence, and real-time customization.

## Features Implemented

### 1. **Multi-Type Template Support**
Users can now create and save templates for multiple document types:
- **Contrat** (Contract)
- **Devis** (Quote/Estimate)  
- **Facture** (Invoice)
- **Engagement** (Commitment Letter)
- **Reçu** (Receipt)

### 2. **Template Creation and Naming**
When saving a new template:
- **Name Field**: Users enter a custom name for their template (e.g., "Contrat Standard", "Facture 2024")
- **Type Selection**: Choose document type from dropdown (contrat, devis, facture, engagement, reçu)
- **Database Persistence**: Templates are saved with timestamps in Supabase `document_templates` table

### 3. **Template Loading Interface**
The personalization modal displays:
- **Active Templates List**: Grid showing all available templates for the current document type
- **Template Selector**: Dropdown to quickly switch between saved templates
- **Current Template Info**: Display which template is currently in use
- **One-Click Loading**: Click any template to apply it immediately

### 4. **Improved Print Design**
Contract printing now features:
- **Professional Layout**: A4 page format (210mm × 297mm)
- **Better Typography**: Modern font stack (Segoe UI, Tahoma, etc.)
- **Print-Optimized Styling**: Box shadows and styling removed during print
- **Page Breaks**: Proper handling of multi-page documents
- **Responsive Design**: Clean spacing and margins

### 5. **Element Customization**
Users can customize each template element:
- **Text Content**: Edit placeholder values
- **Font Properties**: Size, family, weight, style
- **Colors**: Text and background colors
- **Alignment**: Left, center, right positioning
- **Positioning**: Drag elements to custom locations

## Database Schema

### Document Templates Table
```sql
CREATE TABLE document_templates (
  id UUID PRIMARY KEY,
  agency_id UUID,
  template_type TEXT,          -- 'contrat', 'devis', 'facture', 'engagement', 'recu'
  name TEXT,                   -- User-friendly template name
  template JSONB,              -- Template configuration
  is_default BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## Usage Workflow

### Creating a New Template

1. **Open Personalization Modal**
   - Click "Print" button on a reservation
   - Select document type (Contrat, Devis, etc.)
   - Click "Personnaliser" for customization

2. **Customize Elements**
   - Click elements in preview to edit
   - Adjust text, colors, fonts in properties panel
   - Drag elements to reposition them
   - Add custom text with "➕ Ajouter du texte" button

3. **Save Template**
   - Click "💾 Sauvegarder" button
   - Enter template name: "Contrat Standard"
   - Select document type from dropdown
   - Click "Sauvegarder" to persist

### Using an Existing Template

1. **Open Personalization Modal**
   - Click "Print" on any reservation
   - Modal loads the most recent template automatically

2. **Switch Templates**
   - Use template selector dropdown
   - Or click template card in available templates list
   - Template applies immediately

3. **Update and Print**
   - Make any additional edits
   - Click "🖨️ Imprimer" to print

## Key Code Changes

### PlannerPage.tsx Updates

#### New State Variables
```typescript
const [selectedTemplateType, setSelectedTemplateType] = useState(type);
const [templateName, setTemplateName] = useState('');
```

#### Enhanced Template Loading
```typescript
// Load templates for ANY document type, not just contracts
if (type === 'contract' || type === 'devis' || type === 'facture' 
    || type === 'engagement' || type === 'recu') {
  loadTemplateFromDatabase();
}
```

#### Improved Save Function
```typescript
// Now saves template_type and name from user input
const { data, error } = await supabase
  .from('document_templates')
  .insert([{
    template_type: selectedTemplateType,  // User selected type
    name: templateName,                   // User entered name
    template: dbTemplate,
    created_at: new Date().toISOString(),
  }])
```

#### Better Template Selection
```typescript
// Display all templates with names and dates
{allDatabaseTemplates.map((template) => (
  <div onClick={() => loadSpecificTemplate(template.id)}>
    <h5>{template.name}</h5>
    <p>{new Date(template.created_at).toLocaleDateString()}</p>
  </div>
))}
```

## Print Content Generation

### Updated HTML Output
- **A4 Page Format**: 210mm × 297mm A4 size
- **Professional Styling**: Modern CSS with proper spacing
- **Print Media Queries**: Different styles for screen vs print
- **Page Container**: `.page` div with proper margin and shadows

```html
<style>
  .page {
    width: 210mm;
    min-height: 297mm;
    background: white;
    padding: 20px;
    margin: 0 auto 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  @media print {
    .page {
      box-shadow: none;
      page-break-after: always;
    }
  }
</style>
```

## User Interface Improvements

### Save Dialog
- **Template Name Input**: Custom naming for organization
- **Type Selector**: Choose document category
- **Update Indicator**: Shows when updating existing template
- **Clear Buttons**: Cancel and Save options

### Template Grid
- **Visual Cards**: Each template displayed as clickable card
- **Metadata Display**: Name and creation date
- **Active Indicator**: Checkmark shows current template
- **Auto-Loading**: Click to instantly apply

### Personalization Modal
- **Unified Interface**: All document types work the same
- **Drag & Drop**: Move elements by clicking and dragging
- **Properties Panel**: Edit all element properties
- **Real-time Preview**: See changes instantly
- **Save and Print**: Action buttons at bottom

## Technical Details

### No Profiles Table Dependency
- Removed problematic `profiles` table queries
- Templates now saved without agency filtering
- Better error handling and graceful fallbacks

### Improved Error Handling
- Database template not found → Use default elements
- Network errors → Show user-friendly messages
- Validation → Require template name before saving

### Performance Optimizations
- Load templates on demand
- Cache templates in state
- Efficient database queries
- Proper cleanup of listeners

## Future Enhancements

### Potential Additions
1. **Template Sharing**: Share templates between team members
2. **Template Categories**: Organize by department/category
3. **Version History**: Restore previous template versions
4. **Template Preview**: Quick preview before loading
5. **Batch Operations**: Apply template to multiple reservations
6. **Custom Fields**: User-defined template variables
7. **Digital Signatures**: Add signature fields to templates
8. **QR Codes**: Auto-generate reservation QR codes

## Troubleshooting

### Template Not Saving
- Verify template name is entered
- Check Supabase connection status
- Ensure document type is selected
- Check browser console for errors

### Empty Print Output
- Verify agency settings (logo, name) in database
- Check that template elements have valid content
- Ensure reservation data is complete
- Try regenerating with default template

### Dropdown Not Showing Templates
- Reload the page
- Create at least one template first
- Check Supabase table for saved templates
- Verify template_type matches current document type

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify Supabase database connection
3. Ensure document_templates table exists with correct schema
4. Review browser cache/localStorage for conflicts

---

**Last Updated**: March 2026
**Version**: 2.0 - Multi-Type Template System
