# Document Template System - Visual Guide & Setup

## 🎨 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    LuxDrive Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            BillingPage Component                     │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  Template Customization Section (Purple)    │  │   │
│  │  │  [Contrat] [Devis] [Facture] [Reçu] [...]  │  │   │
│  │  └──────────────────┬───────────────────────────┘  │   │
│  │                     │                               │   │
│  │            ┌────────▼────────┐                      │   │
│  │            │ Editor Button    │                      │   │
│  │            │ Clicked          │                      │   │
│  │            └────────┬─────────┘                      │   │
│  └─────────────────────┼──────────────────────────────┘   │
│                        │                                    │
├────────────────────────┼────────────────────────────────────┤
│                        │                                    │
│  ┌─────────────────────▼─────────────────────────────┐   │
│  │     DocumentTemplateEditor Modal                  │   │
│  ├─────────────────────────────────────────────────┤   │
│  │                                                 │   │
│  │ ┌─────────────────────┐   ┌──────────────────┐ │   │
│  │ │                     │   │                  │ │   │
│  │ │  Canvas Preview     │   │  Sidebar Editor  │ │   │
│  │ │  (Drag & Drop)      │   │ ┌──────────────┐ │ │   │
│  │ │                     │   │ │ Field List   │ │ │   │
│  │ │  ┌──────────────┐   │   │ │ Color Picker │ │ │   │
│  │ │  │ Title        │   │   │ │ Font Size    │ │ │   │
│  │ │  │[draggable]   │   │   │ │ Add Custom   │ │ │   │
│  │ │  └──────────────┘   │   │ │ Delete Field │ │ │   │
│  │ │  ┌──────────────┐   │   │ └──────────────┘ │ │   │
│  │ │  │ Client Name  │   │   │                  │ │   │
│  │ │  │[draggable]   │   │   │ [Save] [Reset]   │ │   │
│  │ │  └──────────────┘   │   │                  │ │   │
│  │ │       ...           │   │                  │ │   │
│  │ │                     │   │                  │ │   │
│  │ └─────────────────────┘   └──────────────────┘ │   │
│  │                                                 │   │
│  │ ┌──────────────────────────────────────────┐  │   │
│  │ │ [Save Changes] [Reset] [Cancel]          │  │   │
│  │ └──────────────────────────────────────────┘  │   │
│  │                                                 │   │
│  └──────────────────────┬──────────────────────────┘   │
│                         │                               │
│                    Save to DB                           │
│                         │                               │
├────────────────────────┼────────────────────────────────┤
│                        │                                │
│  ┌─────────────────────▼─────────────────────────┐   │
│  │    DocumentTemplateService (Service Layer)    │   │
│  ├─────────────────────────────────────────────┤   │
│  │                                             │   │
│  │  • getDocumentTemplates()                   │   │
│  │  • updateDocumentField()                    │   │
│  │  • addCustomTextField()                     │   │
│  │  • resetDocumentType()                      │   │
│  │  • getAgencySettings()                      │   │
│  │                                             │   │
│  └──────────────────────┬──────────────────────┘   │
│                         │                           │
│                    Query/Update                     │
│                         │                           │
├────────────────────────┼───────────────────────────┤
│                        │                           │
│  ┌─────────────────────▼──────────────────────┐  │
│  │  Supabase Database (PostgreSQL)            │  │
│  ├────────────────────────────────────────────┤  │
│  │                                            │  │
│  │  Table: agency_settings                   │  │
│  │  Column: document_templates (JSONB)       │  │
│  │                                            │  │
│  │  {                                         │  │
│  │    "contrat": { "title": {...}, ... },    │  │
│  │    "devis": { "title": {...}, ... },      │  │
│  │    "facture": { "title": {...}, ... }     │  │
│  │  }                                         │  │
│  │                                            │  │
│  └────────────────────────────────────────────┘  │
│                                                   │
└───────────────────────────────────────────────────┘
```

## 🔄 User Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│         USER WANTS TO CUSTOMIZE DOCUMENT LAYOUT             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Opens Billing Page        │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │  Finds "Template Customization"    │
        │  Section (Purple Panel)            │
        └────────────┬──────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────────┐
        │  Clicks Document Type Button         │
        │  (e.g., "Facture")                   │
        └────────────┬─────────────────────────┘
                     │
                     ▼
        ┌───────────────────────────────────┐
        │  Editor Modal Opens                │
        │  Shows Canvas Preview              │
        └────────────┬──────────────────────┘
                     │
              ┌──────┴──────┬─────────┐
              │             │         │
              ▼             ▼         ▼
        Reposition    Change     Add Custom
        Fields        Colors     Fields
              │             │         │
              └──────┬──────┴─────────┘
                     │
                     ▼
        ┌──────────────────────────┐
        │  Clicks "Save Changes"   │
        └────────────┬─────────────┘
                     │
                     ▼
        ┌──────────────────────────────┐
        │  Saves to Database           │
        │  (Supabase JSONB)            │
        └────────────┬─────────────────┘
                     │
                     ▼
        ┌──────────────────────────────┐
        │  Modal Closes                │
        │  Template Applied            │
        └──────────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────┐
        │  When User Prints Document   │
        │  Saved Layout Is Applied     │
        │  Fields Use Custom Positions │
        │  Colors & Sizes              │
        └──────────────────────────────┘
```

