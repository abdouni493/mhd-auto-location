# Dynamic Printing System - Quick Reference

## 🚀 Quick Start

### For End Users

**Print a Document:**
1. Click "Imprimer" button
2. Document prints with default template
3. Done!

**Use Different Template:**
1. Click "Autre modèle"
2. Select template from list
3. Click "Sélectionner"
4. Click "Imprimer"

**Save Current Template:**
1. Click "Enregistrer modèle"
2. Enter template name
3. Optionally check "Par défaut"
4. Click "Enregistrer"

**Preview Before Printing:**
1. Click "Aperçu"
2. Review document in new window
3. Close to return or print from preview

---

## 💻 For Developers

### Import Services

```typescript
import { TemplateService } from '../services/TemplateService';
import { RenderService } from '../services/RenderService';
import { PrintService } from '../services/PrintService';
```

### Import Components

```typescript
import { DynamicDocumentPrinter } from '../components/DynamicDocumentPrinter';
import { TemplateSelector } from '../components/TemplateSelector';
import { TemplateSaveModal } from '../components/TemplateSaveModal';
```

### Basic Usage

```typescript
// Render a template with data
const html = RenderService.renderTemplate(templateHtml, data);

// Print it
PrintService.printDocument('Title', html, styles);

// Or combine both
await PrintService.printTemplatedDocument('Title', templateHtml, data, styles);
```

### Component Usage

```jsx
<DynamicDocumentPrinter
  documentType="contrat"
  agencyId={agencyId}
  documentData={{
    client: clientData,
    reservation: reservationData,
    car: carData,
    payments: paymentsData,
    agencySettings: settings,
  }}
  onPrint={() => console.log('Printed!')}
/>
```

---

## 📋 Template Placeholders

### Common Variables

```
{{client_name}}              → "Ahmed Ali"
{{client_first_name}}        → "Ahmed"
{{client_last_name}}         → "Ali"
{{client_phone}}             → "+213 555 1234"
{{client_email}}             → "ahmed@example.com"

{{car_model}}                → "Toyota Camry"
{{car_brand}}                → "Toyota"
{{car_model_name}}           → "Camry"
{{car_year}}                 → "2023"
{{car_color}}                → "White"

{{start_date}}               → "25/03/2024"
{{end_date}}                 → "28/03/2024"
{{total_price}}              → "25 000"

{{agency_name}}              → "Luxdrive"
{{agency_phone}}             → "+213 555 5555"
{{agency_address}}           → "Downtown Algiers"
```

### Document-Specific Variables

**Quote (Devis):**
```
{{quote_number}}
{{validity_date}}
```

**Invoice (Facture):**
```
{{invoice_number}}
{{invoice_date}}
{{amount}}
{{payment_terms}}
```

**Receipt (Reçu):**
```
{{receipt_number}}
{{receipt_date}}
{{amount_paid}}
{{remaining_amount}}
{{payment_method}}
```

**Engagement:**
```
{{engagement_number}}
{{commitment_date}}
```

---

## 📚 Service Methods

### TemplateService

```typescript
// Get by ID
const template = await TemplateService.getTemplateById(id);

// Get all for type
const templates = await TemplateService.getTemplatesByType(type, agencyId);

// Get default
const def = await TemplateService.getDefaultTemplate(type, agencyId);

// Get or create default
const template = await TemplateService.getOrCreateDefaultTemplate(type, agencyId);

// Save new
const saved = await TemplateService.saveTemplate(type, agencyId, name, {html, styles}, isDefault);

// Update
const updated = await TemplateService.updateTemplate(id, {name, is_default});

// Delete
await TemplateService.deleteTemplate(id);
```

### RenderService

```typescript
// Render template
const html = RenderService.renderTemplate(templateHtml, data);

// Build data object
const data = RenderService.buildDocumentData(client, reservation, car, payments, settings);

// Extract placeholders
const vars = RenderService.extractPlaceholders(html);

// Validate data
const {valid, missing} = RenderService.validateData(html, data);
```

### PrintService

```typescript
// Print HTML
PrintService.printDocument(title, html, styles);

// Print templated
await PrintService.printTemplatedDocument(title, templateHtml, data, styles);

// Preview
const window = PrintService.openPrintPreview(title, html, styles);

// Check support
const supported = PrintService.isPrintSupported();
```

---

## 🎨 Template Examples

### Simple Contract

