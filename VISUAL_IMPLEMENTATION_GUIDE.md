# 🎨 Custom Vehicle Expenses - Visual Implementation Guide

## 📊 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     💰 DÉPENSES PAGE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────┐                          │
│  │ TAB SELECTION (Default: 🚗)      │                          │
│  ├──────────────────────────────────┤                          │
│  │ [🏪 Store]  [🚗 Vehicle] ← DEFAULT                         │
│  └──────────────────────────────────┘                          │
│           │                                                     │
│           └─→ Click [🚗 Vehicle]                               │
│               │                                                 │
│               ├─→ Show VehicleExpenseList                      │
│               ├─→ Click [+ Ajouter]                            │
│               │   │                                             │
│               │   └─→ VehicleExpenseModal opens               │
│               │       │                                         │
│               ▼       ▼                                         │
│        ┌──────────────────────────────────────┐               │
│        │  🚗 Dépense Véhicule Modal           │               │
│        ├──────────────────────────────────────┤               │
│        │ 🚗 Véhicule: [Select Dropdown]      │               │
│        │ 💰 Type: [🛢️|🛡️|🛠️|❓] ← Default  │               │
│        │                                      │               │
│        │ IF TYPE = VIDANGE:                   │               │
│        │  🚗 Kilométrage: [EDITABLE INPUT] ✨ │               │
│        │  💵 Coût (DZD): [INPUT]             │               │
│        │  📅 Date: [DATE PICKER]             │               │
│        │  ↩️ Km Prochaine: [INPUT]           │               │
│        │  🏁 Prochain: [AUTO-CALC DISPLAY]   │               │
│        │                                      │               │
│        │ IF TYPE = AUTRE:                     │               │
│        │  📝 Nom: [INPUT] ✨ NEW             │               │
│        │  💵 Coût (DZD): [INPUT]             │               │
│        │  📅 Date: [DATE PICKER]             │               │
│        │                                      │               │
│        │ 📄 Note (optionnel): [TEXTAREA]     │               │
│        │                                      │               │
│        │ [Annuler] [Ajouter/Modifier]        │               │
│        └──────────────────────────────────────┘               │
│               │                                                 │
│               └─→ ON SUBMIT:                                   │
│                   └─→ Save to database                         │
│                       │                                         │
│                       └─→ Trigger fires: create_expense_alert()│
│                           │                                     │
│                           └─→ Alert created                    │
│                                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│         INSERT INTO vehicle_expenses                    │
│  (car_id, type='autre', cost, date, expense_name, ...) │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ TRIGGER FIRES      │
        │ create_expense_... │
        └────────────┬───────┘
                     │
                     ▼
        ┌──────────────────────────────────┐
        │ FUNCTION:                        │
        │ calculate_expense_severity()     │
        ├──────────────────────────────────┤
        │ Input: cost = 3500 DZD           │
        │ Output: severity = 'medium'      │
        └────────────┬─────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────┐
        │ INSERT INTO                      │
        │ maintenance_cost_alerts          │
        │                                  │
        │ id: UUID                         │
        │ car_id: from vehicle_expenses    │
        │ expense_id: from vehicle_exp.    │
        │ expense_type: 'autre'            │
        │ expense_category: 'Frais inspect'│
        │ cost: 3500                       │
        │ alert_severity: 'medium'         │
        │ alert_message: 'Nouvelle dépense'│
        │ alert_sent: true                 │
        └────────────┬─────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────┐
        │ Alert now visible on Dashboard   │
        │ via active_maintenance_alerts    │
        │ VIEW                             │
        └──────────────────────────────────┘
```

---

## 🎯 User Workflow - Step by Step

### Workflow 1: Create Vidange with Editable Mileage

```
Step 1: User opens 💰 Dépenses
        └─→ 🚗 Vehicle tab shown by default ✨

Step 2: Click [+ Ajouter une dépense]
        └─→ Modal opens

Step 3: Select Vehicle
        └─→ "Toyota Corolla (XYZ123)"

Step 4: Click [🛢️ Vidange] type
        └─→ Shows vidange-specific fields

Step 5: Edit 🚗 Kilométrage Actuel
        └─→ User CAN NOW EDIT THIS FIELD ✨
        └─→ Before: Read-only (showed 45000)
        └─→ After:  Editable input box
        └─→ User enters: 48500

