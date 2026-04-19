# 📋 Personnaliser les Conditions - New Interface Visual Guide

## 🎨 New Interface Layout

```
╔════════════════════════════════════════════════════════════════════════╗
║                       CONDITIONS PERSONALIZER                         ║
║                                                                        ║
║  ┌──────────────────────────────────────┐                  [×]        ║
║  │ 📋 شروط الإيجار                     │                            ║
║  │ (Conditions de Location)              │                            ║
║  │                                       │                            ║
║  │ يكمك قراءة شروط العقد في الأسفل... │                            ║
║  │ (Vous pouvez lire les conditions...) │                            ║
║  └──────────────────────────────────────┘                            ║
║                                                                        ║
║  ┌────────────────┬─────────────────────────┐                        ║
║  │  [العربية]    │  [Français]             │                        ║
║  │  (Active)      │  (Inactive)             │                        ║
║  └────────────────┴─────────────────────────┘                        ║
║                                                                        ║
║  ┌────────────────────────────────────────────────────────────────┐  ║
║  │  CONDITIONS (Scrollable)                                       │  ║
║  ├────────────────────────────────────────────────────────────────┤  ║
║  │ ▌ 1. السن: يجب أن يكون السائق 20 عاماً على الأقل...       │  ║
║  │    (Age: The driver must be at least 20 years old...)          │  ║
║  │                                                                │  ║
║  │ ▌ 2. جواز السفر: إيداع جواز السقر البيومتري الزامي...     │  ║
║  │    (Passport: Mandatory biometric passport deposit...)         │  ║
║  │                                                                │  ║
║  │ ▌ 3. الوقود: الوقود يكون على تفقة الزيون               │  ║
║  │    (Fuel: Fuel is at the client's expense...)                 │  ║
║  │                                                                │  ║
║  │ [... 12 more conditions ...]                                  │  ║
║  │                                                                │  ║
║  └────────────────────────────────────────────────────────────────┘  ║
║                                                                        ║
║  ┌──────────────────────┬──────────────────────┐                    ║
║  │   SIGNATURES          │                      │                    ║
║  ├───────────────────────┼──────────────────────┤                    ║
║  │                       │                      │                    ║
║  │  ________________     │  ________________    │                    ║
║  │  (80px height)        │  (80px height)       │                    ║
║  │                       │                      │                    ║
║  │ امضاء وبصمة الزبون   │ امضاء صاحب وكالة   │                    ║
║  │ Signature du Client   │ Cachet d'Agence     │                    ║
║  └───────────────────────┴──────────────────────┘                    ║
║                                                                        ║
║  ℹ️ هذه الشروط نماذج ثابتة. لا يمكن تعديلها...                   ║
║     (These conditions are constant templates. Cannot be modified...)  ║
║                                                                        ║
║  ┌────────────────────────────────────────────────────────┐          ║
║  │             [Fermer] [🖨️ Imprimer]                    │          ║
║  │             (Close)  (Print)                           │          ║
║  └────────────────────────────────────────────────────────┘          ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝
```

---

## 🎯 User Interactions

### 1. **Opening the Modal**

```
Planner Page
    ↓
Click "📋 Personnaliser les Conditions"
    ↓
Modal Opens
    ├─ Title displays in user's language
    ├─ Subtitle displays from template
    ├─ All 15 conditions load with animations
    ├─ Language buttons show (Arabic active by default for 'ar' users)
    └─ Signature areas display
```

### 2. **Switching Languages**

```
User clicks "Français"
    ↓
Active state changes to "Français" button
    ├─ Button background: Gray → Blue
    ├─ Button text: Dark Gray → White
    ├─ Shadow effect added
    └─ Modal content animates to French

Content Updates:
├─ Title: شروط الإيجار → Conditions Générales de location
├─ Subtitle: Arabic → French
├─ All 15 conditions: Arabic → French
├─ Signature labels: Arabic → French
├─ Information box: Arabic → French
└─ Button labels: Arabic → French
```

### 3. **Printing**

```
User clicks "🖨️ Imprimer"
    ↓
generateConditionsPrintHTML(language) called
    ├─ Creates professional 2-page HTML
    ├─ Uses current language (Arabic or French)
    ├─ Includes A4 sizing
    ├─ Includes print CSS
    └─ Includes signatures section

Print Window Opens
    ├─ Page 1: Conditions with numbering
    ├─ Page 2: Signatures and acceptance
    └─ User selects printer and prints
```

---

## 🎨 Color Scheme

