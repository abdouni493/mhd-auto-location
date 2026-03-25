# Dynamic Template-Driven Printing System

## Overview

This document outlines the new template-driven printing system that replaces hardcoded document templates. The system is fully dynamic and allows agencies to customize document templates through the database.

## Architecture

### Services

#### 1. **TemplateService** (`src/services/TemplateService.ts`)
Handles all database operations for document templates.

**Key Methods:**
- `getTemplateById(templateId)` - Get a template by ID
- `getTemplatesByType(documentType, agencyId)` - Get all templates for a type
- `getDefaultTemplate(documentType, agencyId)` - Get default template
- `saveTemplate(...)` - Save a new template
- `updateTemplate(templateId, updates)` - Update existing template
- `deleteTemplate(templateId)` - Delete a template
- `getOrCreateDefaultTemplate(...)` - Get or create a default

**Database Table:**
```sql
document_templates:
- id (uuid)
- agency_id (uuid)
- template_type (text: 'contrat', 'devis', 'facture', 'engagement', 'recu')
- name (text)
- template (jsonb: {html, styles})
- is_default (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 2. **RenderService** (`src/services/RenderService.ts`)
Handles template rendering with placeholder replacement.

**Key Methods:**
- `renderTemplate(html, data)` - Render template with data
- `buildDocumentData(client, reservation, car, payments, agencySettings)` - Build data object
- `extractPlaceholders(html)` - Extract placeholders from template
- `validateData(html, data)` - Check for missing values

**Placeholder Format:**
```
{{variable_name}}
{{nested.value}}
```

**Supported Variables:**
```javascript
// Client info
client_name, client_first_name, client_last_name, client_phone, client_email

// Car info
car_model, car_brand, car_model_name, car_year, car_color

// Reservation info
start_date, end_date, departure_date, return_date, total_price, daily_rate

// Document-specific info
quote_number, invoice_number, receipt_number, engagement_number, invoice_date, etc.

// Agency info
agency_name, agency_phone, agency_address
```

#### 3. **PrintService** (`src/services/PrintService.ts`)
Handles printing operations.

**Key Methods:**
- `printDocument(title, html, styles)` - Print HTML content
- `printTemplatedDocument(title, templateHtml, data, styles)` - Print templated document
- `openPrintPreview(title, html, styles)` - Open print preview
- `isPrintSupported()` - Check if printing is supported

### Components

#### 1. **TemplateSelector** (`src/components/TemplateSelector.tsx`)
Modal component for selecting templates.

**Props:**
```tsx
interface TemplateSelectorProps {
  documentType: DocumentType;
  agencyId: string;
  onSelectTemplate: (template: DocumentTemplateRow) => void;
  onClose: () => void;
  onEditTemplate?: (template: DocumentTemplateRow) => void;
  onDeleteTemplate?: (templateId: string) => void;
}
```

#### 2. **TemplateSaveModal** (`src/components/TemplateSaveModal.tsx`)
Modal component for saving/creating templates.

**Props:**
```tsx
interface TemplateSaveModalProps {
  documentType: DocumentType;
  agencyId: string;
  templateHtml: string;
  templateStyles?: any;
  onSave: () => void;
  onClose: () => void;
}
```

#### 3. **DynamicDocumentPrinter** (`src/components/DynamicDocumentPrinter.tsx`)
Main component that integrates all services and handles printing workflow.

**Props:**
```tsx
interface DynamicDocumentPrinterProps {
  documentType: DocumentType;
  agencyId: string;
  documentData: {
    client?: any;
    reservation?: any;
    car?: any;
    payments?: any[];
    agencySettings?: any;
  };
  onPrint?: () => void;
  customTitle?: string;
}
```

**Features:**
- Loads default template automatically
- Shows template info and status
- Allows selecting different templates
- Preview functionality
- Save new templates
- Error handling

## Integration Steps

### Step 1: Update Reservation Details View

In `src/components/ReservationDetailsView.tsx`:

```tsx
import { DynamicDocumentPrinter } from './DynamicDocumentPrinter';
import { supabase } from '../supabase';

// In component state
const [currentAgencyId, setCurrentAgencyId] = useState<string>('');
const [agencySettings, setAgencySettings] = useState<any>(null);

// In useEffect
useEffect(() => {
  loadAgencyInfo();
}, []);

