# Store Expenses (🏪 Dépenses du Magasin) - Complete Setup Guide

## Overview
The Store Expenses system manages all non-vehicle related expenses (supplies, maintenance, utilities, etc.) with a dedicated interface in the ExpensesPage.

---

## Database Schema

### Table: `public.store_expenses`

```sql
CREATE TABLE public.store_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,                    -- Expense name/description
  cost integer NOT NULL DEFAULT 0,       -- Cost in currency units
  date date NOT NULL DEFAULT CURRENT_DATE,  -- Transaction date
  note text,                             -- Optional additional notes
  icon text DEFAULT '🏪'::text,          -- Visual emoji icon
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT store_expenses_pkey PRIMARY KEY (id)
);
```

### Field Definitions

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| id | uuid | Yes | uuid_generate_v4() | Unique identifier |
| name | text | Yes | - | Expense name (e.g., "Café office", "Fournitures") |
| cost | integer | Yes | 0 | Cost amount (store as integer for precision) |
| date | date | Yes | CURRENT_DATE | Transaction date |
| note | text | No | NULL | Optional notes/details |
| icon | text | No | '🏪' | Visual emoji icon for categorization |
| created_at | timestamp | Auto | now() | Record creation timestamp |

---

## Type Definition (TypeScript)

```typescript
interface StoreExpense {
  id: string;                    // UUID
  name: string;                  // Expense name
  cost: number;                  // Cost amount
  date: string;                  // YYYY-MM-DD format
  note?: string;                 // Optional notes
  icon?: string;                 // Emoji icon (default '🏪')
  createdAt: string;             // ISO timestamp
}
```

---

## Database Integration

### Field Mapping (TypeScript → Database)

```typescript
// TypeScript camelCase → Database snake_case mapping:
{
  id: string,            // → id
  name: string,          // → name
  cost: number,          // → cost
  date: string,          // → date (YYYY-MM-DD)
  note?: string,         // → note
  icon?: string,         // → icon
  createdAt: string,     // → created_at (ISO timestamp)
}
```

### Service Functions

**Location:** `src/services/expenseService.ts`

```typescript
// Fetch all store expenses
export async function getStoreExpenses(): 
  Promise<{ success: boolean; expenses?: StoreExpense[]; error?: string }>

// Create new store expense
export async function addStoreExpense(
  expense: Omit<StoreExpense, 'id' | 'createdAt'>
): Promise<{ success: boolean; expense?: StoreExpense; error?: string }>

// Update existing store expense
export async function updateStoreExpense(
  id: string,
  updates: Partial<Omit<StoreExpense, 'id' | 'createdAt'>>
): Promise<{ success: boolean; expense?: StoreExpense; error?: string }>

// Delete store expense
export async function deleteStoreExpense(id: string): 
  Promise<{ success: boolean; error?: string }>
```

---

## Frontend Components

### 1. ExpensesPage (Main Container)
**Location:** `src/components/ExpensesPage.tsx`

**Features:**
- Tab selection: "🏪 Dépenses du Magasin" vs "🚗 Entretien & Frais Véhicules"
- Add new expense button
- Display grid of store expense cards
- Search functionality
- Edit/Delete operations
- Database synchronization on load

**Store Expenses Tab Logic:**
```typescript
// Display store expenses
{expenseType === 'store' && (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {storeExpenses.map((expense, index) => (
      <StoreExpenseCard
        key={expense.id}
        expense={expense}
        index={index}
        lang={lang}
        onEdit={() => {
          setEditingExpense(expense);
          setIsModalOpen(true);
        }}
        onDelete={() => handleDeleteStoreExpense(expense.id)}
      />
    ))}
  </div>
)}
```

### 2. StoreExpenseCard
**Location:** `src/components/StoreExpenseCard.tsx`

**Displays:**
- Expense icon (emoji)
- Expense name
- Cost formatted with thousands separator
- Date
- Optional note preview
- Edit and Delete action buttons
- Animated entrance

**Example Rendering:**
```
┌──────────────────────────────┐
│  🏪  Café office             │
│                              │
│  500 DZD                     │
│  2026-03-08                  │
│                              │
│  [Edit]  [Delete]           │
└──────────────────────────────┘
```

