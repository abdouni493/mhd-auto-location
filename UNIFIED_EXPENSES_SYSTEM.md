# Unified Expenses Management System - Complete Documentation

## Overview
A unified expense management system that connects store and vehicle maintenance expenses to the Supabase database with seamless integration across interfaces.

---

## Architecture

### 1. Database Tables

#### Store Expenses Table (`public.store_expenses`)
Manages all store/magasin expenses with the following structure:

```sql
CREATE TABLE public.store_expenses (
  id uuid PRIMARY KEY,
  name text NOT NULL,           -- Expense name (e.g., "Café office", "Fournitures")
  cost integer NOT NULL,         -- Cost in currency units
  date date NOT NULL,            -- Transaction date
  note text,                     -- Optional notes
  icon text DEFAULT '🏪',        -- Visual icon for categorization
  created_at timestamp
);
```

**Indexed Fields:** `date DESC`, `name`, `created_at DESC`

#### Vehicle Expenses Table (`public.vehicle_expenses`)
Manages all vehicle maintenance and fees with the following structure:

```sql
CREATE TABLE public.vehicle_expenses (
  id uuid PRIMARY KEY,
  car_id uuid NOT NULL,          -- Foreign key to cars table
  type text NOT NULL,            -- Type: 'vidange', 'assurance', 'controle', 'autre'
  cost integer NOT NULL,         -- Cost in currency units
  date date NOT NULL,            -- Transaction date
  note text,                     -- Optional notes
  current_mileage integer,       -- Mileage at service (for vidange)
  next_vidange_km integer,       -- Next service mileage (for vidange)
  expiration_date date,          -- Expiry date (for assurance, controle)
  expense_name text,             -- Custom name (for 'autre' type)
  created_at timestamp
);
```

**Indexed Fields:** `car_id`, `date DESC`, `type`, `created_at DESC`

---

## Type Definitions

### StoreExpense (TypeScript)
```typescript
interface StoreExpense {
  id: string;
  name: string;                  // Expense name
  cost: number;                  // Cost amount
  date: string;                  // YYYY-MM-DD format
  note?: string;                 // Optional notes
  icon?: string;                 // Unicode emoji icon
  createdAt: string;             // ISO timestamp
}
```

### VehicleExpense (TypeScript)
```typescript
interface VehicleExpense {
  id: string;
  carId: string;                 // Associated car UUID
  type: 'vidange' | 'assurance' | 'controle' | 'autre';
  cost: number;                  // Cost amount
  date: string;                  // YYYY-MM-DD format
  note?: string;                 // Optional notes
  currentMileage?: number;       // Current car mileage
  nextVidangeKm?: number;        // Next oil change mileage
  expirationDate?: string;       // Expiry date for insurance/inspection
  expenseName?: string;          // Custom expense name
  createdAt: string;             // ISO timestamp
}
```

---

## Database Integration

### Field Mapping Reference

#### TypeScript → Database (Snake Case)

**StoreExpense:**
| TypeScript | Database |
|-----------|----------|
| id | id |
| name | name |
| cost | cost |
| date | date |
| note | note |
| icon | icon |
| createdAt | created_at |

**VehicleExpense:**
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

---

## Service Layer

### Location: `src/services/expenseService.ts`

#### Store Expenses Functions

```typescript
// Fetch all store expenses
getStoreExpenses(): Promise<{ success: boolean; expenses?: StoreExpense[]; error?: string }>

// Create new store expense
addStoreExpense(expense: Omit<StoreExpense, 'id' | 'createdAt'>): Promise<{ success: boolean; expense?: StoreExpense; error?: string }>

// Update existing store expense
updateStoreExpense(id: string, updates: Partial<Omit<StoreExpense, 'id' | 'createdAt'>>): Promise<{ success: boolean; expense?: StoreExpense; error?: string }>

// Delete store expense
deleteStoreExpense(id: string): Promise<{ success: boolean; error?: string }>
```

#### Vehicle Expenses Functions

```typescript
// Fetch all vehicle expenses
getVehicleExpenses(): Promise<{ success: boolean; expenses?: VehicleExpense[]; error?: string }>

// Create new vehicle expense
addVehicleExpense(expense: Omit<VehicleExpense, 'id' | 'createdAt'>): Promise<{ success: boolean; expense?: VehicleExpense; error?: string }>

// Update existing vehicle expense
updateVehicleExpense(id: string, updates: Partial<Omit<VehicleExpense, 'id' | 'createdAt'>>): Promise<{ success: boolean; expense?: VehicleExpense; error?: string }>

// Delete vehicle expense
deleteVehicleExpense(id: string): Promise<{ success: boolean; error?: string }>
```

---

## Frontend Components