const loadAgencyInfo = async () => {
  const { data: userData } = await supabase.auth.getUser();
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', userData?.user?.id)
    .single();

  if (userProfile?.agency_id) {
    setCurrentAgencyId(userProfile.agency_id);

    const { data: settings } = await supabase
      .from('agency_settings')
      .select('*')
      .single();

    setAgencySettings(settings);
  }
};

// Replace handlePrint with component usage
const renderPrinter = (type: DocumentType) => (
  <DynamicDocumentPrinter
    documentType={type}
    agencyId={currentAgencyId}
    documentData={{
      client: reservation.clientData,
      reservation: reservation,
      car: reservation.carData,
      payments: reservation.payments,
      agencySettings: agencySettings,
    }}
    customTitle={`${type.charAt(0).toUpperCase() + type.slice(1)}`}
  />
);

// In JSX
<div className="mt-4 space-y-4">
  {renderPrinter('devis')}
</div>
```

### Step 2: Update Planner Page

In `src/components/PlannerPage.tsx`:

```tsx
import { DynamicDocumentPrinter } from './DynamicDocumentPrinter';

// Replace handlePrint function and print modals with:
const [selectedReservationForPrint, setSelectedReservationForPrint] = 
  useState<{ reservation: ReservationDetails; type: DocumentType } | null>(null);

