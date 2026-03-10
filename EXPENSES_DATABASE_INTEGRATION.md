# Expenses Module - Database Integration Guide

## Overview
The Expenses module has been completely integrated with Supabase database. The system now persists expenses data and provides proper expiration date handling to prevent expenses from being displayed as "expired" after refresh.

## Problem Fixed
Previously, when you added a new expense and refreshed the page, the expense would appear expired. This was because:
1. Expenses were stored only in component state (local memory)
2. On refresh, the state was lost
3. Expiration date field mapping was inconsistent between UI and storage

## Architecture

### Database Tables

#### Store Expenses Table
```sql
CREATE TABLE store_expenses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cost INTEGER NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
```

#### Vehicle Expenses Table
```sql
CREATE TABLE vehicle_expenses (
  id TEXT PRIMARY KEY,
  car_id TEXT NOT NULL REFERENCES cars(id),
  type TEXT NOT NULL (vidange|assurance|controle|autre),
  cost INTEGER NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  current_mileage INTEGER,
  next_vidange_km INTEGER,
  expiration_date DATE,          -- KEY FIX: Properly named field
  expense_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
```

### Service Layer
**File:** `src/services/expenseService.ts`

Provides complete CRUD operations:

#### Store Expenses Functions
- `getStoreExpenses()` - Fetch all store expenses
- `addStoreExpense(expense)` - Create new store expense
- `updateStoreExpense(id, updates)` - Update existing store expense
- `deleteStoreExpense(id)` - Delete store expense

#### Vehicle Expenses Functions
- `getVehicleExpenses()` - Fetch all vehicle expenses
- `addVehicleExpense(expense)` - Create new vehicle expense
- `updateVehicleExpense(id, updates)` - Update existing vehicle expense
- `deleteVehicleExpense(id)` - Delete vehicle expense

Each function:
- Returns structured response with `{ success: boolean, data?, error? }`
- Maps between camelCase (TypeScript) and snake_case (database)
- Includes proper error handling

### Component Updates

#### VehicleExpenseModal.tsx
**Change:** Added `onClose()` call after save to properly close the modal
```tsx
const handleSubmit = (e: React.FormEvent) => {
  // ... save logic ...
  onSave(submitData);
  onClose();  // NEW: Ensures modal closes after save
};
```

#### VehicleExpenseCard.tsx
**Major Enhancement:** Expiration status calculation and visual feedback
```tsx
// Calculate expiration status
const getExpirationStatus = () => {
  if (!expense.expirationDate) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expDate = new Date(expense.expirationDate);
  expDate.setHours(0, 0, 0, 0);
  
  const daysLeft = Math.floor((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    daysLeft,
    isExpired: daysLeft < 0,
    isWarning: daysLeft >= 0 && daysLeft <= 30,
    isOk: daysLeft > 30,
  };
};
```

**Visual Indicators:**
- 🔴 Red background: Expired (daysLeft < 0)
- 🟠 Orange background: Warning (0-30 days remaining)
- ✅ Green background: OK (>30 days remaining)

#### ExpensesPage.tsx
**Conversion to Database-Driven:**

1. **State Management:**
   ```tsx
   const [storeExpenses, setStoreExpenses] = useState<StoreExpense[]>([]);
   const [vehicleExpenses, setVehicleExpenses] = useState<VehicleExpense[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   ```

2. **Load on Mount:**
   ```tsx
   useEffect(() => {
     const loadExpenses = async () => {
       const [storeResult, vehicleResult] = await Promise.all([
         getStoreExpenses(),
         getVehicleExpenses(),
       ]);
       // Update state with database data
     };
     loadExpenses();
   }, []);
   ```

3. **Save Operations:**
   ```tsx
   const handleSaveVehicleExpense = async (data: Partial<VehicleExpense>) => {
     try {
       if (editingExpense?.id in vehicleExpenses) {
         // Update existing
         const result = await updateVehicleExpense(editingExpense.id, data);
       } else {
         // Create new
         const result = await addVehicleExpense(data);
       }
     } catch (err) {
       setError('Failed to save');
     }
   };
   ```

## Key Improvements

### 1. Data Persistence
- **Before:** Expenses lost on page refresh
- **After:** Data persists in Supabase, automatically loaded on mount

