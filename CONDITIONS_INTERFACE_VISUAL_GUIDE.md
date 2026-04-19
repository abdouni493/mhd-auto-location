# 📋 Conditions Printing Interface - Visual Guide

## 🎯 User Interface Flow

### Step 1: Print Menu
When user clicks print on a reservation and selects "Contract":
```
┌─────────────────────────────────────────┐
│  📄 Contrat (Contract)                  │
├─────────────────────────────────────────┤
│  • 📄 Même Modèle (Same Template)      │
│  • 🎨 Personnaliser (Customize)        │
│  • 📋 Personnaliser Conditions         │
│  • 🖨️ Imprimer les Conditions (NEW!)  │ ← NEW BUTTON
└─────────────────────────────────────────┘
```

### Step 2: Conditions Modal Opens
User clicks "🖨️ Imprimer les Conditions":

```
╔══════════════════════════════════════════════════════════════════╗
║                   📋 شروط الإيجار                               ║
║                                                                  ║
║    [العربية] [Français]  ← Language Toggle                    ║
║                                                                  ║
├──────────────────────────────────────────────────────────────────┤
║  يكمك قراءة شروط العقد في الأسفل ومصادقة عليها                ║
║                                                                  ║
║  ┌────────────────────────────────────────────────────────────┐ ║
║  │ 1. السن: يجب أن يكون السانق يبلغ من العمر 20 عامًا...    │ ║
║  │                                                            │ ║
║  │ 2. جواز السفر: إيداع جواز السقر اليومتري الزامي...     │ ║
║  │                                                            │ ║
║  │ 3. الوقود: الوقود يكون على تفقة الزيون              │ ║
║  │                                                            │ ║
║  │ [... remaining 12 conditions ...]                          │ ║
║  │                                                            │ ║
║  └────────────────────────────────────────────────────────────┘ ║
║                                                                  ║
║  ┌──────────────────────┬──────────────────────┐              ║
║  │                      │                      │              ║
║  │  [Signature Line]    │  [Signature Line]    │              ║
║  │  ________________    │  ________________    │              ║
║  │                      │                      │              ║
║  │ امضاء وبصمة الزبون  │ امضاء صاحب وكالة   │              ║
║  └──────────────────────┴──────────────────────┘              ║
║                                                                  ║
│  [🖨️ Imprimer] [Fermer]                                       ║
╚══════════════════════════════════════════════════════════════════╝
```

### Step 3: Language Toggle
Click "Français" button:

```
╔══════════════════════════════════════════════════════════════════╗
║              📋 Conditions Générales de location véhicule        ║
║                                                                  ║
║    [العربية] [Français] ← Now Français is Active              ║
║                                                                  ║
├──────────────────────────────────────────────────────────────────┤
║  Vous pouvez lire les conditions de location...                 ║
║                                                                  ║
║  ┌────────────────────────────────────────────────────────────┐ ║
║  │ 1. Age: Le conducteur doit être âgé au minimum de 20 ans  │ ║
║  │                                                            │ ║
║  │ 2. Passeport: Dépôt obligatoire du passeport biométrique │ ║
║  │                                                            │ ║
║  │ 3. Carburant: Le carburant est à la charge du client.   │ ║
║  │                                                            │ ║
║  │ [... remaining 11 conditions ...]                          │ ║
║  │                                                            │ ║
║  └────────────────────────────────────────────────────────────┘ ║
║                                                                  ║
║  ┌──────────────────────┬──────────────────────┐              ║
║  │                      │                      │              ║
║  │  [Signature Line]    │  [Signature Line]    │              ║
║  │  ________________    │  ________________    │              ║
║  │                      │                      │              ║
║  │ Signature et         │ Signature et scellés│              ║
║  │ empreinte du client  │ de l'Agence         │              ║
║  └──────────────────────┴──────────────────────┘              ║
║                                                                  ║
│  [🖨️ Imprimer] [Fermer]                                       ║
╚══════════════════════════════════════════════════════════════════╝
```

### Step 4: Print Preview
Click "🖨️ Imprimer":

```
╔════════════════════════════════════════════════════════════════════╗
║                     Print Preview Window                          ║
├────────────────────────────────────────────────────────────────────┤
║                                                                    ║
║ ┌──────────────────────────────────────────────────────────────┐  ║
║ │                 PAGE 1: CONDITIONS                           │  ║
║ │                                                              │  ║
║ │  ┌────────────────────────────────────────────────────────┐ │  ║
║ │  │      شروط الإيجار                                    │ │  ║
║ │  │  Conditions Générales de Location Véhicule           │ │  ║
║ │  │                                                        │ │  ║
║ │  │  يكمك قراءة شروط العقد...                           │ │  ║
║ │  │  Vous pouvez lire les conditions...                  │ │  ║
║ │  ├────────────────────────────────────────────────────────┤ │  ║
║ │  │                                                        │ │  ║
║ │  │  1. السن / Age                                       │ │  ║
║ │  │  2. جواز السفر / Passeport                          │ │  ║
║ │  │  3. الوقود / Carburant                              │ │  ║
║ │  │  ... [15 conditions total]                          │ │  ║
║ │  │  15. شروط / Acceptation                             │ │  ║
║ │  │                                                        │ │  ║
║ │  └────────────────────────────────────────────────────────┘ │  ║
║ └──────────────────────────────────────────────────────────────┘  ║
║                     [Page 1 of 2]                                  ║
└────────────────────────────────────────────────────────────────────┘
║                                                                    ║
║ ┌──────────────────────────────────────────────────────────────┐  ║
║ │              PAGE 2: SIGNATURES & ACCEPTANCE                │  ║
║ │                                                              │  ║
║ │                   التوقيعات والتصريحات                  │  ║
║ │                                                              │  ║
║ │  ┌──────────────────────┬──────────────────────┐            │  ║
║ │  │                      │                      │            │  ║
║ │  │  ________________    │  ________________    │            │  ║
║ │  │  (80px height)       │  (80px height)       │            │  ║
║ │  │                      │                      │            │  ║
║ │  │ امضاء وبصمة         │ امضاء صاحب وكالة   │            │  ║
║ │  │ Signature et         │ Signature et scellés│            │  ║
║ │  │ empreinte du client  │ de l'Agence         │            │  ║
║ │  └──────────────────────┴──────────────────────┘            │  ║
║ │                                                              │  ║
║ │         تاريخ الطباعة: 19/04/2026                      │  ║
║ │         Date d'impression: 19/04/2026                    │  ║
║ │                                                              │  ║
║ └──────────────────────────────────────────────────────────────┘  ║
║                     [Page 2 of 2]                                  ║
└────────────────────────────────────────────────────────────────────┘

[Select Printer] [Print] [Cancel] [Save as PDF]
```

