# Custom Vehicle Expenses Implementation Guide

## 📋 Overview

This guide documents all the changes made to support:
- ✅ Custom vehicle expense categories (🚗 Dépense Véhicule)
- ✅ Editable current mileage field for Vidange
- ✅ Vehicle expenses tab as default view
- ✅ Dashboard alerts for custom expenses
- ✅ Predefined expense categories

---

## 🗄️ Database Changes

### SQL Migration File
**Location:** `add_custom_expenses_feature.sql` and `COMPLETE_CUSTOM_EXPENSES_MIGRATION.sql`

### New Tables

#### 1. `vehicle_expense_categories`
```sql
CREATE TABLE vehicle_expense_categories (
  id uuid PRIMARY KEY,
  category_name text UNIQUE NOT NULL,
  icon text NOT NULL DEFAULT '❓',
  description text,
  category_type text CHECK (category_type IN ('vidange', 'assurance', 'controle', 'autre')),
  display_order integer,
  is_active boolean DEFAULT true,
  created_at timestamp,
  updated_at timestamp
);
```

**Predefined Categories:**
- 🔍 Frais d'inspection (Inspection fees)
- ⚙️ Réparation moteur (Engine repair)
- 🛞 Pneus (Tires)
- 🔋 Batterie (Battery)
- 🛑 Freins (Brakes)
- 🪟 Pare-brise (Windshield)
- ⛽ Carburant (Fuel)
- 🅿️ Stationnement (Parking)
- 📜 Amende (Fine)
- 🧼 Lavage (Wash)
- 🛋️ Intérieur (Interior)
- ⚡ Électricité (Electrical)
- 🔧 Suspension (Suspension)
- ❄️ Climatisation (AC)
- ⚙️ Transmission (Transmission)
- ❓ Autre (Other)

#### 2. `maintenance_cost_alerts`
```sql
CREATE TABLE maintenance_cost_alerts (
  id uuid PRIMARY KEY,
  car_id uuid NOT NULL REFERENCES cars(id),
  expense_id uuid,
  expense_type text CHECK (expense_type IN ('vidange', 'assurance', 'controle', 'autre')),
  expense_category text,
  cost integer NOT NULL,
  alert_date date,
  alert_sent boolean DEFAULT false,
  alert_severity text CHECK (alert_severity IN ('low', 'medium', 'high', 'critical')),
  alert_message text,
  created_at timestamp
);
```

### Modified Tables

#### `vehicle_expenses`
**New Columns:**
- `expense_category text` - Custom category name for 'autre' type expenses
- `category_icon text` - Emoji icon for the category
- `alert_sent boolean` - Flag for alert tracking

**Example Data:**
```sql
INSERT INTO vehicle_expenses 
(car_id, type, cost, date, expense_category, category_icon, current_mileage, note)
VALUES 
('uuid', 'autre', 5000, '2026-04-09', 'Frais d''inspection', '🔍', 45000, 'Inspection technique annuelle');
```

### Indexes Added

```sql
-- Performance optimization
CREATE INDEX idx_vehicle_expenses_type_category ON vehicle_expenses(type, expense_category);
CREATE INDEX idx_vehicle_expenses_car_alert ON vehicle_expenses(car_id, alert_sent, created_at DESC);
CREATE INDEX idx_maintenance_cost_alerts_car_date ON maintenance_cost_alerts(car_id, alert_date DESC);
CREATE INDEX idx_maintenance_cost_alerts_severity ON maintenance_cost_alerts(alert_severity, alert_date DESC);
```

### Database Functions

#### 1. `calculate_expense_severity(cost, daily_rate)`
Calculates alert severity based on expense cost:
- **critical:** cost ≥ daily_rate × 2
- **high:** cost ≥ daily_rate
- **medium:** cost ≥ daily_rate × 0.5
- **low:** cost < daily_rate × 0.5

#### 2. `create_expense_alert()`
Trigger function that automatically creates alerts when new 'autre' type expenses are added.

#### 3. `create_alerts_for_expenses(start_date, end_date)`
Stored procedure to bulk create alerts for existing expenses.

### Database View