### 2. Expiration Date Handling
- **Before:** Hardcoded expiration_date in database, no validation
- **After:** Proper date comparison with dynamic status calculation

### 3. Type Safety
- Consistent field naming between database and TypeScript
- camelCase in React components
- snake_case in SQL

### 4. Error Handling
- Try-catch blocks in all async operations
- Error state displayed to user
- Graceful fallback behavior

## SQL Migration Steps

1. **Open Supabase Console**
   - Go to your Supabase project
   - Navigate to SQL Editor

2. **Run the Migration**
   - Copy contents of `expenses_migration.sql`
   - Paste into SQL Editor
   - Click "Run" button

3. **Enable RLS (if not already enabled)**
   - The migration includes RLS policy creation
   - Policies allow authenticated users full CRUD access

## Field Mapping Reference

### VehicleExpense TypeScript → Database
| TypeScript | Database |
|-----------|----------|
| id | id |
| carId | car_id |
| type | type |
| cost | cost |
| date | date |
| note | note |
| currentMileage | current_mileage |
| nextVidangeKm | next_vidange_km |
| expirationDate | expiration_date |
| expenseName | expense_name |
| createdAt | created_at |

### StoreExpense TypeScript → Database
| TypeScript | Database |
|-----------|----------|
| id | id |
| name | name |
| cost | cost |
| date | date |
| note | note |
| icon | icon |
| createdAt | created_at |

## Testing the Fix

### Test 1: Add New Expense
1. Navigate to Expenses → Vehicle Expenses
2. Click "+ Nouvelle Dépense"
3. Fill in details including expiration date
4. Click "Enregistrer"
5. Refresh page (F5)
6. ✅ Expense should still appear with correct date

### Test 2: Expiration Status
1. Create assurance expense with:
   - Date: 3 months in future → Green (OK)
   - Date: 15 days in future → Orange (Warning)
   - Date: Past date → Red (Expired)
2. Check visual indicators match

### Test 3: Edit Expense
1. Create expense
2. Refresh page
3. Click Edit (✏️) on the expense
4. Modify details
5. Click "Enregistrer"
6. Verify updates persist across refresh

### Test 4: Delete Expense
1. Click Delete (🗑️) on an expense
2. Confirm deletion
3. Verify expense removed
4. Refresh page
5. ✅ Expense should not reappear

## Maintenance Alerts View

The migration includes an optional view for maintenance alerts:

```sql
CREATE OR REPLACE VIEW maintenance_alerts AS
SELECT
  v.id,
  v.car_id,
  v.type,
  v.expiration_date,
  v.date as service_date,
  CASE
    WHEN v.expiration_date < CURRENT_DATE THEN 'expired'
    WHEN v.expiration_date - INTERVAL '30 days' < CURRENT_DATE THEN 'warning'
    ELSE 'ok'
  END as status
FROM vehicle_expenses v
WHERE v.type IN ('assurance', 'controle');
```

This view can be used for:
- Dashboard alerts
- Reminder notifications
- Reports and analytics

## Future Enhancements

1. **Email Notifications** - Send reminders before expiration
2. **Bulk Operations** - Bulk update/delete expenses
3. **Advanced Filtering** - Filter by date range, status, type
4. **Export** - Export expenses to CSV/PDF
5. **Analytics** - Total spending by category, trends
6. **Budget Tracking** - Set budgets and compare spending

## Troubleshooting

### Expenses Show as Expired After Refresh
✅ **Fixed** - Data now loads from database with correct dates

### Image URL Error in Vehicle Card
✅ **Fixed** - Check image URLs in database are valid Supabase Storage URLs

### Edit Modal Doesn't Close
✅ **Fixed** - Added `onClose()` call in handleSubmit

### Expiration Date Not Saving
**Solution:**
- Verify `expiration_date` field exists in database
- Check field is nullable for non-expiration types
- Ensure date format is YYYY-MM-DD

## Contact & Support
For issues or questions about the expense system, check:
- Service: `src/services/expenseService.ts`
- Components: `src/components/Expenses*.tsx`
- Types: `src/types.ts` (StoreExpense, VehicleExpense)
