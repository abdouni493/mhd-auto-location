# 📋 CONDITIONS PRINT & DELETE - VISUAL GUIDE

## 🗑️ Delete Confirmation Dialog

### What You See

```
╔════════════════════════════════════════╗
║  🔴 Red Warning Header               ║
║  ⚠️ Confirmer la suppression         ║
║════════════════════════════════════════║
║                                        ║
║  Êtes-vous sûr de vouloir             ║
║  supprimer cette condition ?           ║
║                                        ║
║  ┌────────────────────────────────┐  ║
║  │ 3. السيارة تُسلم نظيفة...     │  ║
║  │                                │  ║
║  │ (The condition to be deleted) │  ║
║  └────────────────────────────────┘  ║
║                                        ║
║  [Annuler]          [Supprimer]      ║
║   (Cancel)           (Delete)         ║
╚════════════════════════════════════════╝
```

### Bilingual Support

**French:**
```
⚠️ Confirmer la suppression
Êtes-vous sûr de vouloir supprimer cette condition ?
[Annuler] [Supprimer]
```

**Arabic:**
```
⚠️ تأكيد الحذف
هل أنت متأكد من رغبتك في حذف هذا الشرط؟
[إلغاء] [حذف]
```

---

## 🖨️ Print Output - Single Page Layout

### FULL PAGE PREVIEW

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║              📋 CONDITIONS DE LOCATION                            ║
║              Conditions générales                                 ║
║ ─────────────────────────────────────────────────────────────    ║
║                                                                   ║
║ CLAUSES PRINCIPALES:                                             ║
║                                                                   ║
║ ┌─────────────────────────┬─────────────────────────────┐       ║
║ │ 1. Age Requirement     │ 2. Documentation            │       ║
║ │ The driver must be at  │ Deposit of biometric        │       ║
║ │ least 20 years old     │ passport + initial          │       ║
║ │ with valid license     │ insurance 30,000.00 DA      │       ║
║ ├─────────────────────────┼─────────────────────────────┤       ║
║ │ 3. Fuel Policy         │ 4. Payment Terms            │       ║
║ │ Fuel costs are the     │ Payment must be made in     │       ║
║ │ responsibility of the  │ cash upon vehicle delivery  │       ║
║ │ customer               │                             │       ║
║ ├─────────────────────────┼─────────────────────────────┤       ║
║ │ 5. Cleanliness         │ 6. Insurance                │       ║
║ │ Vehicle delivered      │ Insurance is mandatory      │       ║
║ │ clean and must be      │ Additional options          │       ║
║ │ returned in same       │ available on request        │       ║
║ │ condition or 1000 DA   │                             │       ║
║ │ cleaning fee           │                             │       ║
║ └─────────────────────────┴─────────────────────────────┘       ║
║                                                                   ║
║ ┌──────────────────────────┬──────────────────────────────┐     ║
║ │ 👤 CLIENT               │ 🏢 AGENCE                   │     ║
║ │                         │                             │     ║
║ │ ________________        │ ┌─────────────────────────┐ │     ║
║ │ (Sign here)             │ │    [CACHET/ختم]         │ │     ║
║ │                         │ │  (Seal goes here)       │ │     ║
║ │                         │ │                         │ │     ║
║ │                         │ └─────────────────────────┘ │     ║
║ │ Date: _________         │ _______________________     │     ║
║ └──────────────────────────┴──────────────────────────────┘     ║
║                                                                   ║
║ Généré le 24/03/2026                                             ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## 📐 Layout Specifications

### Page Size
- **Format**: A4 (210mm × 297mm)
- **Orientation**: Portrait
- **Margins**: 12mm all sides
- **Usable Area**: 186mm × 273mm

### Section Heights
```
Header:              15mm
Conditions Grid:    100mm
Signatures:         40mm
Footer:             10mm
─────────────────────────
TOTAL:            165mm
(With spacing)    175mm fits perfectly on A4
```

### Column Layout (Conditions)
```
┌─ Container Width: 186mm ──────────────────┐
│                                           │
│ ┌─────────────┐      ┌─────────────┐   │
│ │  Column 1   │ Gap  │  Column 2   │   │
│ │   91mm      │ 4mm  │   91mm      │   │
│ └─────────────┘      └─────────────┘   │
│                                           │
└──────────────────────────────────────────┘
```

---

## 🎨 Color Scheme

### Print Colors
```
Header Border:      #2563eb (Professional Blue)
Condition Background: #f0f7ff (Light Blue)
Text Primary:       #2c3e50 (Dark Slate)
Text Secondary:     #666666 (Gray)
Borders:            #ddd (Light Gray)
```

### Modal Colors (Delete Confirmation)
```
Background:         rgba(0,0,0,0.5) (Overlay)
Modal Background:   #ffffff (White)
Header:             #fee2e2 (Light Red)
Warning Text:       #7f1d1d (Dark Red)
Cancel Button:      #d1d5db (Gray)
Delete Button:      #dc2626 (Red)
```

---

## 📋 Detailed Print Page

### Header Section (Top 15mm)
```
────────────────────────────────────────
  📋 CONDITIONS DE LOCATION
  Conditions générales
────────────────────────────────────────
     (Blue border: 3px)
```