#### `active_maintenance_alerts`
```sql
SELECT 
  mca.id, mca.car_id, c.brand, c.model, c.registration,
  mca.expense_category, mca.cost, mca.alert_severity, mca.alert_message,
  CASE 
    WHEN mca.alert_date < CURRENT_DATE - INTERVAL '7 days' THEN 'old'
    WHEN mca.alert_date < CURRENT_DATE - INTERVAL '3 days' THEN 'recent'
    ELSE 'new'
  END as alert_age
FROM maintenance_cost_alerts mca
JOIN cars c ON mca.car_id = c.id
ORDER BY mca.alert_date DESC;
```

---

## 🎨 Frontend Changes

### 1. VehicleExpenseModal Component
**File:** `src/components/VehicleExpenseModal.tsx`

**Changes:**
- ✅ Made current mileage field **editable** for Vidange type (changed from display-only)
- ✅ Added expense category selector for 'autre' type
- ✅ Form now supports all required fields:
  - 🚗 Kilométrage Actuel (editable)
  - 💵 Coût (DZD)
  - 📅 Date
  - ↩️ Km pour Prochaine Vidange
  - 🏁 Prochain (auto-calculated)
  - 📄 Note (optional)

**Form Structure:**
```typescript
// VIDANGE SECTION
{formData.type === 'vidange' && (
  <>
    {/* Current Mileage - NOW EDITABLE */}
    <input
      type="number"
      name="currentMileage"
      value={formData.currentMileage}
      onChange={handleChange}
      className="input-saas text-lg font-bold text-center"
    />
    
    {/* Cost, Date, Next Vidange, Next Service Display */}
  </>
)}

// AUTRE SECTION
{formData.type === 'autre' && (
  <>
    {/* Expense Name */}
    <input
      type="text"
      name="expenseName"
      placeholder="Réparation pneu, Frais inspection..."
    />
    
    {/* Cost, Date */}
  </>
)}
```

### 2. ExpensesPage Component
**File:** `src/components/ExpensesPage.tsx`

**Changes:**
- ✅ Changed default tab from `'store'` to `'vehicle'`
- ✅ Vehicle expenses (🚗 Entretien & Frais Véhicules) now displays by default
- ✅ Users can still switch to store expenses

**Code Change:**
```typescript
// BEFORE
const [expenseType, setExpenseType] = useState<'store' | 'vehicle'>('store');

// AFTER
const [expenseType, setExpenseType] = useState<'store' | 'vehicle'>('vehicle');
```

### 3. VehicleExpenseCard Component
**File:** `src/components/VehicleExpenseCard.tsx`

**Displays:**
- Expense icon based on type
- Current mileage for vidange
- Cost in DZD
- Date
- Next vidange kilometers
- Optional notes
- Edit/Delete actions

---

## 🔔 Dashboard Alert Integration

### Alert Display System

The dashboard integrates custom expense alerts with existing maintenance alerts:

1. **Alert Card Component** (enhanced)
   - Displays all maintenance alerts including custom expenses
   - Shows severity level (critical, high, medium, low)
   - Auto-calculates severity based on cost

2. **Alert Sections:**
   - Vidange alerts (🛢️)
   - Assurance alerts (🛡️)
   - Contrôle Technique alerts (🔍)
   - **Custom Expense Alerts** (new 💰)

3. **Alert Severity Calculation:**
   ```
   - Critical: Cost ≥ 10,000 DZD (or 2× daily rate)
   - High: Cost ≥ 5,000 DZD (or 1× daily rate)
   - Medium: Cost ≥ 2,500 DZD (or 0.5× daily rate)
   - Low: Cost < 2,500 DZD
   ```

### How Alerts are Created

1. **Automatic (via Trigger):**
   - When a new 'autre' type expense is added
   - Trigger function `create_expense_alert()` fires
   - Alert is created in `maintenance_cost_alerts` table

2. **Manual (via Stored Procedure):**
   ```sql
   SELECT * FROM create_alerts_for_expenses('2026-04-01', '2026-04-09');
   ```

3. **Alert Message Format:**
   ```
   Nouvelle dépense: [Category] - [Cost] DZD
   Example: "Nouvelle dépense: Frais d'inspection - 3500 DZD"
   ```

---

## 📱 User Interface Flow

### Creating a Custom Expense (🚗 Dépense Véhicule)

**Step 1:** Select Vehicle Type Tab
```
[🏪 Dépenses Magasin]  [🚗 Entretien & Frais Véhicules] ← Default
```

**Step 2:** Click "Ajouter une dépense"
```
Modal opens: 🚗 Dépense Véhicule
```