---

## 🎨 Design Elements

### Color Scheme
- **Primary Border**: #1a3a52 (Dark Blue)
- **Accent Blue**: #2563eb (Bright Blue)
- **Background**: #f0f7ff (Light Blue)
- **Text**: #333333 (Dark Gray)

### Layout Properties
- **Modal Width**: max-w-4xl (approx. 900px)
- **Conditions Container**: max-h-96 with scrollbar
- **Print Page**: A4 (210mm × 297mm)
- **Direction**: RTL for Arabic, LTR for French

### Spacing
- Header: 20px margin bottom
- Conditions gap: 16px between items
- Signature boxes: 32px gap
- Print margins: 15mm on all sides

---

## ✨ Key Features

### 1. Language Toggle Buttons
- **Arabic Button**: Text "العربية" (Arabic)
- **French Button**: Text "Français" (French)
- **Active State**: Blue background (#2563eb) with white text
- **Inactive State**: Gray background (#d1d5db) with dark text
- **Transition**: Smooth 150ms animation

### 2. Conditions List
- **Numbering**: 1-15 (matches content)
- **Format**: `{number}. {title}: {content}`
- **Border**: Left border for LTR, right border for RTL
- **Border Color**: #1a3a52 (dark blue)
- **Font Size**: 13px regular, bold titles
- **Spacing**: 16px between items

### 3. Signature Area
- **Layout**: 2-column grid
- **Box Style**: Blue border (#2563eb), light background
- **Signature Line**: 80px tall, dark border
- **Labels**: All-caps, bold, 12px

### 4. Print Button
- **Color**: Green (#22c55e) - saas-success
- **Text**: "🖨️ Imprimer" or "🖨️ طباعة"
- **Icon**: Printer emoji
- **Action**: Opens browser print dialog

---

## 📱 Responsive Behavior

### Mobile View (< 640px)
- Modal takes full width with padding
- Language buttons stack or remain horizontal with smaller padding
- Grid for signatures becomes vertical on very small screens
- Scrollable conditions container

### Tablet View (640px - 1024px)
- Modal centered with max-width
- All elements scale proportionally
- Two-column signature layout maintained

### Desktop View (> 1024px)
- Full 900px modal width
- Optimal spacing and typography
- Professional print output

---

## 🖨️ Print Specifications

### Page 1: Conditions
- Title with dark blue color
- Subtitle in italic gray
- Numbered list (1-15)
- Each item has left border
- Light blue background
- Professional typography

### Page 2: Signatures
- Centered title section
- Two-column layout
- Left: Client signature
  - Empty line for signature (80px height)
  - Label below
- Right: Agency signature
  - Empty line for signature (80px height)
  - Label below
- Print date in footer

### Print CSS Features
- `@media print` rules applied
- A4 page size set
- Margins: 0 (handled by print settings)
- Page breaks: Auto between pages
- No gradients (print-friendly)
- Black text only (no color loss)

---

## ✅ Complete Feature Set

| Feature | Status | Details |
|---------|--------|---------|
| Arabic Template | ✅ Complete | 15 conditions with all details |
| French Template | ✅ Complete | 15 conditions with all details |
| Language Toggle | ✅ Complete | Instant switch with UI update |
| Same Design | ✅ Complete | Identical layout/colors both languages |
| RTL Support | ✅ Complete | Proper direction and alignment |
| Print Layout | ✅ Complete | 2-page A4 format |
| No DB Required | ✅ Complete | Constants only, offline capable |
| Professional UI | ✅ Complete | Blue theme, modern design |
| Mobile Responsive | ✅ Complete | Works on all screen sizes |
| Bilingual Labels | ✅ Complete | All UI text in both languages |

---

## 🎉 Ready to Use!

The conditions printing interface is now complete with:
- ✅ Professional constant templates (no database)
- ✅ Both Arabic and French versions
- ✅ Instant language switching
- ✅ Beautiful UI with consistent design
- ✅ Print-ready output on 2 pages
- ✅ All 15 conditions included
- ✅ Proper right-to-left support
- ✅ Mobile responsive
