# Quick Fix: All Vehicles Showing "—" for Maintenance

## Problem
All vehicles on the Maintenance page show `—` (empty dashes) for:
- Restant KM (Vidange & Chaîne)
- Restant Jours (Assurance & Contrôle)

This means **no vehicle expense data** is being retrieved.

---

## Step 1: Check Browser Console

1. Open your browser → Press **F12** (Developer Tools)
2. Go to **Console** tab
3. Look for messages like:
   ```
   [Maintenance] No expenses found for car XXX (Volkswagen T-CROSS)
   Error fetching expenses for car XXX: ...
   ```

---

## Step 2: Add Sample Maintenance Data

### Option A: Via UI (Recommended)
1. Go to **Expenses** page
2. Click **"+ Add Expense"** or **"+ New Expense"**
3. For each vehicle, add:
   - **Type**: Vidange (Oil Change)
   - **Date**: Any past date
   - **Current Mileage**: 60,000 km (or vehicle's current mileage)
   - **Next Vidange**: 10,000 km (interval)
   - **Cost**: 5,000 DZD

4. After adding expenses:
   - Go back to **Maintenance** page
   - ✅ Should show remaining KM now

### Option B: Direct Database (Advanced)
If you have database access, run:
```sql
INSERT INTO vehicle_expenses (car_id, type, cost, date, current_mileage, next_vidange_km, expense_name)
VALUES 
  ('car-id-1', 'vidange', 5000, NOW(), 60000, 10000, 'Oil Change'),
  ('car-id-2', 'vidange', 5000, NOW(), 70000, 10000, 'Oil Change');
```

---

## Step 3: Refresh and Verify

1. Hard refresh browser: **Ctrl+F5** (or **Cmd+Shift+R** on Mac)
2. Go to **Maintenance** page
3. Check if values now show instead of `—`

---

## Troubleshooting

### Still showing "—"?

**Check 1: Database Query**
- Open Browser Console (F12)
- Check if there are error messages about:
  - Table access denied (RLS policy issue)
  - Query failures
  - Network errors

**Check 2: RLS Policies**
- Ensure `vehicle_expenses` table has proper row-level security
- Verify user has SELECT permissions

**Check 3: Data Format**
- Ensure expenses are stored with correct `car_id`
- Verify `current_mileage` and `next_vidange_km` are numbers (not null)

---

## Expected Behavior After Fix

**Before:**
```
Vidange: Restant — KM 🟢
```

**After adding expense (current: 60,000 km, interval: 10,000 km):**
```
Vidange: Restant 10,000 KM 🟢  ✅
```

---

## Debug Command

Paste this in browser console to diagnose:
```javascript
// Check if supabase is accessible
console.log('Supabase:', typeof supabase);

// Try direct query
supabase
  .from('vehicle_expenses')
  .select('*')
  .limit(5)
  .then(res => {
    console.log('Query result:', res);
    console.log('Error:', res.error);
    console.log('Data:', res.data);
  });
```

---

## Files Updated

✅ [src/services/maintenanceService.ts](src/services/maintenanceService.ts)
- Added detailed error logging
- Logs when no expenses found
- Logs count of expenses found

---

## Summary

| Step | Action | Result |
|------|--------|--------|
| 1 | Add vehicle expenses | Data in database ✓ |
| 2 | Refresh page | Maintenance calculates ✓ |
| 3 | View maintenance | Shows remaining km/days ✓ |