Step 6: Fill other fields
        💵 Coût: 5000
        📅 Date: 2026-04-09
        ↩️ Km Prochaine: 10000
        🏁 Prochain: (auto-shows 48500 + 10000 = 58500)
        📄 Note: "Oil change and filter"

Step 7: Click [Ajouter]
        └─→ Saved to database
        └─→ Expense appears in list
```

### Workflow 2: Create Custom Expense (Autre Type)

```
Step 1: User opens 💰 Dépenses
        └─→ 🚗 Vehicle tab shown by default ✨

Step 2: Click [+ Ajouter une dépense]
        └─→ Modal opens

Step 3: Select Vehicle
        └─→ "Honda Civic (ABC789)"

Step 4: Click [❓ Autre] type
        └─→ Shows custom expense fields ✨

Step 5: Fill custom expense form
        📝 Nom de la dépense: "Frais d'inspection"
        💵 Coût (DZD): 3500
        📅 Date: 2026-04-09
        📄 Note: "Contrôle technique annuel"

Step 6: Click [Ajouter]
        └─→ Saved to database
        └─→ Trigger function fires automatically ✨
        └─→ Alert created in maintenance_cost_alerts table
        └─→ Expense appears in list
        └─→ Alert appears on Dashboard ✨

Step 7: Go to Dashboard
        └─→ See new alert in 💰 section
        └─→ Message: "Nouvelle dépense: Frais d'inspection - 3500 DZD"
        └─→ Severity: 🟡 MEDIUM (based on cost)
        └─→ Car: Honda Civic (ABC789)
```

---

## 🎨 UI Component Structure

### VehicleExpenseModal Component Tree

```
VehicleExpenseModal
├── Header
│   ├── Title: 🚗 Dépense Véhicule
│   └── Close Button
│
├── Form
│   ├── Car Selection
│   │   └── <select> with cars dropdown
│   │
│   ├── Expense Type Selector
│   │   ├── [🛢️ Vidange]
│   │   ├── [🛡️ Assurance]
│   │   ├── [🛠️ Contrôle]
│   │   └── [❓ Autre]
│   │
│   ├── CONDITIONAL: IF Type = VIDANGE
│   │   ├── 🚗 Kilométrage Actuel [INPUT] ✨ EDITABLE
│   │   ├── 💵 Coût (DZD) [INPUT]
│   │   ├── 📅 Date [DATE]
│   │   ├── ↩️ Km Prochaine [INPUT]
│   │   ├── 🏁 Prochain [DISPLAY - auto-calc]
│   │   └── 📄 Note [TEXTAREA]
│   │
│   ├── CONDITIONAL: IF Type = ASSURANCE
│   │   ├── 💵 Coût (DZD) [INPUT]
│   │   ├── 📅 Date [DATE]
│   │   ├── 🛡️ Date d'expiration [DATE]
│   │   └── 📄 Note [TEXTAREA]
│   │
│   ├── CONDITIONAL: IF Type = CONTRÔLE
│   │   ├── 💵 Coût (DZD) [INPUT]
│   │   ├── 📅 Date [DATE]
│   │   ├── 🛠️ Date d'expiration [DATE]
│   │   └── 📄 Note [TEXTAREA]
│   │
│   └── CONDITIONAL: IF Type = AUTRE ✨
│       ├── 📝 Nom de la dépense [INPUT] ✨ NEW
│       ├── 💵 Coût (DZD) [INPUT]
│       ├── 📅 Date [DATE]
│       └── 📄 Note [TEXTAREA]
│
└── Footer
    ├── [Annuler] Button
    └── [Ajouter/Modifier] Button
```

---

## 📊 Alert System Flow

### Alert Severity Color Coding

```
Cost Analysis (vs Daily Rate: 5000 DZD)

3500 DZD
  │
  ├─→ 0.7× daily rate
  │
  └─→ Severity: 🟡 MEDIUM
      Color: Orange
      Icon: ⚠️
      Status: Show but not urgent

2500 DZD
  │
  ├─→ 0.5× daily rate
  │
  └─→ Severity: 🟢 LOW
      Color: Green
      Icon: ℹ️
      Status: Informational

5000 DZD
  │
  ├─→ 1× daily rate
  │
  └─→ Severity: 🟠 HIGH
      Color: Orange-Red
      Icon: ⚠️
      Status: Needs attention