```html
<h1>Contrat de Location</h1>
<hr />
<p><strong>Client:</strong> {{client_name}}</p>
<p><strong>Véhicule:</strong> {{car_model}}</p>
<p><strong>Période:</strong> {{start_date}} au {{end_date}}</p>
<p><strong>Montant:</strong> {{total_price}} DA</p>
<hr />
<p>Signature: ___________________</p>
```

### Professional Invoice

```html
<div style="text-align: center; margin-bottom: 20px;">
  <h1>FACTURE</h1>
  <p>N° {{invoice_number}}</p>
  <p>{{invoice_date}}</p>
</div>

<table style="width: 100%; border-collapse: collapse;">
  <tr>
    <td><strong>Client:</strong> {{client_name}}</td>
    <td><strong>Agence:</strong> {{agency_name}}</td>
  </tr>
  <tr>
    <td><strong>Véhicule:</strong> {{car_model}}</td>
    <td><strong>Tél:</strong> {{agency_phone}}</td>
  </tr>
</table>

<hr />

<div style="text-align: right; margin-top: 20px;">
  <p><strong>Montant:</strong> {{amount}} DA</p>
  <p><strong>Conditions:</strong> {{payment_terms}}</p>
</div>
```

---

## ⚙️ Configuration

### Supported Document Types

```typescript
type DocumentType = 
  | 'contrat'      // Contract
  | 'devis'        // Quote
  | 'facture'      // Invoice
  | 'engagement'   // Engagement Letter
  | 'recu'         // Receipt
```

### Component Props

**DynamicDocumentPrinter:**
- `documentType` - Type of document
- `agencyId` - Agency identifier
- `documentData` - Object with client, reservation, car, payments, agencySettings
- `onPrint?` - Callback after printing
- `customTitle?` - Custom document title

**TemplateSelector:**
- `documentType` - Type of document
- `agencyId` - Agency identifier
- `onSelectTemplate` - Called when user selects
- `onClose` - Called when modal closes
- `onEditTemplate?` - Called to edit template
- `onDeleteTemplate?` - Called to delete template

**TemplateSaveModal:**
- `documentType` - Type of document
- `agencyId` - Agency identifier
- `templateHtml` - HTML to save
- `templateStyles?` - CSS styles object
- `onSave` - Called after successful save
- `onClose` - Called when modal closes

---

## 🐛 Troubleshooting

**Print dialog doesn't open:**
- Check if browser is blocking popups
- Ensure `window.open()` isn't blocked

**Template not loading:**
- Verify agency_id is correct
- Check database has templates for this agency
- Check for database errors in console

**Placeholders not rendering:**
- Verify placeholder spelling matches exactly
- Check data object has the required keys
- Use `RenderService.validateData()` to check

**Missing data:**
- Some placeholders may not have values
- System continues with empty values
- Use validation to check before printing

---

## 🔄 Migration from Old System

**Old Way (Removed):**
```typescript
const html = `<h1>Contrat</h1><p>Client: ${client.name}</p>`;
window.open('', '').document.write(html);
```

**New Way:**
```typescript
const data = RenderService.buildDocumentData(client, reservation, car, payments);
await PrintService.printTemplatedDocument('Contrat', templateHtml, data);
```

---

## 📊 Database Schema

```sql
CREATE TABLE document_templates (
  id UUID PRIMARY KEY,
  agency_id UUID NOT NULL,
  template_type TEXT NOT NULL,
  name TEXT NOT NULL,
  template JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Template JSONB Structure:**
```json
{
  "html": "<h1>{{title}}</h1>",
  "styles": {
    "font": "Arial",
    "fontSize": "12px"
  }
}
```

---

## ✅ Checklist

- [ ] Create document_templates table
- [ ] Add TemplateService.ts
- [ ] Add RenderService.ts
- [ ] Add PrintService.ts
- [ ] Add TemplateSelector.tsx
- [ ] Add TemplateSaveModal.tsx
- [ ] Add DynamicDocumentPrinter.tsx
- [ ] Update ReservationDetailsView.tsx
- [ ] Update PlannerPage.tsx
- [ ] Remove hardcoded print functions
- [ ] Test all document types
- [ ] Test template selection
- [ ] Test preview
- [ ] Test error handling

---

## 🆘 Getting Help

1. Check error messages in browser console
2. Review DYNAMIC_PRINTING_SYSTEM.md for detailed docs
3. Check INTEGRATION_EXAMPLES.tsx for code samples
4. Verify database has templates
5. Ensure agency_id is correct

---

**Last Updated:** 2024
**Version:** 1.0
**Status:** Production Ready
