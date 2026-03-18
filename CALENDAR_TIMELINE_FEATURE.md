# 📅 Calendar & Timeline View - Feature Documentation

## Overview
A beautiful calendar and timeline interface has been added to the Planificateur (Scheduler) page, allowing users to view reservations in a visual calendar format with different colors, animations, and detailed information for each reservation.

## Features

### 1. **Two View Modes**
   - **Grid/List View**: Traditional card-based layout (default)
   - **Calendar View**: Month and week timeline views with visual representations

### 2. **Calendar Features**

#### Month View
- Full month calendar with all reservations displayed
- Color-coded reservations for easy visual identification
- Click on any day to see all reservations for that day
- Navigate between months with previous/next buttons
- Today button to quickly return to current date
- Highlighted current day (green) and selected day (blue)
- Show up to 2 reservations per day with a "+X more" indicator

#### Week View
- 7-day week timeline
- Individual cards for each day showing all reservations
- Compact display with client avatar, car info, and duration
- Left/right navigation between weeks
- Shows current week with clear indicators
- Smooth animations when switching between weeks

### 3. **Color System**
Each reservation gets a unique color from a palette of 10 colors:
- Blue gradient
- Purple gradient
- Pink gradient
- Green gradient
- Orange gradient
- Teal gradient
- Cyan gradient
- Indigo gradient
- Amber gradient
- Rose gradient

Colors are assigned based on reservation index in the list, ensuring each reservation stands out.

### 4. **Reservation Cards (Calendar View)**
Each reservation displays:
- **Client Information**
  - Client name and phone number
  - Client avatar with fallback
  
- **Vehicle Information**
  - Car brand and model
  - Registration/plate number
  
- **Rental Details**
  - Total days of rental
  - Easy click-through to full details

### 5. **Animations & Interactions**
- Smooth fade-in animations for calendar days and reservations
- Hover effects on reservation cards with scale transformation
- Staggered animations for a polished feel
- Click on any reservation to view full details
- Responsive design that works on mobile and desktop

### 6. **Legend**
- Color-coded legend explaining what each element means:
  - Green: Current day
  - Blue: Selected day
  - Gradient colors: Reservations

## UI Components

### Button Integration
A new "📅 Calendrier/التقويم" button appears in the Planificateur controls:
- **Gradient Background**: Purple to Pink gradient
- **Hover Effect**: Brightens on hover
- **Icon**: Calendar icon with label
- **Position**: Right side of the control bar, next to "New Reservation" button

### Toggle Button
- When in Calendar view, a "View List" button appears to switch back
- Smooth transitions between views

## Technical Implementation

### Files Modified
1. **PlannerPage.tsx**
   - Added `displayMode` state to track 'grid' or 'calendar'
   - Updated `currentView` to include 'calendar'
   - Added calendar button to controls
   - Added conditional rendering for calendar view
   - Updated back navigation to remember which view was active

2. **ReservationTimelineView.tsx** (New File)
   - Complete calendar/timeline component
   - Month and week view modes
   - Color assignment logic
   - Date filtering logic
   - Responsive grid layout

### Key Functions
- `getReservationsForDate()`: Filters reservations for a specific date
- `getColorForReservation()`: Assigns color based on reservation index
- `getWeekDays()`: Calculates the 7 days of the current week
- `getDaysInMonth()` & `getFirstDayOfMonth()`: Calendar utilities

### State Management
```typescript
- displayMode: 'grid' | 'calendar' - Current display mode
- currentDate: Date - Currently viewed month/year
- selectedDay: Date | null - Selected day in calendar
- viewMode: 'month' | 'week' - Calendar view type
```

## Language Support
- **French**: Full French translations (Mois, Semaine, Calendrier, etc.)
- **Arabic**: Full Arabic translations with RTL support
- Dynamic language switching based on `lang` prop

## Responsive Design

### Breakpoints
- **Mobile**: Single column week view, full-width calendar
- **Tablet**: Responsive calendar grid
- **Desktop**: Full 7-column week view, multi-column calendar grid

### Classes Used
- `grid grid-cols-7` for calendar days
- `lg:grid-cols-7` for week view
- Responsive padding and spacing

## Color Palette Details

The calendar uses a carefully selected color palette with complementary gradients:

```typescript
COLORS = [
  { bg: 'from-blue-400 to-blue-600', text: 'text-blue-900', ... },
  { bg: 'from-purple-400 to-purple-600', text: 'text-purple-900', ... },
  { bg: 'from-pink-400 to-pink-600', text: 'text-pink-900', ... },
  // ... 7 more colors
]
```

## Animations

### Framer Motion Effects
- Initial opacity and y-transform with staggered delays
- Hover scale effects (1.02 - 1.05)
- Exit animations with AnimatePresence
- Smooth transitions on all interactive elements

## Usage Example

The calendar is accessed through the Planificateur page:
1. User clicks "📅 Calendrier" button in the control bar
2. Calendar view opens with current month displayed
3. User can:
   - Switch between month and week views
   - Navigate through months/weeks
   - Click on reservations to view full details
   - Filter by date range
   - Search and filter as in list view

## Integration with Existing Features

The calendar view integrates seamlessly with:
- **ReservationDetailsView**: Click any reservation to see full details
- **EditReservationForm**: Edit reservations from the details view
- **CreateReservationForm**: Create new reservations
- **Status Management**: View reservations by status
- **Search & Filter**: Works alongside existing search functionality

## Performance Considerations

- Uses `useMemo` for calendar day calculations
- Efficient color assignment with modulo operator
- Smooth animations with Framer Motion
- Lazy filtering of reservations per date
- No unnecessary re-renders with proper dependency arrays

## Future Enhancements

Potential improvements for future versions:
1. Drag-and-drop to reschedule reservations
2. Export calendar to PDF/iCal format
3. Overlapping reservation handling with visual stack
4. Time-of-day view (hourly timeline)
5. Filters by status directly on calendar
6. Custom color assignment per reservation
7. Integration with external calendar services

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design supports all screen sizes
- CSS Grid support required
- ES2020+ JavaScript support

## Accessibility

- Semantic HTML structure
- ARIA labels for icons
- Keyboard navigation support (inherited from React)
- High contrast colors
- Clear visual hierarchy
- Readable font sizes
