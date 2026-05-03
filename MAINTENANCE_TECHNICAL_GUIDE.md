# Maintenance Module - Technical Implementation

## Files Created

### 1. Component: MaintenancePage
**Path**: `src/components/MaintenancePage.tsx`
**Lines**: ~400
**Purpose**: Main page component for maintenance tracking

**Key Features**:
- State management for cars, maintenance data, search, filters
- Data loading from database via getCars()
- Maintenance status calculation
- Modal handling for car edit and expense creation
- Search and filter logic
- Responsive grid layout

**Props**:
```typescript
interface MaintenancePageProps {
  lang: Language;
  isAuthLoading?: boolean;
  user?: any;
}
```

**State Variables**:
- `cars`: Array of car objects
- `maintenanceData`: Array of maintenance status objects
- `loading`: Loading state
- `searchTerm`: Current search query
- `filterStatus`: Selected status filter
- `isCarModalOpen`: Car edit modal visibility
- `isExpenseModalOpen`: Expense creation modal visibility
- `selectedCar`: Currently selected car
- `selectedExpenseType`: Type of expense being created

### 2. Component: MaintenanceCard
**Path**: `src/components/MaintenanceCard.tsx`
**Lines**: ~250
**Purpose**: Individual car maintenance card component

**Key Features**:
- Car image with gradient overlay
- Edit car button
- Four maintenance item buttons
- Status color coding
- Emoji status indicators
- Smooth animations
- RTL language support

**Props**:
```typescript
interface MaintenanceCardProps {
  maintenance: MaintenanceStatus;
  lang: Language;
  onEditCar: (car: Car) => void;
  onVidangeClick: (car: Car, expenseId?: string) => void;
  onChaineClick: (car: Car, expenseId?: string) => void;
  onAssuranceClick: (car: Car, expenseId?: string) => void;
  onControleClick: (car: Car, expenseId?: string) => void;
}
```

**Features**:
- Responsive card layout
- Hover animations
- Dynamic status colors
- Click handlers for each maintenance item
- Display of last service dates and remaining values

### 3. Service: maintenanceService
**Path**: `src/services/maintenanceService.ts`
**Lines**: ~200
**Purpose**: Business logic for maintenance data

**Main Interface**:
```typescript
export interface MaintenanceStatus {
  car: Car;
  vidange: {
    lastDate: string | null;
    lastMileage: number | null;
    nextMileage: number | null;
    kmRemaining: number | null;
    expense: VehicleExpense | null;
  };
  chaine: { /* similar structure */ };
  assurance: {
    lastDate: string | null;
    expirationDate: string | null;
    daysRemaining: number | null;
    isExpired: boolean;
    expense: VehicleExpense | null;
  };
  controleTechnique: { /* similar to assurance */ };
}
```

**Functions**:
1. `getMaintenanceStatus(cars: Car[]): Promise<MaintenanceStatus[]>`
   - Fetches all vehicle expenses from database
   - Groups by car and maintenance type
   - Calculates remaining KM and days
   - Determines status for each type
   - Returns array of maintenance status objects

2. `getStatusColor(type, value, threshold): 'critical' | 'warning' | 'success'`
   - Determines status color based on value
   - Type-specific thresholds
   - Returns color string for styling

3. `getStatusEmoji(status): string`
   - Returns emoji for status color
   - 🔴 for critical, 🟡 for warning, 🟢 for success

**Algorithm**:
```
For each car:
  Get all vehicle_expenses where car_id = car.id
  Group expenses by type (vidange, chaine, assurance, controle)
  
  For KM-based items (vidange, chaine):
    Get latest expense
    Calculate: kmRemaining = nextVidangeKm - currentMileage
    Status: if kmRemaining <= 0: critical
            elif kmRemaining <= 1000: warning
            else: success
  
  For date-based items (assurance, controle):
    Get latest expense
    Calculate: daysRemaining = (expirationDate - today) / 86400
    Status: if daysRemaining < 0: critical (expired)
            elif daysRemaining <= 30: warning
            else: success
```

## Database Schema Used

### vehicle_expenses table
```sql
- id: UUID (primary key)
- car_id: TEXT (foreign key -> cars)
- type: TEXT ('vidange' | 'chaine' | 'assurance' | 'controle' | 'autre')
- cost: DECIMAL
- date: DATE
- note: TEXT
- current_mileage: INTEGER
- next_vidange_km: INTEGER
- expiration_date: DATE
- expense_name: TEXT
- created_at: TIMESTAMP
- oil_filter_changed: BOOLEAN
- air_filter_changed: BOOLEAN
- fuel_filter_changed: BOOLEAN
- ac_filter_changed: BOOLEAN
```

### cars table (relevant fields)
```sql
- id: UUID (primary key)
- brand: TEXT
- model: TEXT
- plate_number: TEXT
- year: INTEGER
- color: TEXT
- vin: TEXT
- energy: TEXT
- transmission: TEXT
- seats: INTEGER
- doors: INTEGER
- mileage: INTEGER (current)
- status: TEXT ('disponible' | 'louer' | 'maintenance')
- image_url: TEXT
- price_per_day: DECIMAL
- price_week: DECIMAL
- price_month: DECIMAL
- deposit: DECIMAL
```

