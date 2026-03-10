# Fix: Mileage & Fuel Level Not Persisting in Inspection Edit

## Problem
When updating mileage (⛽ Kilométrage au Départ) and fuel level (⛽ Niveau de Carburant) in the edit interface, the changes don't persist when reopening the edit form - they appear expired/empty.

## Root Causes
1. **Multiple duplicate inspections** - Each save was creating a new inspection record instead of updating the existing one
2. **Wrong inspection selected** - When fetching, the code was getting the first inspection instead of the latest one
3. **State management issue** - The form wasn't properly tracking and persisting individual field changes

## Fixes Applied

### 1. Updated ReservationsService (src/services/ReservationsService.ts)
- Modified `getReservationById()` to select the **latest inspection** by `created_at` instead of the first one
- Modified `getReservations()` to select the **latest inspection** per reservation per type
- This ensures you always see the most recent inspection data

### 2. Fixed EditStep3DepartureInspection Component (src/components/EditReservationForm.tsx)
- Changed initialization to only load data once (using `useRef`)
- Added debounced updates (500ms) to prevent excessive re-renders
- Individual field changes now properly trigger updates
- Form state is properly preserved when navigating back and forth

### 3. Optional: Clean Up Duplicate Inspections
Run this SQL in your Supabase dashboard to remove old duplicate inspection records:

```sql
-- Delete duplicate inspection records, keeping only the latest one per reservation per type
DELETE FROM vehicle_inspections vi1
WHERE type = 'departure'
  AND id NOT IN (
    SELECT id FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY reservation_id, type ORDER BY created_at DESC) as rn
      FROM vehicle_inspections
      WHERE type = 'departure'
    ) ranked
    WHERE rn = 1
  );

DELETE FROM vehicle_inspections vi1
WHERE type = 'return'
  AND id NOT IN (
    SELECT id FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY reservation_id, type ORDER BY created_at DESC) as rn
      FROM vehicle_inspections
      WHERE type = 'return'
    ) ranked
    WHERE rn = 1
  );
```

## How It Works Now
1. When you open edit interface, the **latest inspection** is loaded and displayed
2. When you update mileage or fuel level, changes are debounced (500ms delay)
3. When you save the reservation, the latest inspection data is sent to database for update/create
4. Next time you open edit, you see the most recent values you entered

## Testing
1. Open a reservation in edit mode
2. Go to the inspection step
3. Update "Kilométrage au Départ" to a new value (e.g., 20000)
4. Update "Niveau de Carburant" to a new value (e.g., quarter)
5. Save the reservation
6. Close and reopen the edit form
7. **Result**: Mileage and fuel level should now display the values you just saved

## Technical Details
- Inspections are now properly deduplicated by selecting only the most recent one
- State updates are debounced to prevent multiple rapid updates
- Component properly initializes from reservation data only once
- Each field update triggers a state change that persists to formData