## 🎯 Component Relationships

```
BillingPage
│
├─ State Management
│  ├─ editingDocumentType: DocumentType | null
│  ├─ showTemplateEditor: boolean
│  └─ showDocumentRenderer: boolean
│
├─ Event Handlers
│  ├─ handleEditTemplate(docType)
│  ├─ handleRenderDocument(docType)
│  └─ handleSave()
│
├─ UI Sections
│  ├─ Header (gradient, search)
│  ├─ Stats Cards
│  ├─ Filters
│  ├─ Template Customization Panel ◄─── NEW SECTION
│  │  └─ Document Type Buttons
│  │     ├─ [Contrat]
│  │     ├─ [Devis]
│  │     ├─ [Facture]
│  │     ├─ [Reçu]
│  │     └─ [Engagement]
│  ├─ Invoices Grid
│  └─ Modals
│
└─ Child Components
   ├─ DocumentTemplateEditor
   │  ├─ Canvas (Preview Area)
   │  │  └─ Draggable Field Elements
   │  ├─ Sidebar
   │  │  ├─ Add Custom Field Form
   │  │  ├─ Field Editor Panel
   │  │  │  ├─ Position X/Y Sliders
   │  │  │  ├─ Color Picker
   │  │  │  ├─ Font Size Slider
   │  │  │  └─ Custom Text Input
   │  │  └─ Field List
   │  └─ Footer
   │     ├─ [Reset to Default]
   │     ├─ [Cancel]
   │     └─ [Save Changes]
   │
   └─ DocumentRenderer
      ├─ Document Preview
      │  ├─ White Background
      │  ├─ Absolute Positioned Fields
      │  └─ Field Values from Invoice
      ├─ Edit Template Link
      └─ [Print Document] Button
```

## 📊 Data Structure Visualization

### Template Data Format
```
agency_settings
│
└─ document_templates (JSONB)
   │
   ├─ contrat
   │  ├─ title
   │  │  ├─ x: 120
   │  │  ├─ y: 40
   │  │  ├─ color: "#000000"
   │  │  ├─ fontSize: 24
   │  │  └─ fontWeight: "normal"
   │  ├─ client_name
   │  │  ├─ x: 80
   │  │  ├─ y: 140
   │  │  └─ color: "#000000"
   │  └─ ...more fields
   │
   ├─ devis
   │  └─ ...similar structure
   │
   ├─ facture
   │  └─ ...similar structure
   │
   ├─ recu
   │  └─ ...similar structure
   │
   └─ engagement
      └─ ...similar structure
```

## 🎬 Feature Interaction Flow

```
Drag & Drop Fields
──────────────────
User clicks field → Set dragging state
User moves mouse → Update field position in real-time
User releases → Position persists in local state
Click Save → Sent to database via DocumentTemplateService

Color Customization
───────────────────
User clicks field → Select field
User opens color picker → Show hex input + color wheel
User selects color → Update field.color in state
Canvas updates → Real-time preview
Click Save → Sent to database

Font Size Adjustment
────────────────────
User clicks field → Select field
User moves slider → Update field.fontSize
Canvas updates → Real-time preview
Click Save → Sent to database

Add Custom Field
────────────────
User types field name → Input validation
User clicks Add → Create new field with default position
Field appears on canvas → Appears in field list
User positions & styles → Edit as needed
Click Save → Sent to database

Delete Field
────────────
User selects field → Shows in editor panel
User clicks Delete → Only for custom fields
Field removed from template → Real-time update
Click Save → Deletion persisted to database

Reset Template
──────────────
User clicks Reset → Show confirmation
Confirm → Load default template
Canvas updates → Show all default fields
No Save needed → Immediate reset

Save Process
────────────
User clicks Save → Disable button
Prepare data → Gather all field changes
Call DocumentTemplateService.updateDocumentType()
Wait for response → Show loading indicator
Save successful → Close modal, show success
Save failed → Show error message, keep open
```