**Step 3:** Select Vehicle
```
Select from dropdown: [Brand Model (Registration)]
```

**Step 4:** Select Expense Type
```
[🛢️ Vidange] [🛡️ Assurance] [🛠️ Contrôle] [❓ Autre] ← Default
```

**Step 5a (Vidange):** Fill Vidange Form
```
🚗 Kilométrage Actuel: [INPUT] ← NOW EDITABLE
💵 Coût (DZD): [INPUT]
📅 Date: [DATE PICKER]
↩️ Km pour Prochaine Vidange: [INPUT]
🏁 Prochain: [AUTO-CALCULATED] = currentMileage + nextVidangeKm
📄 Note (optionnel): [TEXTAREA]
```

**Step 5b (Autre - Custom):** Fill Custom Expense Form
```
📝 Nom de la dépense: [INPUT] (e.g., "Frais d'inspection")
💵 Coût (DZD): [INPUT]
📅 Date: [DATE PICKER]
📄 Note (optionnel): [TEXTAREA]
```

**Step 6:** Submit
```
[Annuler] [Ajouter]
```

**Step 7:** Alert Created
```
Dashboard shows: 💰 Custom Expense Alert
Severity: [HIGH/MEDIUM/LOW based on cost]
Message: "Nouvelle dépense: [Category] - [Amount] DZD"
```

---

## 🗂️ File Structure

### Files Modified
```
src/components/
├── VehicleExpenseModal.tsx         ✅ MODIFIED (editable mileage, category selector)
├── ExpensesPage.tsx                ✅ MODIFIED (default tab = 'vehicle')
├── VehicleExpenseCard.tsx          (displays expense details)
└── DashboardPage.tsx               (displays alerts)

src/utils/
└── vidangeAlerts.ts                (alert calculation logic)

src/services/
├── expenseService.ts               (expense CRUD operations)
└── DatabaseService.ts              (database operations)
```

### Files Created
```
add_custom_expenses_feature.sql            (basic schema)
COMPLETE_CUSTOM_EXPENSES_MIGRATION.sql     ✅ MAIN MIGRATION (comprehensive)
CUSTOM_VEHICLE_EXPENSES_IMPLEMENTATION.md  (this guide)
```

---

## 🚀 Deployment Steps

### Step 1: Run SQL Migration
```bash
# Execute in Supabase SQL Editor or directly:
psql -h [host] -U [user] -d [database] -f COMPLETE_CUSTOM_EXPENSES_MIGRATION.sql
```

### Step 2: Verify Database Changes
```sql
-- Check new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vehicle_expenses' 
  AND column_name IN ('expense_category', 'category_icon', 'alert_sent');

-- Check categories inserted
SELECT * FROM vehicle_expense_categories ORDER BY display_order;

-- Check new tables exist
\dt maintenance_cost_alerts
\dt vehicle_expense_categories
```

### Step 3: Deploy Frontend Changes
```bash
# VehicleExpenseModal.tsx
# ExpensesPage.tsx
# (changes included in this repository)
```

### Step 4: Test the Implementation

**Test 1: Create a Custom Expense**
```
1. Go to 💰 Dépenses → 🚗 Entretien (should be default)
2. Click + Ajouter
3. Select vehicle
4. Select "Autre" type
5. Fill: Name="Frais inspection", Cost=3500, Date=today
6. Submit
7. Verify: expense appears in list
```

**Test 2: Verify Alert Created**
```
1. Go to Dashboard
2. Check 💰 Custom Expense Alert section
3. Verify alert shows: "Nouvelle dépense: Frais inspection - 3500 DZD"
```

**Test 3: Edit Vidange Mileage**
```
1. Create/Edit vidange expense
2. Verify 🚗 Kilométrage Actuel field is editable
3. Change value and save
4. Verify changes persist
```

---

## 🔍 Query Examples

### Get All Custom Expenses for a Car
```sql
SELECT * FROM vehicle_expenses 
WHERE car_id = 'car-uuid' AND type = 'autre'
ORDER BY date DESC;
```

### Get Active Alerts
```sql
SELECT * FROM active_maintenance_alerts 
WHERE alert_severity IN ('critical', 'high')
ORDER BY alert_date DESC;
```