## Integration Points

### Constants (src/constants.ts)
```typescript
Added to SIDEBAR_ITEMS array:
{
  id: 'maintenance',
  label: { fr: 'Maintenance', ar: 'الصيانة' },
  icon: '🔧'
}
```

### App.tsx
1. **Import**:
   ```typescript
   import { MaintenancePage } from './components/MaintenancePage';
   ```

2. **URL Mapping** (initial):
   ```typescript
   '/maintenance': 'maintenance'
   ```

3. **URL Mapping** (on tab change):
   ```typescript
   'maintenance': '/maintenance'
   ```

4. **Route Path**:
   ```tsx
   <Route path="/maintenance" element={<ProtectedRoute />} />
   ```

5. **Render Content**:
   ```typescript
   case 'maintenance':
     return <MaintenancePage lang={lang} isAuthLoading={isAuthLoading} user={user} />;
   ```

6. **Protected Route Path Map**:
   ```typescript
   '/maintenance': 'maintenance'
   ```

## Component Hierarchy

```
App.tsx
├── MaintenancePage (Route: /maintenance)
│   ├── Header Section
│   ├── Controls Bar
│   │   ├── Search Input
│   │   ├── Filter Buttons (All, Critical, Warning, Success)
│   │   └── Refresh Button
│   ├── Grid Container
│   │   └── MaintenanceCard[] (one per car)
│   │       ├── Car Image Header
│   │       ├── Edit Car Button
│   │       ├── Maintenance Items
│   │       │   ├── Vidange Button
│   │       │   ├── Chaîne Button
│   │       │   ├── Assurance Button
│   │       │   └── Contrôle Button
│   │       └── Footer Info
│   ├── CarModal (opened via edit button)
│   └── VehicleExpenseModal (opened via maintenance item)
```

## Data Flow

### Initial Load
```
User navigates to /maintenance
  ↓
MaintenancePage mounted
  ↓
useEffect checks auth
  ↓
loadCarsData() called
  ↓
getCars() from database
  ↓
getMaintenanceStatus() calculates status
  ↓
setMaintenanceData() updates state
  ↓
MaintenanceCard components render with data
```

### Maintenance Item Click
```
User clicks maintenance item
  ↓
Handler function called (e.g., handleVidangeClick)
  ↓
selectedCar state updated
  ↓
selectedExpenseType state set
  ↓
prefilledExpense state created
  ↓
isExpenseModalOpen = true
  ↓
VehicleExpenseModal renders with pre-filled data
```

### Save Expense
```
User saves expense in modal
  ↓
handleSaveExpense() called
  ↓
addVehicleExpense() creates database record
  ↓
loadCarsData() reloads all data
  ↓
getMaintenanceStatus() recalculates
  ↓
maintenanceData state updated
  ↓
Cards re-render with new data
  ↓
Modal closes
```

## Styling & Animations

### CSS Classes Used
- `.glass-card`: Card container with glassmorphism effect
- `.input-saas`, `.btn-saas-primary`, `.btn-saas-outline`: SaaS-themed components
- `.label-saas`: Label styling
- `.custom-scrollbar`: Custom scrollbar style

### Tailwind Classes
- Grid layout: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Gradients: `bg-linear-to-r from-* via-* to-*`
- Responsive padding: `p-4 md:p-6 lg:p-8`
- Color utilities: `bg-red-50`, `text-amber-700`, etc.

### Framer Motion Animations
- `layout`: Grid layout animation
- `initial`, `animate`, `exit`: Component lifecycle animations
- `whileHover`: Hover state animations
- `whileTap`: Click state animations
- `AnimatePresence`: Exit animations

## Performance Considerations

1. **Memoization**: MaintenanceCard uses layout memoization via Framer Motion
2. **Lazy Loading**: Maintenance data calculated only when needed
3. **Debounced Search**: Search input debounced (if implemented in future)
4. **Efficient Filtering**: Filtering done on client-side after data loaded
5. **Database Indexes**: Maintenance queries use indexed columns (car_id, type, date)

## Error Handling

### Error States
- Failed cars load: Falls back, logs error to console
- Failed maintenance calculation: Returns empty array, logs error
- Failed expense save: Shows error message to user
- Missing user: Skips data load, awaits authentication

### Try-Catch Blocks
- All database operations wrapped
- Errors logged to console for debugging
- User-friendly error messages displayed when needed

## Type Safety

All components are fully typed with TypeScript:
- `MaintenancePageProps` interface
- `MaintenanceCardProps` interface
- `MaintenanceStatus` interface with nested objects
- All state variables explicitly typed
- Function parameters and returns typed

## Responsive Design Breakpoints

- **Mobile** (< 768px): 1 column grid
- **Tablet** (768px - 1024px): 2-3 columns
- **Desktop** (1024px - 1280px): 3 columns
- **Large** (> 1280px): 4 columns

## Accessibility

- Semantic HTML elements
- Button elements for interactive items
- Proper heading hierarchy
- Color contrast meets WCAG AA standards
- Keyboard navigation support
- RTL layout support for Arabic

---

**Development Status**: ✅ Complete
**Testing**: Ready for QA
**Documentation**: Complete
