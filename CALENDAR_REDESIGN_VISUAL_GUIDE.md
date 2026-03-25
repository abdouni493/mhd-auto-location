# Calendar View Redesign - Visual Guide

## View Modes

### 🗓️ Month View

**Features:**
- 7x6 grid of days (full month layout)
- Date numbers clearly visible
- Color-coded reservation blocks
- Today's date highlighted in green
- Selected date highlighted in blue
- Expandable "+" button for dates with 3+ reservations

**Interactions:**
```
Click Date → Select that day
Hover Reservation → Show full details tooltip
Click Reservation → Open reservation details
Click "+" → Expand/collapse additional reservations
```

**Tooltip Contents:**
- Client name (bold, white)
- Phone number (with icon)
- Email address (with icon)
- Car brand/model (car icon, blue highlight)
- Car registration & color
- Duration in days
- Exact dates

**Visual Design:**
- Cards have subtle rounded corners (rounded-xl)
- Hover effect: scale up 1.08x, shadow increase, elevation
- Border color changes on hover
- Smooth fade animations when appearing

---

### 📅 Week View

**Features:**
- 7 columns for each day of the week
- Larger, more detailed reservation cards
- Full client information with optional profile photo
- Car information section
- Departure/return times
- Total days displayed

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  ← Week Header: Mon 15 - Sun 21 December →  ←  →            │
└─────────────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│   MON    │   TUE    │   WED    │   THU    │   FRI    │   SAT    │   SUN    │
│    14    │    15    │    16    │    17    │    18    │    19    │    20    │
│ Today ✓  │          │          │          │          │          │          │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ [Res 1]  │ [Res 2]  │ [Res 3]  │ [Res 4]  │          │ [Res 5]  │ [Res 6]  │
│ [Res 2]  │ [Res 3]  │          │          │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

**Reservation Card Structure:**
```
┌─────────────────────────────┐
│ [Profile Photo] Name Surname│
│                  📱 +1 234 5│
│                             │
│ ┌─────────────────────────┐ │
│ │ 🚗 Car Brand Model      │ │
│ │ 🏷️ ABC-123             │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🕐 📍 Départ: 10:00    │ │
│ │ 🕐 📍 Retour: 18:00    │ │
│ │ ⏱️ 5 jours             │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Color Scheme:**
- Gradient backgrounds (from-color to darker-color)
- White text for contrast
- Semi-transparent overlays for sections
- Border-left accent stripe (white/semi-transparent)

---

### 🚗 Car View (NEW!)

**Layout Structure:**
```
┌──────────────────────────────────────────┐
│  Car-Centric Timeline View - December 2024 ← →  │
└──────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ [Car Image]  BMW X5                              5 RÉSERVATIONS
│ 4WH-5678     Silver • Diesel
│
│ ┌─────────────────────────────────────────────────────────┐
│ │ [████████  ][═══════════][  █████]  [    ███████████  ]│
│ │   Jan 5-8       Jan 15-20      Jan   Feb
│ │                                      
│ │  Réservations:
│ │  🔹 John Smith         Jan 5 - 8
│ │  🔹 Maria Garcia       Jan 15 - 20
│ │  🔹 Ahmed Hassan       Feb 1 - 15
│ └─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ [Car Image]  Mercedes C-Class                   3 RÉSERVATIONS
│ BCD-1234     Black • Petrol
│
│ ┌─────────────────────────────────────────────────────────┐
│ │ [  ████████][═════  ][████████  ]
│ │    Jan 2-10      Jan        Jan 28-Feb 2
│ │                                      
│ │  Réservations:
│ │  🔹 Sophie Dupont      Jan 2 - 10
│ │  🔹 Lars Jensen        Feb 1 - 5
│ └─────────────────────────────────────────────────────────┘
```

**Timeline Bar Features:**
- Horizontal continuous bar (not intermittent)
- Width proportional to reservation duration
- Position reflects actual date range
- Color-coded by reservation
- Day numbers below for reference
- Hover shows detailed tooltip

**Car Header:**
- Car image (rounded corners)
- Brand + Model name (bold, white)
- Registration + color
- Reservation count badge (top right)

---

## Color Palette

```
🔵 Blue:        from-blue-400 to-blue-600
🟣 Purple:      from-purple-400 to-purple-600
🌸 Pink:        from-pink-400 to-pink-600
🟢 Green:       from-green-400 to-green-600
🟠 Orange:      from-orange-400 to-orange-600
🟦 Teal:        from-teal-400 to-teal-600
🔷 Cyan:        from-cyan-400 to-cyan-600
💜 Indigo:      from-indigo-400 to-indigo-600
🟡 Amber:       from-amber-400 to-amber-600
🌷 Rose:        from-rose-400 to-rose-600
```

Used in order of reservation appearance in the reservations array.

---

## Hover Tooltip Design

**Position:** Bottom-center of reservation, with arrow pointing down

**Content Layout:**
```
╭─────────────────────────────────╮
│ John Smith                      │
├─────────────────────────────────┤
│ 📱 +1 234 567 8900             │
│ ✉️  john.smith@email.com       │
├─────────────────────────────────┤
│ 🚗 BMW X5                       │
│ 🏷️  ABC-1234                   │
│ Silver                           │
├─────────────────────────────────┤
│ 📅 5 jours                      │
│ Dec 15 - Dec 20, 2024          │
╰─────────────────────────────────╯
        ▼ (arrow down)
```

**Style:**
- Dark background (slate-900) with white text
- Border: 1px solid slate-700
- Rounded corners (rounded-lg)
- Shadow: shadow-2xl
- Z-index: 50 (above other content)
- Animation: Fade in from scale 0.8 → 1.0
- Width: 14rem (224px)

---

## Animations

### Entrance
- Staggered fade-in with scale and y-position
- Delay based on index (0.02s per month day, 0.05s per week day)
- Direction: Up (y: -10)

### Hover
- Reservation cards: scale 1.08x, y: -3px, shadow increase
- Timeline bars: scaleY 1.2x, y: -2px
- Color intensity: slightly brighter

### Click
- Subtle scale animation (0.95x) on mouse down
- Rapid return to normal on release

### Tooltip
- Fade in: opacity 0 → 1
- Scale: 0.8 → 1.0
- Y position: -10px → 0
- Duration: ~150ms

---

## Responsive Design

### Mobile (< 640px)
- Month: 7 columns still work (text smaller)
- Week: Stack to single column
- Car: Full width timeline
- Tooltip: Adjust position to avoid screen edge

### Tablet (640px - 1024px)
- Month: Standard 7-column grid
- Week: 3-4 columns
- Car: Scrollable timeline
- All interactions preserved

### Desktop (> 1024px)
- All views at full capability
- Wide timelines
- Side-by-side layouts possible
- Hover effects fully utilized

---

## Accessibility Features

1. **Semantic HTML**: Proper structure with divs and buttons
2. **Color Contrast**: White text on dark tooltip background (WCAG AAA)
3. **Keyboard Support**: Button states and hover effects
4. **Screen Reader**: Proper ARIA labels in future iterations
5. **Focus States**: Visible focus rings on interactive elements

---

## Performance Considerations

- Memoized calculations for calendar days
- Lazy tooltip rendering (only on hover)
- Efficient date comparisons
- AnimatePresence for smooth exit animations
- No unnecessary re-renders with useMemo hooks

---

This redesign provides a modern, intuitive interface for viewing reservations across multiple perspectives while maintaining excellent visual design and smooth interactions.