## 🎨 UI Layout Diagram (DocumentTemplateEditor)

```
┌─────────────────────────────────────────────────────────────────┐
│ Customize FACTURE Template                            [X] Close   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────┐  ┌──────────────────┐  │
│  │  Canvas Preview                    │  │  Sidebar Editor  │  │
│  │  (Drag & Drop Area)                │  │                  │  │
│  │                                    │  │  Add Custom Text │  │
│  │  ┌──────────────────────────────┐ │  │  ┌────────────┐  │  │
│  │  │ White Document Background    │ │  │  │ Field name │  │  │
│  │  │                              │ │  │  └────────────┘  │  │
│  │  │  ┌──────────────────────┐   │ │  │  [Add Field]     │  │
│  │  │  │ Title                │   │ │  │                  │  │
│  │  │  │ [drag to move]       │   │ │  │ ─────────────── │  │
│  │  │  └──────────────────────┘   │ │  │                  │  │
│  │  │  ┌──────────────────────┐   │ │  │ Field Editor:    │  │
│  │  │  │ Invoice Number       │   │ │  │                  │  │
│  │  │  │ [drag to move]       │   │ │  │ Position X: ───┐ │  │
│  │  │  └──────────────────────┘   │ │  │             [====] │  │
│  │  │  ┌──────────────────────┐   │ │  │                  │  │
│  │  │  │ Client Name          │   │ │  │ Position Y: ───┐ │  │
│  │  │  │ [drag to move]       │   │ │  │             [====] │  │
│  │  │  └──────────────────────┘   │ │  │                  │  │
│  │  │       ... more fields ...   │ │  │ Color:          │  │
│  │  │                              │ │  │ [████] #000000  │  │
│  │  └──────────────────────────────┘ │  │                  │  │
│  │                                    │  │ Font Size: ───┐ │  │
│  │                                    │  │            [====] │  │
│  └────────────────────────────────────┘  │                  │  │
│                                           │ [Delete Field]   │  │
│                                           │                  │  │
│  ┌────────────────────────────────────┐  │ ─────────────── │  │
│  │ Default Fields List                │  │                  │  │
│  │ ✓ title                            │  │ Fields:         │  │
│  │ ✓ invoice_number (selected)        │  │ □ title         │  │
│  │ ✓ invoice_date                     │  │ ✓ invoice_number│  │
│  │ ✓ client_name                      │  │ □ invoice_date  │  │
│  │ ✓ car_model                        │  │ □ client_name   │  │
│  │ ✓ amount_due                       │  │ □ car_model     │  │
│  │ ✓ payment_terms                    │  │ □ amount_due    │  │
│  │                                    │  │ □ payment_terms │  │
│  └────────────────────────────────────┘  └──────────────────┘  │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│ [Reset to Default]  [Cancel]                  [Save Changes]    │
└─────────────────────────────────────────────────────────────────┘
```

## 📱 Responsive Design

```
Desktop (>1024px)
├─ 2/3 width: Canvas
└─ 1/3 width: Sidebar

Tablet (768px - 1024px)
├─ 60% width: Canvas
└─ 40% width: Sidebar

Mobile (<768px)
├─ Stacked layout
├─ Canvas: 100% width
├─ Sidebar: Below canvas
└─ Horizontal scroll on canvas
```

## 🔗 Integration Points

```
BillingPage Component
│
├─ Imports
│  ├─ DocumentTemplateEditor
│  ├─ DocumentRenderer
│  └─ DocumentType from types
│
├─ Uses
│  ├─ DocumentTemplateEditor when showTemplateEditor = true
│  ├─ DocumentRenderer when showDocumentRenderer = true
│  └─ Passes invoice data to renderer
│
└─ Handlers
   ├─ handleEditTemplate(docType)
   └─ handleRenderDocument(docType)
```

---

## ✨ Quick Visual Reference

| Element | Purpose | Visual |
|---------|---------|--------|
| Purple Panel | Template Controls | 🟪 Customization Section |
| Buttons | Document Types | [Contrat][Devis][Facture] |
| Modal | Editor Interface | Pop-up with canvas & sidebar |
| Canvas | Preview Area | White background, draggable fields |
| Sidebar | Tools Panel | Color, font, add/delete controls |
| Sliders | Position/Size | Ranges for X, Y, fontSize |

---

This visual guide provides a comprehensive overview of the system architecture, user workflows, and component interactions for the Document Template Personalization System.