// In JSX for print buttons
{selectedReservationForPrint && (
  <DynamicDocumentPrinter
    documentType={selectedReservationForPrint.type}
    agencyId={currentAgencyId}
    documentData={{
      client: selectedReservationForPrint.reservation.clientData,
      reservation: selectedReservationForPrint.reservation,
      car: selectedReservationForPrint.reservation.carData,
      payments: selectedReservationForPrint.reservation.payments,
      agencySettings: agencySettings,
    }}
    onPrint={() => setSelectedReservationForPrint(null)}
  />
)}
```

### Step 3: Remove Hardcoded HTML

Search and remove all hardcoded print HTML generation functions:
- `generatePersonalizedContent()` 
- `generatePrintContent()`
- `getInitialElements()`
- All print-related JSX in DocumentRenderer.tsx
- All localStorage-based template storage

## Template Structure

Each template in the database should follow this structure:

```javascript
{
  "id": "uuid",
  "agency_id": "uuid",
  "template_type": "contrat",
  "name": "Contrat Standard",
  "template": {
    "html": "<h1>{{title}}</h1>...",
    "styles": {
      "font": "Arial",
      "fontSize": "12px",
      "primaryColor": "#1a365d"
    }
  },
  "is_default": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## Example Template HTML

### Contrat (Contract)

```html
<h1>Contrat de Location</h1>
<hr />

<div style="margin-bottom: 20px;">
  <h2>Informations Client</h2>
  <p><strong>Nom:</strong> {{client_name}}</p>
  <p><strong>Téléphone:</strong> {{client_phone}}</p>
  <p><strong>Email:</strong> {{client_email}}</p>
</div>

<div style="margin-bottom: 20px;">
  <h2>Informations Véhicule</h2>
  <p><strong>Modèle:</strong> {{car_model}}</p>
  <p><strong>Année:</strong> {{car_year}}</p>
  <p><strong>Couleur:</strong> {{car_color}}</p>
</div>

<div style="margin-bottom: 20px;">
  <h2>Détails de Location</h2>
  <p><strong>Date de début:</strong> {{start_date}}</p>
  <p><strong>Date de fin:</strong> {{end_date}}</p>
  <p><strong>Prix total:</strong> {{total_price}} DA</p>
</div>

<hr />
<p style="margin-top: 30px; text-align: center;">
  Signature du client: __________________________
</p>
<p style="text-align: center; font-size: 10px; color: #666;">
  Document généré le {{today}}
</p>
```

### Devis (Quote)

```html
<h1 style="text-align: center;">DEVIS</h1>
<p style="text-align: center;">N° {{quote_number}}</p>

<p><strong>Client:</strong> {{client_name}}</p>
<p><strong>Véhicule:</strong> {{car_model}}</p>
<p><strong>Tarif journalier:</strong> {{daily_rate}} DA</p>
<p><strong>Nombre de jours:</strong> [À calculer]</p>
<hr />
<p><strong>Prix total:</strong> {{total_price}} DA</p>
<p style="font-size: 10px; color: #666;">Valide jusqu'au {{validity_date}}</p>
```

## Error Handling

The system includes comprehensive error handling:

1. **Missing Templates**: If no template exists, creates a default
2. **Invalid HTML**: Shows error message to user
3. **Missing Data**: Continues with empty placeholders
4. **Popup Blocked**: Alerts user to check popup blocker settings
5. **Database Errors**: Logs errors and shows user-friendly messages

## Default Templates

Default templates are automatically created for each document type if none exist:

- **Contrat**: Basic contract with client, vehicle, and rental info
- **Devis**: Quote template with pricing
- **Facture**: Invoice template
- **Engagement**: Commitment letter template
- **Reçu**: Receipt template

## Using the System

### For End Users:

1. **Print Document**: Click "Imprimer" button
   - System loads default template automatically
   - Renders template with current data
   - Opens print dialog

2. **Select Different Template**: Click "Autre modèle"
   - Modal shows all available templates
   - Can preview templates
   - Select to use immediately

3. **Create New Template**: Click "Enregistrer modèle"
   - Enter template name
   - Option to set as default
   - Saves to database

4. **Preview**: Click "Aperçu"
   - Opens preview window
   - Shows rendered document
   - Can then print or close

### For Developers:

#### Using TemplateService:

```typescript
// Get or create default
const template = await TemplateService.getOrCreateDefaultTemplate('contrat', agencyId);

// Get all templates
const templates = await TemplateService.getTemplatesByType('devis', agencyId);

// Save new template
const newTemplate = await TemplateService.saveTemplate(
  'facture',
  agencyId,
  'My Custom Invoice',
  { html: '<h1>Invoice</h1>', styles: { font: 'Arial' } },
  true // Set as default
);
```

#### Using RenderService:

```typescript
// Build data
const data = RenderService.buildDocumentData(client, reservation, car, payments, settings);

// Render template
const html = RenderService.renderTemplate(templateHtml, data);

// Validate
const validation = RenderService.validateData(templateHtml, data);
if (!validation.valid) {
  console.warn('Missing:', validation.missing);
}
```

#### Using PrintService:

```typescript
// Print directly
PrintService.printDocument('My Document', html, css);

// Print templated
await PrintService.printTemplatedDocument(title, templateHtml, data, styles);

// Preview
const window = PrintService.openPrintPreview(title, html, css);
```

## Migration Checklist

- [ ] Create `document_templates` table in PostgreSQL
- [ ] Insert default templates for each agency
- [ ] Create new service files in `src/services/`
- [ ] Create new component files in `src/components/`
- [ ] Update ReservationDetailsView.tsx
- [ ] Update PlannerPage.tsx
- [ ] Remove all hardcoded print functions
- [ ] Remove localStorage-based template storage
- [ ] Test printing with all document types
- [ ] Test template selection and saving
- [ ] Test preview functionality
- [ ] Test error handling scenarios

## Database Setup

```sql
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL CHECK (template_type IN ('contrat', 'devis', 'facture', 'engagement', 'recu')),
  name TEXT NOT NULL,
  template JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agency_id, template_type, is_default) WHERE is_default = true
);

CREATE INDEX idx_document_templates_agency_type 
  ON document_templates(agency_id, template_type);

CREATE INDEX idx_document_templates_default 
  ON document_templates(agency_id, template_type, is_default) WHERE is_default = true;
```

## Benefits

✅ **Fully Dynamic**: No hardcoded templates
✅ **Agency-Specific**: Each agency can customize templates
✅ **Multi-Language Ready**: Variables can be translated
✅ **Versioning**: Multiple templates per type
✅ **Easy Updates**: Change templates without code deployment
✅ **Default Fallback**: Always has a default template
✅ **Error Resilient**: Handles missing data gracefully
✅ **User-Friendly**: Simple modal interfaces

## Future Enhancements

1. **Template Editor UI**: Visual template builder
2. **Preview with Real Data**: Live preview while editing
3. **Template History**: Version control for templates
4. **Multi-Language**: Translate template text
5. **PDF Export**: Direct PDF download without print dialog
6. **Email**: Send documents via email
7. **Digital Signatures**: Add signature capture
8. **QR Codes**: Add QR codes to documents
9. **Batch Printing**: Print multiple documents
10. **Template Library**: Share templates between agencies

---

**Status**: Ready for integration and testing
**Last Updated**: 2024