### 1. ExpensesPage (Main Container)
**Location:** `src/components/ExpensesPage.tsx`

**Features:**
- Tab-based interface for switching between Store and Vehicle expenses
- Search functionality for vehicle expenses (by car name, brand, registration)
- CRUD operations for both expense types
- Responsive grid layout for displaying expenses
- Real-time database synchronization

**State Management:**
```typescript
const [storeExpenses, setStoreExpenses] = useState<StoreExpense[]>([]);
const [vehicleExpenses, setVehicleExpenses] = useState<VehicleExpense[]>([]);
const [expenseType, setExpenseType] = useState<'store' | 'vehicle'>('store');
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingExpense, setEditingExpense] = useState<StoreExpense | VehicleExpense | null>(null);
const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
const [searchQuery, setSearchQuery] = useState('');
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

### 2. StoreExpenseCard
**Location:** `src/components/StoreExpenseCard.tsx`

Displays individual store expense with:
- Expense name and cost
- Date and icon
- Edit/Delete actions
- Animated transitions

### 3. StoreExpenseModal
**Location:** `src/components/StoreExpenseModal.tsx`

Modal form for creating/editing store expenses:
- Name input
- Cost input
- Date picker
- Icon selector (10 predefined icons)
- Notes textarea

### 4. VehicleExpenseCard
**Location:** `src/components/VehicleExpenseCard.tsx`

Displays individual vehicle expense with:
- Associated car information (brand, model, registration)
- Expense type with icon
- Cost and date
- Type-specific information:
  - **Vidange:** Current mileage, next service mileage
  - **Assurance/Controle:** Expiration date with status indicator
  - **Autre:** Custom expense name
- Edit/Delete actions

### 5. VehicleExpenseModal
**Location:** `src/components/VehicleExpenseModal.tsx`

Modal form for creating/editing vehicle expenses:

**Car Selection:**
- Dropdown to select from all database cars
- Shows: Brand Model (Registration)
- Auto-populates current mileage from selected car
- Updates next service mileage automatically

**Type Selection:**
- 🛢️ Vidange (Oil change)
- 🛡️ Assurance (Insurance)
- 🛠️ Controle (Inspection)
- ❓ Autre (Other)

**Dynamic Fields Based on Type:**

**Vidange:**
- Current mileage (auto-populated from car)
- Next vidange KM
- Cost and date
- Notes

**Assurance/Controle:**
- Expiration date
- Cost and date
- Notes

**Autre:**
- Custom expense name
- Cost and date
- Notes

---

## Unified Expense Workflow

### Creating an Expense from CarsPage Interface
```typescript
// 1. User clicks "Expenses" on a car in CarsPage
// 2. Opens ExpenseModal (car-specific)
// 3. Expense is saved to vehicle_expenses table with car_id

// In service:
const newExpense: VehicleExpense = {
  carId: selectedCar.id,           // From car context
  type: 'vidange',
  cost: 5000,
  date: '2026-03-01',
  currentMileage: 45000,
  nextVidangeKm: 50000,
  // ... saved to database
};
```

### Viewing Expense from Entretien Interface
```typescript
// 1. User navigates to 🚗 Entretien & Frais Véhicules
// 2. All vehicle expenses from vehicle_expenses table are displayed
// 3. Expenses from CarsPage appear here automatically
// 4. User can search by car name/registration
// 5. User can create new expenses with car selection from database

// New expense creation includes:
// - Dropdown to select ANY car from cars table
// - All other fields as before
// - Saved to same vehicle_expenses table
```

### Unified Display
```typescript
// All expenses display in both interfaces:
// CarsPage: Only expenses for that specific car
// ExpensesPage (Entretien): All expenses for all cars

// Display logic:
const allVehicleExpenses = vehicleExpenses
  .filter(e => !carFilter || e.carId === carFilter)  // Filter if needed
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   UNIFIED EXPENSES SYSTEM                    │
└─────────────────────────────────────────────────────────────┘

FRONTEND INTERFACES:
┌──────────────────┐                    ┌──────────────────────┐
│   CarsPage       │                    │  ExpensesPage        │
│  (Per Car)       │                    │ (All Expenses)       │
│                  │                    │                      │
│ - View car       │                    │ - Store expenses     │
│ - Add expense    │────────────────────│ - Vehicle expenses   │
│   (car context)  │    Same Table      │ - Search/filter      │
└──────────────────┘                    │ - Add new (select car)
                                        └──────────────────────┘

                              ↓
                        
SERVICE LAYER (expenseService.ts):
┌──────────────────────────────────────────────────────────────┐
│  addVehicleExpense()  updateVehicleExpense()                 │
│  deleteVehicleExpense()  getVehicleExpenses()                │
│  + Same for Store Expenses                                   │
└──────────────────────────────────────────────────────────────┘

                              ↓
                        