### Conditions Grid (Middle 100mm)
```
CLAUSES PRINCIPALES:

┌─────────────────────┬─────────────────────┐
│ Box 1               │ Box 2               │
│ 7px padding         │ 7px padding         │
│ 2px left border     │ 2px left border     │
│ (Blue #2563eb)      │ (Blue #2563eb)      │
│ Background: #f0f7ff │ Background: #f0f7ff │
│ Font: 10px          │ Font: 10px          │
└─────────────────────┴─────────────────────┘

┌─────────────────────┬─────────────────────┐
│ Box 3               │ Box 4               │
│ ...same styling...  │ ...same styling...  │
└─────────────────────┴─────────────────────┘

┌─────────────────────┬─────────────────────┐
│ Box 5               │ Box 6               │
│ ...same styling...  │ ...same styling...  │
└─────────────────────┴─────────────────────┘
```

### Signatures Section (Bottom 40mm)
```
┌─────────────────────┬─────────────────────┐
│ LEFT: CLIENT        │ RIGHT: AGENCY       │
│                     │                     │
│ 👤 CLIENT           │ 🏢 AGENCE           │
│                     │                     │
│  ___________        │  ┌───────────────┐ │
│  Signature Line     │  │  [Cachet Box] │ │
│  (40px height)      │  │               │ │
│                     │  │  Dashed 2px   │ │
│ Date: _______       │  │  Border       │ │
│                     │  │               │ │
│                     │  └───────────────┘ │
│                     │ _________________  │
└─────────────────────┴─────────────────────┘
```

### Footer Section (Bottom 10mm)
```
────────────────────────────────────────
       Généré le 24/03/2026
────────────────────────────────────────
     (Gray border: 1px top)
     (Gray text: 9px)
```

---

## 🌍 Arabic Version Layout

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║              📋 شروط التأجير                                     ║
║              الشروط العامة                                       ║
║ ─────────────────────────────────────────────────────────────    ║
║                                                                   ║
║ الشروط الرئيسية:                                                 ║
║                                                                   ║
║ ┌─────────────────────────┬─────────────────────────────┐       ║
║ │ 1. السن: يجب أن يكون  │ 2. جواز السفر: إيداع      │       ║
║ │ السائق 20 عاماً على    │ جواز السفر البيومتري       │       ║
║ │ الأقل...               │ + تأمين ابتدائي...       │       ║
║ ├─────────────────────────┼─────────────────────────────┤       ║
║ │ 3. الوقود: الوقود على  │ 4. الدفع: يتم الدفع       │       ║
║ │ نفقة الزبون             │ نقداً عند تسليم          │       ║
║ │                         │ السيارة                     │       ║
║ ├─────────────────────────┼─────────────────────────────┤       ║
║ │ 5. النظافة: السيارة    │ 6. التأمين: التأمين       │       ║
║ │ تُسلم نظيفة...         │ إلزامي...               │       ║
║ └─────────────────────────┴─────────────────────────────┘       ║
║                                                                   ║
║ ┌──────────────────────────┬──────────────────────────────┐     ║
║ │ 🏢 الوكالة              │ 👤 العميل               │     ║
║ │                         │                             │     ║
║ │ ┌─────────────────────┐ │ ________________           │     ║
║ │ │    [ختم/Cachet]     │ │ (التوقيع هنا)            │     ║
║ │ │  (الختم يذهب هنا)   │ │                             │     ║
║ │ │                     │ │ التاريخ: _________         │     ║
║ │ └─────────────────────┘ │                             │     ║
║ │ _______________________  │                             │     ║
║ └──────────────────────────┴──────────────────────────────┘     ║
║                                                                   ║
║ تم الإنشاء في 24/03/2026                                        ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## 🖨️ Printing Instructions

### Paper Setup
1. Set paper size to **A4** (210×297mm)
2. Set orientation to **Portrait**
3. Set margins to **Normal** (approximately 20-25mm)

### Print Settings
- **Color**: Recommended (Blue colors look better)
- **Quality**: Standard or High
- **Scaling**: None (Fit to page)
- **Paper type**: Standard white paper

### File Export
- **Format**: PDF
- **Quality**: 300 DPI recommended
- **Color**: RGB or CMYK

---

## ✅ Print Quality Checklist

Before printing, verify:
- ✅ All conditions visible
- ✅ Both columns aligned properly
- ✅ Client signature area clear
- ✅ Agency seal box visible
- ✅ Date fields present
- ✅ Footer shows generation date
- ✅ Blue colors print correctly
- ✅ Text is readable (10px minimum)

---

## 🎯 Print Dimensions

### A4 Page (210×297mm)
```
Top Margin:       12mm
┌─────────────────────────────────────┐
│  Header (15mm)                      │
├─────────────────────────────────────┤
│  Conditions Grid (100mm)            │
├─────────────────────────────────────┤
│  Signatures Section (40mm)          │
├─────────────────────────────────────┤
│  Footer (10mm)                      │
│                                     │
│  Spacing: ~5mm                      │
└─────────────────────────────────────┘
Bottom Margin:    12mm

Total Height:    ~185mm (fits perfectly!)
```

