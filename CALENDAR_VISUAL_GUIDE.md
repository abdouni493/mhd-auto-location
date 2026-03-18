# 🎨 Calendar & Timeline Feature - Visual Guide

## 📋 Quick Start

### Accessing the Calendar View
1. Open the **Planificateur** (Scheduler) page
2. Click the **📅 Calendrier** button in the top-right control bar
3. You'll see the calendar with your reservations displayed in different colors

---

## 🎯 Main Views

### View 1: Month Calendar
```
┌─────────────────────────────────────────────────────────┐
│         📅 Vue Calendrier      [Mois] [Semaine] [Auj.] │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ◄  MARS 2026  ►                                        │
├─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Lun │ Mar │ Mer │ Jeu │ Ven │ Sam │ Dim │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│     │     │     │     │     │  1  │  2  │  ← Empty days
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  3  │  4  │  5  │  6  │  7  │  8  │  9  │
│     │ [👤]│     │ [🚗]│[👤] │[🚗] │     │  ← Reservations
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 10  │ 11  │ 12 ⭐│ 13  │ 14  │ 15  │ 16  │  ← Today (Green)
│[👤] │[🚗] │[👤] │     │ +2  │     │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

**Features:**
- ✅ Color-coded reservations
- ✅ Hover to see reservation preview
- ✅ Click to view full details
- ✅ Today button highlights current date
- ✅ Navigate months with ◄ and ►

---

### View 2: Week Timeline
```
┌───────────────────────────────────────────────────────────┐
│  📅 Vue Calendrier  │ Semaine du 10 mars 2026 au 16 mars │
└───────────────────────────────────────────────────────────┘

┌────────┬────────┬────────┬────────┬────────┬────────┬────────┐
│  Lun   │  Mar   │  Mer   │  Jeu   │  Ven   │  Sam   │  Dim   │
│  10    │  11    │  12 ⭐ │  13    │  14    │  15    │  16    │
├────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│┌──────┐│┌──────┐│┌──────┐│        │┌──────┐│        │┌──────┐│
││ Kani ││ Yusuf ││ Fatima││        ││ Ahmed ││        ││ Layla ││
││ 🚗   ││ 🚗    ││ 🚗    ││        ││ 🚗    ││        ││ 🚗    ││
││ 3days││ 5days ││ 7days ││        ││ 2days ││        ││ 4days ││
│└──────┘│└──────┘│└──────┘│        │└──────┘│        │└──────┘│
└────────┴────────┴────────┴────────┴────────┴────────┴────────┘
```

**Features:**
- ✅ 7-day week view
- ✅ Large reservation cards
- ✅ Client avatar visible
- ✅ Car and duration info
- ✅ Easy to read layout

---

## 🎨 Reservation Card Design

### Calendar View Card (Week)
```
┌──────────────────────────────────────────┐
│ 🟦 Gradient Background (Blue → Blue)     │
│                                          │
│  👤  Kani Ahmed                          │  ← Client
│       📱 +213 123 456 789                │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ 🚗 Toyota Corolla                  │  │  ← Car
│  │ 🏷️ ABC-123-DZ                      │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ⏱️  7 days                              │  ← Duration
│                                          │
└──────────────────────────────────────────┘
  (Click to view full details)
```

### Color-Coded System
```
🔵 Blue:      #3B82F6 → #2563EB
🟣 Purple:    #A855F7 → #7C3AED
🔴 Pink:      #EC4899 → #DB2777
🟢 Green:     #10B981 → #059669
🟠 Orange:    #F97316 → #EA580C
🔷 Teal:      #14B8A6 → #0D9488
🔹 Cyan:      #06B6D4 → #0891B2
🟦 Indigo:    #6366F1 → #4F46E5
🟨 Amber:     #F59E0B → #D97706
🔶 Rose:      #F43F5E → #E11D48
```

Each reservation gets a unique color automatically!

---

## 🎬 Animations & Interactions

### Month View Interactions
```
User hovers over date
    ↓
Card expands slightly (scale: 1.02)
Shadow increases
Border brightens
    ↓
User clicks date
    ↓
Selected day highlighted in blue
All reservations for that day visible
```

### Week View Interactions
```
User hovers over reservation
    ↓