10000 DZD
  │
  ├─→ 2× daily rate
  │
  └─→ Severity: 🔴 CRITICAL
      Color: Red
      Icon: 🚨
      Status: Urgent - highlight on dashboard
```

### Alert Timeline

```
T=0ms     User clicks "Ajouter"
  │
  ├─→ Frontend validates form
  │
  ├─→ Submit POST request to backend
  │
  ├─→ Backend inserts into vehicle_expenses
  │
  ├─→ PostgreSQL TRIGGER fires immediately
  │   (create_expense_alert)
  │
  ├─→ Function calculates severity
  │   cost: 3500 DZD → severity: "medium"
  │
  ├─→ Alert inserted into maintenance_cost_alerts
  │
  ├─→ Trigger completes
  │
  ├─→ Response returns to frontend
  │
  └─→ Modal closes, expense appears in list

T+500ms   User navigates to Dashboard
  │
  ├─→ Dashboard loads
  │
  ├─→ Query runs: SELECT * FROM active_maintenance_alerts
  │
  ├─→ New alert returned from database
  │
  ├─→ Alert renders on screen with:
  │   - Emoji icon (🔍)
  │   - Category (Frais d'inspection)
  │   - Cost (3500 DZD)
  │   - Severity (MEDIUM - orange)
  │   - Message (Nouvelle dépense...)
  │   - Animation (fadeIn + scale)
  │
  └─→ 💰 Custom Expense Alert section visible ✨
```

---

## 🗂️ Database Relationship Diagram

```
┌──────────────────┐
│   vehicles       │
├──────────────────┤
│ id (PK)          │
│ brand            │
│ model            │
│ registration     │
│ mileage          │
│ ...              │
└────────┬─────────┘
         │ (1)
         │
         │ (many)
         │
         ▼
┌──────────────────────────────────────┐
│   vehicle_expenses                   │
├──────────────────────────────────────┤
│ id (PK)                              │
│ car_id (FK) ──────────────┐          │
│ type: 'vidange'|...|'autre'│         │
│ cost                       │          │
│ date                       │          │
│ expense_category ✨ NEW   │          │
│ category_icon ✨ NEW      │          │
│ alert_sent ✨ NEW         │          │
│ current_mileage (vidange) │          │
│ next_vidange_km (vidange) │          │
│ expense_name (autre)      │          │
│ expiration_date (other)   │          │
│ created_at                │          │
└──────┬────────────────────┘          │
       │                               │
       │ (FK to car_id)                │
       │                               │
       │ TRIGGER:create_expense_alert()│
       │                               │
       ▼                               │
┌─────────────────────────────────┐   │
│ maintenance_cost_alerts ✨      │   │
├─────────────────────────────────┤   │
│ id (PK)                         │   │
│ car_id (FK) ←──────────────────┘   │
│ expense_id (FK to exp.) ─────────┐  │
│ expense_type                      │  │
│ expense_category                  │  │
│ cost                              │  │
│ alert_date                        │  │
│ alert_severity (calc'd)           │  │
│ alert_message                     │  │
│ alert_sent                        │  │
│ created_at                        │  │
└─────────────────────────────────┘  │
       │                              │
       │ QUERIED BY:                  │
       ▼                              │
┌─────────────────────────────────┐  │
│ active_maintenance_alerts (VIEW)│  │
├─────────────────────────────────┤  │
│ Shows alerts ordered by:        │  │
│ - alert_date DESC              │  │
│ - alert_severity DESC          │  │
│                                │  │
│ USED BY: Dashboard ────────────┘  │
└─────────────────────────────────┘

┌──────────────────────────────────┐
│ vehicle_expense_categories ✨    │
├──────────────────────────────────┤
│ id (PK)                          │
│ category_name: UNIQUE           │
│ icon: '🔍', '⚙️', etc.         │
│ description                      │
│ display_order                    │
│ is_active                        │
│ created_at                       │
│ updated_at                       │
├──────────────────────────────────┤
│ 16 Predefined Categories        │
│ (lookup/reference table)        │
└──────────────────────────────────┘
```

---

## 🔄 State Management Flow

```
ExpensesPage Component State

┌─────────────────────────────────────┐
│ useState<'store'|'vehicle'>('vehicle')│  ← DEFAULT NOW VEHICLE ✨
└────────┬────────────────────────────┘
         │
         ▼
    [Tab Selection]
    🚗 Vehicle selected
         │
         ▼
    Load vehicleExpenses from database
         │
         ├─→ getVehicleExpenses()
         │
         └─→ setVehicleExpenses([...])
              │
              ▼
         ┌──────────────────────────────────┐
         │ Component Renders                 │
         ├──────────────────────────────────┤
         │ Show: VehicleExpenseCard[] map   │
         │ Each card shows:                  │
         │ - Expense type icon              │
         │ - Category name                  │
         │ - Cost in DZD                    │
         │ - Date                           │
         │ - Edit/Delete buttons            │
         └──────────────────────────────────┘
              │
              ▼
         Click [+ Ajouter]
              │
              └─→ setIsModalOpen(true)
                  └─→ VehicleExpenseModal shows
                      │
                      └─→ User fills form
                          └─→ Clicks Ajouter
                              │
                              └─→ handleSaveVehicleExpense()
                                  │
                                  ├─→ addVehicleExpense(data)
                                  │   ├─→ Database insert
                                  │   └─→ Trigger fires
                                  │
                                  ├─→ Refresh list
                                  │   └─→ getVehicleExpenses()
                                  │
                                  └─→ Close modal
                                      └─→ setIsModalOpen(false)
```

---

## 📱 Responsive Design Considerations

```
Desktop (1920px+)
┌─────────────────────────────────────────────────────────────┐
│ 💰 Dépenses                                                 │
├─────────────────────────────────────────────────────────────┤
│ [🏪 Store] [🚗 Vehicle]              [+ Ajouter]           │
│                                                             │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│ │ Expense1 │  │ Expense2 │  │ Expense3 │  │ Expense4 │   │
│ │ 🔍       │  │ ⚙️       │  │ 🛞       │  │ 🔋       │   │
│ │ 3500 DZD │  │ 5000 DZD │  │8000 DZD │  │ 2000 DZD │   │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│ │ Expense5 │  │ Expense6 │  │ Expense7 │                  │
│ │ 🛑       │  │ 🪟       │  │ ⛽       │                  │
│ │ 4000 DZD │  │ 6000 DZD │  │ 2500 DZD │                  │
│ └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘

Mobile (375px)
┌──────────────┐
│ 💰 Dépenses │
├──────────────┤
│ [🏪] [🚗] [+]│
│              │
│ ┌──────────┐ │
│ │ Expense1 │ │
│ │ 🔍       │ │
│ │ 3500 DZD │ │
│ └──────────┘ │
│              │
│ ┌──────────┐ │
│ │ Expense2 │ │
│ │ ⚙️       │ │
│ │ 5000 DZD │ │
│ └──────────┘ │
│              │
│ ┌──────────┐ │
│ │ Expense3 │ │
│ │ 🛞       │ │
│ │ 8000 DZD │ │
│ └──────────┘ │
└──────────────┘
```

---

## ✨ Key Changes Summary

### Change 1: Default Tab
```
BEFORE: Expenses page opens → Show Store expenses (🏪)
AFTER:  Expenses page opens → Show Vehicle expenses (🚗) ✨

File: src/components/ExpensesPage.tsx
Line: const [expenseType, ...] = useState(...'vehicle')
```

### Change 2: Editable Mileage
```
BEFORE: 🚗 Kilométrage Actuel [READ-ONLY DISPLAY: 45000 KM]
AFTER:  🚗 Kilométrage Actuel [EDITABLE INPUT BOX] ✨

File: src/components/VehicleExpenseModal.tsx
Old:  <div>45000 KM</div>
New:  <input type="number" value={currentMileage} onChange={...} />
```

### Change 3: Custom Expense Type
```
BEFORE: When type='autre': Show placeholder form
AFTER:  When type='autre': Show custom form with:
        - 📝 Nom de la dépense field ✨
        - Category selection from 16 options
        - Auto-creates alert on submit ✨

File: src/components/VehicleExpenseModal.tsx
New Conditional: {formData.type === 'autre' && ( ... )}
```

---

**Created:** April 9, 2026  
**Format:** Visual/Diagram  
**Purpose:** Understanding system architecture and workflows