| Element | Color | Hex Code | Usage |
|---------|-------|----------|-------|
| Primary Border | Dark Blue | #1a3a52 | Condition borders, titles |
| Active Button | Bright Blue | #2563eb | Language toggle active state |
| Card Border | Light Blue | #2563eb | Conditions container border |
| Background Light | Light Blue | #f0f7ff | Conditions container background |
| Text Primary | Dark Gray | #333333 | Main content |
| Text Secondary | Medium Gray | #666666 | Subtitles |
| Text Muted | Light Gray | #999999 | Inactive elements |
| Button Success | Green | #22c55e | Print button |
| Button Default | Gray | #999999 | Close button |

---

## 📱 Responsive Behavior

### Mobile (< 640px)
```
┌─────────────────────┐
│ Title & Subtitle    │
│ [Language Buttons]  │
│ [Conditions List]   │
│ (Full Width)        │
│                     │
│ [Signature Areas]   │
│ (Stacked 1 col)     │
│                     │
│ [Close] [Print]     │
│ (Full Width)        │
└─────────────────────┘
```

### Tablet (640px - 1024px)
```
┌──────────────────────────────┐
│ Title & Close Button         │
│ Subtitle                     │
│ [Language Buttons]           │
│ [Conditions List]            │
│ (Max 600px)                  │
│                              │
│ [Sig Left] [Sig Right] (2 col)
│ [Print] [Close] (Right Align)
└──────────────────────────────┘
```

### Desktop (> 1024px)
```
┌────────────────────────────────────────┐
│ Title & Close                          │
│ Subtitle                               │
│ [Language Buttons] (Centered)          │
│ [Conditions List]                      │
│ (900px max width)                      │
│                                        │
│ [Signature] [Signature] (2 col)        │
│ [Print] [Close] (Right Aligned)        │
└────────────────────────────────────────┘
```

---

## ✨ Animation Details

### Modal Entry
```
Initial State:
├─ Opacity: 0%
├─ Scale: 90%
└─ Y Position: -20px

Animation:
├─ Duration: 300ms
├─ Easing: smooth
└─ Final State: Visible & Centered
```

### Conditions List
```
Each Condition:
├─ Opacity: 0% → 100%
├─ X Position: -20px → 0px (LTR)
│           or 20px → 0px (RTL)
├─ Delay: index * 50ms
└─ Duration: 500ms
```

### Language Toggle
```
Button Change:
├─ Background: Instant
├─ Text Color: Instant
├─ Shadow: Fade In
└─ Duration: 200ms
```

---

## 🔄 State Management

```typescript
// Current Language
conditionsLanguage: 'ar' | 'fr'

// Derived Values
template = getConditionsTemplate(conditionsLanguage)
isArabic = conditionsLanguage === 'ar'
dir = isArabic ? 'rtl' : 'ltr'
textAlign = isArabic ? 'right' : 'left'
```

---

## 📊 Features at a Glance

| Feature | Status | Notes |
|---------|--------|-------|
| Display Conditions | ✅ | 15 items with animations |
| Language Toggle | ✅ | Instant switch |
| Print Support | ✅ | Professional 2-page output |
| RTL/LTR | ✅ | Full text direction support |
| Mobile Responsive | ✅ | All breakpoints covered |
| Animations | ✅ | Smooth motion effects |
| Bilingual UI | ✅ | All text in both languages |
| Edit Conditions | ❌ | By design (constant templates) |
| Delete Conditions | ❌ | By design (constant templates) |
| Custom Formatting | ❌ | By design (constant templates) |

---

## 🎉 User Experience

### Pros
✅ **Clean Interface** - No clutter, focused experience  
✅ **Fast Loading** - No database queries  
✅ **Consistent** - Same for all users  
✅ **Professional** - Modern design  
✅ **Accessible** - Bilingual & mobile-friendly  
✅ **Reliable** - No edit errors possible  

### Limitations (By Design)
❌ Cannot modify conditions  
❌ Cannot add custom conditions  
❌ Cannot delete conditions  
❌ Cannot change formatting  

---

## 🚀 Getting Started

### For Users
1. Click "📋 Personnaliser les Conditions" in print menu
2. View conditions in default language
3. Click language button to switch
4. Click "🖨️ Imprimer" to print
5. Click "Fermer" to close

### For Developers
```typescript
// Import the component
import { ConditionsPersonalizer } from './ConditionsPersonalizer';

// Use it in your page
<ConditionsPersonalizer
  lang={lang}
  reservationId={reservationId}
  onClose={() => setShowModal(false)}
  onSave={(conditions) => handleSave(conditions)}
/>
```

---

## ✅ Complete!

The Conditions Personalizer has been successfully redesigned with:
- ✅ Clean, professional interface
- ✅ Constant template display
- ✅ Instant language switching
- ✅ Professional printing
- ✅ Full responsiveness
- ✅ Smooth animations
- ✅ Better user experience

**Ready for production! 🎊**