### 3. StoreExpenseModal
**Location:** `src/components/StoreExpenseModal.tsx`

**Form Fields:**
1. **Expense Name** (text input)
   - Required field
   - Examples: "Café office", "Fournitures", "Maintenance"

2. **Cost** (number input)
   - Required field
   - Integer value (no decimals)

3. **Date** (date picker)
   - Default: current date
   - Format: YYYY-MM-DD

4. **Icon Selector** (button grid)
   - 10 predefined emojis: 🏪, 📋, ☕, 🛠️, 🧹, 💡, 🔧, 📦, 🧴, 🪜
   - User can select one to represent expense category

5. **Notes** (textarea)
   - Optional field
   - Multi-line text for additional details

**Modal Actions:**
- Submit: Saves to database
- Cancel: Closes without saving
- Edit mode: Pre-fills form with existing data

---

## Data Flow

### Creating a Store Expense

```
User Input
    ↓
StoreExpenseModal.onSave()
    ↓
ExpensesPage.handleSaveStoreExpense()
    ↓
addStoreExpense(data) [expenseService.ts]
    ↓
Supabase Database INSERT
    ↓
Response received
    ↓
Update React state: setStoreExpenses([...storeExpenses, newExpense])
    ↓
UI updates with new expense card
```

### Editing a Store Expense

```
User clicks Edit on card
    ↓
setEditingExpense(expense)
    ↓
StoreExpenseModal opens with pre-filled data
    ↓
User modifies fields
    ↓
StoreExpenseModal.onSave()
    ↓
updateStoreExpense(id, updates) [expenseService.ts]
    ↓
Supabase Database UPDATE
    ↓
React state updated: setStoreExpenses(map with updated record)
    ↓
Card re-renders with new data
```

### Deleting a Store Expense

```
User clicks Delete on card
    ↓
handleDeleteStoreExpense(id)
    ↓
setDeleteConfirm({ isOpen: true, id })
    ↓
ConfirmModal displays deletion warning
    ↓
User clicks Confirm
    ↓
deleteStoreExpense(id) [expenseService.ts]
    ↓
Supabase Database DELETE
    ↓
React state updated: setStoreExpenses(filter out deleted)
    ↓
Card removed from UI
```

---

## SQL Setup Instructions

### Step 1: Connect to Supabase

1. Open Supabase Dashboard
2. Go to Project → SQL Editor
3. Create new query

### Step 2: Run Store Expenses SQL

Copy and execute `store_expenses_sql_setup.sql`:

```sql
-- This creates/verifies:
-- 1. store_expenses table (if not exists)
-- 2. RLS policies (read, create, update, delete)
-- 3. Performance indexes
-- 4. Sample data (optional)
```

### Step 3: Verify Setup

Run verification queries:

```sql
-- Check table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'store_expenses';

-- Check columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'store_expenses' 
ORDER BY ordinal_position;

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'store_expenses';

-- Check policies exist
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'store_expenses';

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename = 'store_expenses';
```

### Step 4: Test with Sample Data

Uncomment and run sample data insertion:

```sql
INSERT INTO public.store_expenses (name, cost, date, note, icon) VALUES
('Café office - Arabica premium', 500, '2026-03-08', 'Café pour la pause café', '☕'),
('Fournitures de nettoyage', 2000, '2026-03-07', 'Produits de nettoyage', '🧹'),
('Matériel informatique', 15000, '2026-03-06', 'Clavier sans fil et souris', '⌨️');
```

---

## Icon Reference

### Predefined Icons for Store Expenses

| Icon | Category | Usage |
|------|----------|-------|
| 🏪 | General | Default store/shop |
| 📋 | Office | Papers, documents, admin |
| ☕ | Beverages | Coffee, drinks, refreshments |
| 🛠️ | Maintenance | Repairs, fixes, tools |
| 🧹 | Cleaning | Cleaning supplies, maintenance |
| 💡 | Utilities | Electricity, lighting |
| 🔧 | Equipment | Mechanical, tools |
| 📦 | Inventory | Packages, supplies |
| 🧴 | Consumables | Bottles, liquids, consumables |
| 🪜 | Hardware | Hardware, equipment |

---

## Performance Optimizations

### Indexes Created

