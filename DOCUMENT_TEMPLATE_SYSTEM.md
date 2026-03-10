# Document Template Personalization System - Implementation Guide

## Overview

A complete document template personalization system has been implemented for the LuxDrive car rental application. This system allows users to customize printable documents (Contrat, Devis, Facture, Reçu, Engagement) with drag-and-drop field positioning, custom colors, font sizes, and custom text blocks.

## What Was Implemented

### 1. Database Schema Updates

**File:** `add_document_templates.sql`

Added a `document_templates` JSONB column to the `agency_settings` table with the following structure:

```json
{
  "contrat": {
    "title": { "x": 120, "y": 40, "color": "#000000", "fontSize": 24 },
    "client_name": { "x": 80, "y": 140, "color": "#000000", "fontSize": 12 },
    "car_model": { "x": 80, "y": 180, "color": "#000000", "fontSize": 12 },
    "rental_dates": { "x": 80, "y": 220, "color": "#000000", "fontSize": 12 },
    "price_total": { "x": 80, "y": 260, "color": "#000000", "fontSize": 14 },
    "signature_line": { "x": 80, "y": 450, "color": "#000000", "fontSize": 10 }
  },
  "devis": { ... },
  "facture": { ... },
  "recu": { ... },
  "engagement": { ... }
}
```

Each field contains:
- `x`: Horizontal position in pixels
- `y`: Vertical position in pixels
- `color`: Text color (hex format)
- `fontSize`: Font size in pixels
- `fontWeight`: Optional (normal/bold)
- `textAlign`: Optional (left/center/right)
- `maxWidth`: Optional maximum width in pixels
- `customText`: Optional custom text for custom fields

### 2. Type Definitions

**File:** `src/types.ts`

Added new TypeScript interfaces:

```typescript
export type DocumentType = 'contrat' | 'devis' | 'facture' | 'recu' | 'engagement';

export interface DocumentField {
  x: number;
  y: number;
  color?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  maxWidth?: number;
  customText?: string;
}

export interface DocumentTemplate {
  [key: string]: DocumentField;
}

export interface DocumentTemplates {
  contrat?: DocumentTemplate;
  devis?: DocumentTemplate;
  facture?: DocumentTemplate;
  recu?: DocumentTemplate;
  engagement?: DocumentTemplate;
}

export interface AgencySettings {
  id: string;
  agencyName: string;
  slogan?: string;
  address?: string;
  phone?: string;
  documentTemplates?: DocumentTemplates;
  createdAt: string;
  updatedAt: string;
}
```

### 3. Document Template Service

**File:** `src/services/DocumentTemplateService.ts`

Provides all database operations for managing document templates:

```typescript
// Main methods:
- getDocumentTemplates(): Promise<DocumentTemplates>
- getDocumentTemplate(documentType): Promise<DocumentTemplate | null>
- updateDocumentTemplates(templates): Promise<DocumentTemplates>
- updateDocumentType(documentType, template): Promise<DocumentTemplates>
- updateDocumentField(documentType, fieldName, fieldConfig): Promise<DocumentTemplates>
- addCustomTextField(documentType, customFieldName, fieldConfig): Promise<DocumentTemplates>
- removeCustomField(documentType, fieldName): Promise<DocumentTemplates>
- resetDocumentType(documentType): Promise<DocumentTemplates>
- getAgencySettings(): Promise<AgencySettings | null>
```

### 4. DocumentTemplateEditor Component

**File:** `src/components/DocumentTemplateEditor.tsx`

A full-featured editor modal for customizing document templates:

**Features:**
- **Live Canvas Preview:** Real-time preview of document layout
- **Drag & Drop:** Click and drag field boxes to reposition them
- **Field Editing:**
  - Change colors with color picker
  - Adjust font sizes with range slider
  - Edit custom text for custom fields
  - Delete custom fields
- **Add Custom Fields:** Create new text blocks with custom names
- **Field List:** Sidebar showing all fields in the template
- **Reset to Default:** Restore original template layout
- **Save Changes:** Persist all modifications to database

**Usage:**
```tsx
<DocumentTemplateEditor
  documentType="facture"
  onClose={() => setShowTemplateEditor(false)}
  onSave={() => console.log('Template saved!')}
/>
```

### 5. DocumentRenderer Component

**File:** `src/components/DocumentRenderer.tsx`

Renders documents using saved templates and applies field values:

**Features:**
- **Template Application:** Loads saved template from database
- **Dynamic Field Values:** Populates fields with invoice data (client name, car model, amounts, dates, etc.)
- **Print Support:** Click "Print Document" to print with saved layout
- **Edit Template Link:** Quick access to template editor
- **Responsive Layout:** Works at any screen size

**Usage:**
```tsx
<DocumentRenderer
  documentType="facture"
  invoice={selectedInvoice}
  onEditTemplate={() => setShowTemplateEditor(true)}
  lang="fr"
/>
```

### 6. BillingPage Integration

**File:** `src/components/BillingPage.tsx`

Updated the billing page with:
- Document Template Customization section (purple gradient panel)
- Quick-access buttons for editing each document type
- Modal states for template editor and document renderer
- Handler functions for opening editors

**Added UI:**
- Purple gradient panel showing all 5 document types
- One-click access to customize each template
- Integrated template editor modal
- Document preview modal

## How to Use

### For End Users

1. **Access Template Customization:**
   - Navigate to Billing Page
   - Scroll to "Document Template Customization" section
   - Click on any document type button (Contrat, Devis, Facture, Reçu, Engagement)

