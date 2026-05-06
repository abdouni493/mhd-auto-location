# Maintenance Expenses Display Fix

## Problem
Maintenance page showed empty dashes ("—") for all values despite having implementation logic for calculating maintenance status.

## Root Cause
The `maintenanceService.getMaintenanceStatus()` function was making its own database queries for `vehicle_expenses`, but those queries were returning empty results in the user's environment.

## Solution
**Modified the system to use existing expense data instead of making duplicate queries:**

1. **Updated `maintenanceService.ts`:**
   - Changed function signature: `getMaintenanceStatus(cars, allExpenses?)` - now accepts optional expenses parameter
   - If `allExpenses` is provided: Filters that data for each car
   - If `allExpenses` is not provided: Falls back to database query (backward compatibility)
   - Added logging to show which source is being used

2. **Updated `MaintenancePage.tsx`:**
   - Now calls `getVehicleExpenses()` to fetch all expenses once
   - Passes the fetched expenses to `getMaintenanceStatus()`
   - This eliminates duplicate queries and uses the already-loaded expense data

## Files Modified
- `src/services/maintenanceService.ts` - Added optional expenses parameter and filtering logic
- `src/components/MaintenancePage.tsx` - Import and call getVehicleExpenses(), pass to getMaintenanceStatus()

## Testing Steps

1. **Hard Refresh Browser:**
   ```
   Ctrl + F5  (Windows)
   Cmd + Shift + R  (Mac)
   ```

2. **Navigate to Maintenance Page**
   - Check console for new logs showing:
   - `[MaintenancePage] Loaded X total expenses`
   - `[Maintenance] Using passed expenses: Found X expenses for car {carId}`

3. **Expected Result:**
   - Maintenance cards should now display values (not empty dashes)
   - If expenses exist for a car:
     - **Vidange**: Shows remaining KM (e.g., "10,000 KM 🟢" or "500 KM 🟡" or "Overdue 🔴")
     - **Chaîne**: Shows remaining KM with color coding
     - **Assurance**: Shows remaining days
     - **Controle Technique**: Shows remaining days

4. **If Still Showing Dashes:**
   - Check console for: `[Maintenance] Using passed expenses: Found 0 expenses`
   - This means no expenses exist for those cars
   - Add expenses via the Expenses page or Maintenance page's quick-add feature

## Console Debugging

Open browser console (F12) and look for:
- Lines starting with `[MaintenancePage]` - expenses loading
- Lines starting with `[Maintenance]` - per-car processing

Example successful output:
```
[MaintenancePage] Loaded 15 total expenses
[Maintenance] Using passed expenses: Found 2 expenses for car 13d345e2-b2f6-40ff-be7f-97bc9ba794ce (Volkswagen T-CROSS)
[Maintenance] Using passed expenses: Found 1 expenses for car 667a3922-552a-46c6-8fd4-981bfea51ba2 (FIAT tipo BC)
[Maintenance] Using passed expenses: Found 0 expenses for car 6d84889e-b5fe-4ec9-8ed1-326c9ba9bc0f (FIAT tipo BF)
```

## Technical Details

### Calculation Formula (Unchanged)
For KM-based maintenance (vidange, chaîne):
```
next_absolute_target = last_mileage + next_vidange_km_interval
km_remaining = next_absolute_target - current_car_mileage
```

### Data Source Priority
1. **If passed as parameter:** Use filtered `allExpenses` array
2. **If parameter not provided:** Query database (fallback)

This ensures:
- ✅ No duplicate database queries
- ✅ Uses already-loaded expense data from MaintenancePage
- ✅ Backward compatible if called from other components
- ✅ Consistent data across all calculations

## Notes
- The fix does NOT change the database
- It does NOT change calculation logic
- It ONLY changes where the expense data comes from
- All other features (notification scheduling, alert types) remain unchanged
