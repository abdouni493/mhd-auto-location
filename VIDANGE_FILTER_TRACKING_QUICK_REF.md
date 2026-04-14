# 🔧 Vidange Filter Tracking - Quick Reference

## SQL Migration
```sql
ALTER TABLE public.vehicle_expenses 
ADD COLUMN IF NOT EXISTS oil_filter_changed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS air_filter_changed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS fuel_filter_changed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ac_filter_changed boolean DEFAULT false;
```

## Filter Checkboxes (UI)
- **Only visible when:** `expense.type === 'vidange'`
- **Location in form:** After "Prochain" (Next) display, before Note field
- **Checkboxes:**
  - 🛢️ Filtre à huile (Oil Filter)
  - 💨 Filtre à air (Air Filter)
  - ⛽ Filtre à carburant (Fuel Filter)
  - ❄️ Filtre climatisation (AC Filter)

## State Variables in Component
```typescript
oilFilterChanged: boolean (default: false)
airFilterChanged: boolean (default: false)
fuelFilterChanged: boolean (default: false)
acFilterChanged: boolean (default: false)
```

## Data Submission
When saving a vidange expense, includes:
```typescript
oilFilterChanged: true/false
airFilterChanged: true/false
fuelFilterChanged: true/false
acFilterChanged: true/false
```

## Files Modified
- `src/components/VehicleExpenseModal.tsx` - UI component updates
- `add_vidange_filter_tracking.sql` - Database migration

## Features
✅ Only for vidange (oil change) expenses
✅ Other expense types not affected
✅ Loads correctly in edit mode
✅ Bilingual (French/Arabic)
✅ Boolean storage in database
✅ Default false for new expenses