2. **Edit Template:**
   - In the editor, you can:
     - **Drag fields:** Click and drag any field box to reposition it
     - **Change colors:** Click a field, then use the color picker
     - **Change font size:** Click a field, then adjust the font size slider
     - **Add custom text:** Enter a name in "Add Custom Text" box and click "Add Field"
     - **Delete custom fields:** Select the field and click "Delete Field"
     - **Reset:** Click "Reset to Default" to undo all changes
   - Click **"Save Changes"** to persist to database

3. **Print with Custom Layout:**
   - View any invoice
   - The document will automatically use the saved custom layout
   - Click "Print Document" button to print with custom positioning

### For Developers

#### Add a New Document Type

1. Update `DocumentType` in `src/types.ts`:
```typescript
export type DocumentType = 'contrat' | 'devis' | 'facture' | 'recu' | 'engagement' | 'mynewtype';
```

2. Add default template in `DocumentTemplateService.resetDocumentType()`:
```typescript
mynewtype: {
  title: { x: 120, y: 40, color: "#000000", fontSize: 24 },
  // ... more fields
}
```

3. Update `DEFAULT_FIELD_NAMES` in `DocumentTemplateEditor.tsx`:
```typescript
mynewtype: ['title', 'field1', 'field2', ...],
```

4. Update field value mapping in `DocumentRenderer.tsx`:
```typescript
case 'my_field':
  return invoice.someField || 'N/A';
```

#### Customize Field Mapping

Edit the `getFieldValue()` function in `DocumentRenderer.tsx` to map fields to invoice data:

```typescript
const getFieldValue = (fieldName: string): string => {
  switch (fieldName) {
    case 'client_name':
      return invoice.clientName;
    case 'custom_field':
      return template?.[fieldName]?.customText || '';
    // ... more cases
  }
};
```

## Database Migration

To apply the database changes:

1. Execute the SQL migration:
```sql
-- Run add_document_templates.sql in your Supabase database
psql -h your-host -U your-user -d your-db -f add_document_templates.sql
```

Or use Supabase SQL Editor:
1. Go to Supabase Dashboard
2. Open SQL Editor
3. Copy contents of `add_document_templates.sql`
4. Execute

## Key Features

✅ **Drag & Drop Positioning:** Intuitive field repositioning  
✅ **Color Customization:** Full hex color picker support  
✅ **Font Size Adjustment:** Range slider for fine-tuning  
✅ **Custom Text Blocks:** Add unlimited custom fields  
✅ **Live Preview:** See changes in real-time on canvas  
✅ **Persistent Storage:** All changes saved to database  
✅ **Auto-Population:** Fields auto-populated from invoice data  
✅ **Print-Ready:** Optimized for high-quality printing  
✅ **Default Templates:** Pre-configured layouts for all document types  
✅ **Reset Functionality:** One-click restoration to defaults  

## Technical Stack

- **Frontend:** React 18 + TypeScript
- **UI Library:** Tailwind CSS + Motion (Framer Motion)
- **Database:** Supabase (PostgreSQL)
- **State Management:** React Hooks
- **Icons:** Lucide React

## File Structure

```
src/
├── components/
│   ├── BillingPage.tsx          (Updated - integrated templates)
│   ├── DocumentTemplateEditor.tsx (New - template customization)
│   └── DocumentRenderer.tsx      (New - document rendering)
├── services/
│   ├── DocumentTemplateService.ts (New - database operations)
│   └── ...existing services
├── types.ts                       (Updated - new interfaces)
└── ...

Database/
└── add_document_templates.sql     (New - schema migration)
```

## Default Templates

All document types come with pre-configured default layouts:

### Contrat
- Title, Client Name, Car Model, Rental Dates, Price Total, Signature Line

### Devis (Quote)
- Title, Quote Number, Client Name, Car Model, Validity Date, Price Total

### Facture (Invoice)
- Title, Invoice Number, Invoice Date, Client Name, Car Model, Amount Due, Payment Terms

### Reçu (Receipt)
- Title, Receipt Number, Receipt Date, Client Name, Amount Paid, Payment Method

### Engagement (Commitment Letter)
- Title, Engagement Number, Client Name, Vehicle Info, Commitment Date, Terms & Conditions

## Error Handling

The system includes comprehensive error handling:
- Missing template fallback to defaults
- Network error alerts
- Loading states during save
- Validation for custom field names
- Type-safe operations

## Future Enhancements

- **Font Selection:** Allow users to choose different fonts
- **Custom Logos:** Add company logo positioning
- **Multiple Layouts:** Save multiple template versions
- **Template Sharing:** Share templates between agencies
- **Font Styles:** Bold, italic, underline support
- **Background Images:** Custom background support
- **Export/Import:** Save templates as JSON files

## Troubleshooting

### Template changes not saving?
- Check browser console for errors
- Verify Supabase connection
- Ensure user has authenticated

### Fields not appearing?
- Reload the page
- Check that document type is correctly spelled
- Verify template exists in database

### Print layout looks wrong?
- Adjust field positions in editor
- Check print preview before printing
- Ensure printer supports full page width

## Support

For issues or questions:
1. Check the error console (F12)
2. Verify database migration was applied
3. Ensure all files are properly imported
4. Test with a simple template first

---

**Last Updated:** March 10, 2026  
**Version:** 1.0  
**Status:** Production Ready