```sql
-- Index 1: Query by date (most common filter)
CREATE INDEX idx_store_expenses_date ON public.store_expenses(date DESC);

-- Index 2: Query by name (search functionality)
CREATE INDEX idx_store_expenses_name ON public.store_expenses(name);

-- Index 3: Query by creation date (chronological ordering)
CREATE INDEX idx_store_expenses_created_at ON public.store_expenses(created_at DESC);
```

**Benefits:**
- Fast date-based queries for displaying expenses
- Quick search when filtering by name
- Efficient sorting operations

---

## Security (RLS Policies)

### Authentication Level
All policies use `TO authenticated` - requires user to be logged in

### Granted Permissions

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | Allow read | `true` (any authenticated user can read) |
| INSERT | Allow create | `true` (any authenticated user can create) |
| UPDATE | Allow update | `true` (any authenticated user can update) |
| DELETE | Allow delete | `true` (any authenticated user can delete) |

**Note:** Current policies allow all authenticated users to perform all operations. For production, consider restricting by user/role.

---

## Error Handling

### Common Issues

**Issue 1: "RLS policy violation"**
- **Cause:** User not authenticated
- **Solution:** Ensure user is logged in before accessing expenses

**Issue 2: "Expense not saving"**
- **Cause:** Database insert failed
- **Solution:** Check browser console for error message, verify cost is integer

**Issue 3: "Icon not displaying"**
- **Cause:** Emoji not supported in database
- **Solution:** Use standard Unicode emojis (most are supported)

### Debug Queries

```sql
-- Check if RLS is working
SELECT * FROM public.store_expenses LIMIT 1;

-- Count total expenses
SELECT COUNT(*) as total_expenses FROM public.store_expenses;

-- Show all expenses ordered by date
SELECT id, name, cost, date, icon FROM public.store_expenses 
ORDER BY date DESC;

-- Show expenses in date range
SELECT * FROM public.store_expenses 
WHERE date BETWEEN '2026-03-01' AND '2026-03-31'
ORDER BY date DESC;
```

---

## Integration with Other Systems

### Connection to Vehicle Expenses

- **Separate tables:** Store expenses and vehicle expenses use different tables
- **Same interface:** Both display in `ExpensesPage` via tab selection
- **Independent:** No foreign key relationship between tables

### Integration with Cars System

- **No direct connection:** Store expenses don't reference cars
- **Separate concerns:** Store = facility maintenance, Vehicle = car maintenance

---

## Usage Examples

### Frontend Usage

```typescript
// Import the service
import { 
  getStoreExpenses, 
  addStoreExpense, 
  updateStoreExpense, 
  deleteStoreExpense 
} from '../services/expenseService';

// Load expenses on component mount
useEffect(() => {
  const loadExpenses = async () => {
    const result = await getStoreExpenses();
    if (result.success) {
      setStoreExpenses(result.expenses || []);
    }
  };
  loadExpenses();
}, []);

// Create new expense
const handleAddExpense = async (data: Omit<StoreExpense, 'id' | 'createdAt'>) => {
  const result = await addStoreExpense(data);
  if (result.success && result.expense) {
    setStoreExpenses([...storeExpenses, result.expense]);
  }
};

// Update existing expense
const handleUpdateExpense = async (id: string, updates: Partial<StoreExpense>) => {
  const result = await updateStoreExpense(id, updates);
  if (result.success) {
    setStoreExpenses(storeExpenses.map(e => e.id === id ? result.expense : e));
  }
};

// Delete expense
const handleDeleteExpense = async (id: string) => {
  const result = await deleteStoreExpense(id);
  if (result.success) {
    setStoreExpenses(storeExpenses.filter(e => e.id !== id));
  }
};
```

---

## Maintenance Notes

### Regular Tasks
- Monitor database size (store_expenses table)
- Archive old expenses (optional, depending on business needs)
- Verify RLS policies are working correctly

### Backup Strategy
- Supabase automatically backs up PostgreSQL databases
- Export critical expense data quarterly
- Keep transaction logs for audit purposes

### Future Enhancements
- [ ] Monthly expense reports/analytics
- [ ] Expense categorization (required field)
- [ ] Budget alerts when expenses exceed threshold
- [ ] Export to PDF/CSV functionality
- [ ] Recurring expense templates
- [ ] Expense approval workflow