DATABASE (Supabase):
┌──────────────────────────────────────────────────────────────┐
│  store_expenses (id, name, cost, date, note, icon)          │
│  vehicle_expenses (id, car_id, type, cost, date, ...)       │
│                                                               │
│  RLS Policies: Authenticated users can CRUD all records      │
│  Indexes: Optimized queries on date, car_id, type           │
└──────────────────────────────────────────────────────────────┘
```

---

## Key Implementation Notes

### 1. Shared Table for Vehicle Expenses
- Both CarsPage and ExpensesPage use the **same `vehicle_expenses` table**
- **CarsPage:** Displays expenses filtered by specific car (car-to-car context)
- **ExpensesPage (Entretien):** Displays all vehicle expenses with car selection dropdown

### 2. Car Selection in Entretien Interface
```typescript
// VehicleExpenseModal receives cars prop from ExpensesPage
<select name="carId" value={formData.carId} onChange={handleCarChange}>
  <option value="">Select a vehicle</option>
  {cars.map(car => (
    <option key={car.id} value={car.id}>
      {car.brand} {car.model} ({car.registration})
    </option>
  ))}
</select>
```

### 3. Expense Filtering & Display
```typescript
// Show expenses for specific car (CarsPage context)
const carExpenses = vehicleExpenses.filter(e => e.carId === selectedCar.id);

// Show all vehicle expenses (ExpensesPage)
const allVehicleExpenses = vehicleExpenses;

// Search by car details (ExpensesPage)
const filtered = vehicleExpenses.filter(expense => {
  const car = cars.find(c => c.id === expense.carId);
  return car?.brand.toLowerCase().includes(searchQuery.toLowerCase());
});
```

### 4. Database Synchronization
```typescript
// On ExpensesPage mount:
useEffect(() => {
  const loadExpenses = async () => {
    const [storeResult, vehicleResult] = await Promise.all([
      getStoreExpenses(),
      getVehicleExpenses(),
    ]);
    setStoreExpenses(storeResult.expenses || []);
    setVehicleExpenses(vehicleResult.expenses || []);
  };
  loadExpenses();
}, []);
```

---

## Setup Instructions

### 1. Execute SQL Setup
Run `expenses_unified_sql_setup.sql` in Supabase SQL Editor:
```bash
# This creates:
# - store_expenses table
# - vehicle_expenses table
# - RLS policies
# - Indexes for performance
```

### 2. Verify Tables
In Supabase console:
- Check `public.store_expenses` table exists
- Check `public.vehicle_expenses` table exists
- Verify foreign key: `vehicle_expenses.car_id → cars.id`

### 3. Test Integration
1. **Create Store Expense:**
   - Go to ExpensesPage
   - Click "Dépenses du Magasin"
   - Add expense with name, cost, date
   - Verify in database

2. **Create Vehicle Expense from CarsPage:**
   - Go to CarsPage
   - Click car expenses icon
   - Add expense (car_id auto-filled)
   - Verify appears in ExpensesPage

3. **Create Vehicle Expense from ExpensesPage:**
   - Go to ExpensesPage
   - Click "Entretien & Frais Véhicules"
   - Select car from dropdown
   - Add expense
   - Verify in both interfaces

---

## Error Handling

### Common Issues & Solutions

**Issue:** "Foreign key constraint failed"
- **Cause:** Selected car doesn't exist in database
- **Solution:** Ensure cars are created before vehicle expenses

**Issue:** "Expense not appearing in ExpensesPage"
- **Cause:** Page not refreshed after database changes
- **Solution:** Component has useEffect to load on mount; try refresh

**Issue:** "Cannot select car in dropdown"
- **Cause:** Cars prop not passed to VehicleExpenseModal
- **Solution:** Verify ExpensesPage passes `cars` prop

---

## Performance Optimizations

1. **Indexes on Frequently Queried Fields:**
   - `vehicle_expenses.car_id` - for filtering by car
   - `vehicle_expenses.date DESC` - for sorting
   - `store_expenses.date DESC` - for sorting

2. **RLS Policies:**
   - Simple `true` conditions for authenticated users
   - No complex row-level filtering (can add later if needed)

3. **Frontend Caching:**
   - Load expenses once on component mount
   - Update state on CRUD operations
   - Avoid re-fetching unnecessarily

---

## Future Enhancements

- [ ] Bulk expense import from CSV
- [ ] Expense categorization & analytics dashboard
- [ ] Expense reminders/alerts (e.g., "Insurance expiring soon")
- [ ] Expense reporting/export functionality
- [ ] Mobile app expense capture with photos
- [ ] Recurring expense templates