### Calculate Total Expenses by Category
```sql
SELECT 
  expense_category,
  category_icon,
  COUNT(*) as count,
  SUM(cost) as total
FROM vehicle_expenses 
WHERE type = 'autre'
GROUP BY expense_category, category_icon
ORDER BY total DESC;
```

### Get Monthly Expense Trend
```sql
SELECT 
  DATE_TRUNC('month', date) as month,
  COUNT(*) as count,
  SUM(cost) as total
FROM vehicle_expenses
WHERE type = 'autre'
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;
```

---

## 🛠️ Troubleshooting

### Issue: Alerts not appearing on dashboard
**Solution:**
```sql
-- Manually trigger alert creation
SELECT * FROM create_alerts_for_expenses(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE);

-- Check if alerts were created
SELECT * FROM maintenance_cost_alerts LIMIT 10;
```

### Issue: Mileage field not editable
**Solution:**
- Verify `VehicleExpenseModal.tsx` has the new input field
- Check browser console for errors
- Refresh page if changes not reflected

### Issue: Default tab still showing store expenses
**Solution:**
- Verify `ExpensesPage.tsx` line ~20 has `'vehicle'` not `'store'`
- Clear browser cache: `Ctrl+Shift+Delete`
- Hard refresh: `Ctrl+F5`

---

## 📊 Data Validation

### Constraints Applied
```
- expense_category: Not required for vidange/assurance/controle (only for autre)
- cost: Must be ≥ 0
- date: Must be valid date, max current date
- currentMileage: Must be ≥ 0
- nextVidangeKm: Must be > 0
- alert_severity: Must be in ('low', 'medium', 'high', 'critical')
```

### Business Rules
```
1. Vidange expenses must have current_mileage
2. Assurance/Controle must have expiration_date
3. Autre expenses must have expense_name
4. All expenses must have car_id and date
5. Alerts auto-created only for 'autre' type
6. Severity calculated from cost against daily_rate
```

---

## 🔐 Security Considerations

1. **Row Level Security (RLS):**
   - Uncomment RLS policies in migration if needed
   - Implement agency-based filtering

2. **Input Validation:**
   - Frontend: Form validation
   - Backend: Database constraints
   - Use parameterized queries

3. **Cost Limits:**
   - Set reasonable max cost values
   - Validate cost > 0

4. **Audit Trail:**
   - All operations recorded with timestamps
   - created_at/updated_at fields
   - Consider audit table for sensitive changes

---

## 📈 Performance Optimization

### Indexes Created
```
- vehicle_expenses (type, expense_category)
- vehicle_expenses (car_id, alert_sent, created_at DESC)
- maintenance_cost_alerts (car_id, alert_date DESC)
- maintenance_cost_alerts (alert_severity, alert_date DESC)
- vehicle_expense_categories (is_active, display_order)
```

### Query Performance Tips
```
1. Always filter by car_id first
2. Use alert_date index for recent alerts
3. Limit results for dashboard (LIMIT 50)
4. Archive old alerts after 90 days
```

---

## 🔄 Maintenance & Updates

### Regular Tasks
1. **Weekly:** Review high-severity alerts
2. **Monthly:** Archive old alerts (>90 days)
3. **Quarterly:** Update expense categories if needed
4. **Annually:** Review and adjust cost thresholds

### Cleanup Script
```sql
-- Archive old alerts (run monthly)
DELETE FROM maintenance_cost_alerts
WHERE created_at < CURRENT_DATE - INTERVAL '90 days'
  AND alert_severity NOT IN ('critical', 'high');
```

---

## 📞 Support & References

### Files Referenced
- `src/components/VehicleExpenseModal.tsx` - Form component
- `src/components/ExpensesPage.tsx` - Main page container
- `src/types.ts` - TypeScript interfaces
- `src/utils/vidangeAlerts.ts` - Alert logic

### Database Documentation
- Migration file: `COMPLETE_CUSTOM_EXPENSES_MIGRATION.sql`
- Backup migration: `add_custom_expenses_feature.sql`

### Contact
For questions or issues, refer to database logs:
```sql
-- Check trigger execution
SELECT * FROM pg_stat_user_functions WHERE funcname = 'create_expense_alert';

-- Monitor alert creation
SELECT COUNT(*) FROM maintenance_cost_alerts WHERE created_at > NOW() - INTERVAL '24 hours';
```

---

**Last Updated:** April 9, 2026
**Status:** ✅ Complete & Production-Ready