Card scales up (1.02x)
Shadow increases
Color deepens
    ↓
User clicks reservation
    ↓
Opens Reservation Details View
Shows full client & car info
```

---

## 🎛️ Control Panel

### Button Layout
```
┌─────────────────────────────────────────────────────────┐
│  [Search...] [Filter ▼] [🟣 Calendrier] [➕ Nouvelle Res.] │
└─────────────────────────────────────────────────────────┘
        │          │              │              │
    Search    Status Filter    Switch View    Create New
    Clients        (All/Pending   (Grid ↔
    & Vehicles     /Active/etc)   Calendar)
```

### In Calendar View
```
┌──────────────────────────────────────────────────────────┐
│  📅 Vue Calendrier                   [Mois][Semaine][Auj.] │
├──────────────────────────────────────────────────────────┤
│  Calendar Grid / Week Display...                          │
│                                                            │
│  [📋 Légende]                                              │
│  ◻️ Jour actuel (Green)  ◻️ Jour sélectionné (Blue)       │
│  ◻️ Réservation (Gradient)                                │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
        [Retour à Vue Liste] ← Back button
```

---

## 📱 Responsive Design

### Desktop (Full Width)
```
7-column calendar grid
OR
7-column week view side-by-side
```

### Tablet (Medium Screen)
```
4-5 column calendar grid
OR
3-4 column week view
```

### Mobile (Small Screen)
```
Single column calendar
OR
Single column week view (scroll vertically)
```

---

## 🔄 Flow: From List to Calendar and Back

```
List View (Default)
    ↓
    User clicks [📅 Calendrier] button
    ↓
Calendar View Opens (Month by default)
    ↓
    User can:
    ├─ Switch between Month/Week
    ├─ Navigate months/weeks
    ├─ Click on reservation → Details View
    └─ Click [Retour à Vue Liste] → Back to List
```

---

## 🎯 Key Features Highlighted

### 1️⃣ Smart Color Assignment
- 10 beautiful gradient colors
- Automatically assigned to each reservation
- Ensures uniqueness and visual appeal
- Consistent across views

### 2️⃣ Rich Information Display
- **Client Details**: Name, phone, avatar
- **Vehicle Details**: Brand, model, registration
- **Reservation Details**: Dates, duration, status
- **Visual Hierarchy**: Clear priority of information

### 3️⃣ Smooth Animations
- Staggered fade-ins
- Hover scale effects
- Smooth transitions
- Professional feel

### 4️⃣ Bilingual Support
- Full French translations
- Full Arabic translations
- RTL support for Arabic
- Language switching seamless

### 5️⃣ Quick Actions
- One-click access to details
- Easy navigation
- Fast switching between views
- Quick return to list

---

## 💡 Usage Tips

### For Maximum Efficiency:
1. **Use Month View for**: Overview of entire month, spotting gaps
2. **Use Week View for**: Detailed daily planning, seeing all details
3. **Use List View for**: Searching, filtering, quick edits
4. **Use Together**: Navigate calendar, click to details, edit if needed

### Best Practices:
- ✅ Use "Today" button to quickly return to today
- ✅ Click reservations to see full details
- ✅ Use search+filter in list view, then switch to calendar
- ✅ Hover to preview before clicking
- ✅ Use different colors mentally to organize workload

---

## 🎨 Color Psychology in UI

Each color was chosen for:
- **Blue**: Trust, calm, primary action
- **Purple**: Creativity, premium feel
- **Pink**: Modern, friendly
- **Green**: Growth, success, action
- **Orange**: Energy, attention
- **Teal**: Balance, professional
- **Cyan**: Tech, clean
- **Indigo**: Depth, sophistication
- **Amber**: Warning, caution
- **Rose**: Romance, modern

This ensures reservations are not only visible but also communicate their importance subconsciously!

---

## 📊 Performance Notes

- ✅ Calendar updates in real-time
- ✅ No lag when switching views
- ✅ Smooth animations on all devices
- ✅ Optimized filtering and sorting
- ✅ Quick navigation between periods

---

**Ready to use! Click the 📅 Calendrier button to get started! 🎉**
