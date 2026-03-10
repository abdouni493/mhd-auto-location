# SQL CODE SUMMARY FOR RESERVATION SYSTEM

## Database Tables Created

### 1. reservations
Main table storing all reservation details
```sql
Columns:
- id (UUID, Primary Key)
- client_id (FK → clients)
- car_id (FK → cars)
- departure_date, departure_time, departure_agency_id
- return_date, return_time, return_agency_id
- price_per_day, price_week, price_month, total_price
- deposit, discount_amount, discount_type
- advance_payment, remaining_payment
- tva_applied, tva_amount, additional_fees
- excess_mileage, missing_fuel
- status ('pending', 'confirmed', 'active', 'completed', 'cancelled')
- notes, created_at, activated_at, completed_at
```

**Indexes:** client_id, car_id, status, departure_date

---

### 2. vehicle_inspections
Stores departure and return inspection data
```sql
Columns:
- id (UUID, Primary Key)
- reservation_id (FK → reservations)
- type ('departure' or 'return')
- mileage (integer)
- fuel_level ('full', 'half', 'quarter', 'eighth', 'empty')
- agency_id (FK → agencies)
- exterior_front_photo (URL from storage)
- exterior_rear_photo (URL from storage)
- interior_photo (URL from storage)
- other_photos (array of URLs)
- client_signature (URL from storage)
- notes (text)
- date, time, created_at
```

**Usage:** 1 per inspection (departure or return)

---

### 3. inspection_checklist_items
Predefined checklist items (loaded from database, not hardcoded)
```sql
Columns:
- id (UUID, Primary Key)
- category ('securite', 'equipements', 'confort')
- item_name (text)
- display_order (integer)
- created_at

Pre-populated with:
- 12 Security items (Ceintures, Freins, Feux, etc.)
- 12 Equipment items (GPS, Siège bébé, etc.)
- 12 Comfort items (Sièges, Volant, etc.)
```

**Users can:**
- Add custom items to database
- Delete items from database
- Items persist across all reservations

---

### 4. inspection_responses
User's responses to each checklist item (one per item per inspection)
```sql
Columns:
- id (UUID, Primary Key)
- inspection_id (FK → vehicle_inspections)
- checklist_item_id (FK → inspection_checklist_items)
- status (boolean: true=OK, false=Issue)
- note (optional text for issues)
```

**Unique constraint:** (inspection_id, checklist_item_id)

---

### 5. reservation_services
Additional services selected for reservation
```sql
Columns:
- id (UUID, Primary Key)
- reservation_id (FK → reservations)
- category ('decoration', 'equipment', 'insurance', 'service', 'driver')
- service_name (text)
- description (text, optional)
- price (numeric)
- driver_id (FK → workers, only for driver service)
- created_at
```

**Users can:**
- Add services (persisted to database)
- Delete services (removed from database)

---

### 6. payments
Payment records for reservation
```sql
Columns:
- id (UUID, Primary Key)
- reservation_id (FK → reservations)
- amount (numeric)
- payment_method ('cash', 'card', 'transfer', 'check')
- status ('pending', 'completed', 'failed')
- note (text)
- date (date)
- created_at
```

**Users can:**
- Add payment records
- Delete payment records
- View payment history per reservation

---

## Storage Buckets Configuration

### inspection bucket
**Path:** `inspection/{filename}`
**Policy:** `CREATE POLICY "Allow authenticated uploads to inspection"...`

**File naming convention:**
- Photos: `inspection-{reservationId}-{photoType}-{timestamp}.jpg`
  - photoType: 'exterior-front', 'exterior-rear', 'interior', 'other'
  - Example: `inspection-uuid-exterior-front-1699999999.jpg`
  
- Signatures: `signature-{reservationId}-{timestamp}.png`
  - Example: `signature-uuid-1699999999.png`

**Access:** Public read, authenticated write/update/delete

---

## Foreign Key Relationships

```
reservations
├── client_id → clients.id
├── car_id → cars.id
├── departure_agency_id → agencies.id
└── return_agency_id → agencies.id

vehicle_inspections
├── reservation_id → reservations.id
└── agency_id → agencies.id

inspection_responses
├── inspection_id → vehicle_inspections.id
└── checklist_item_id → inspection_checklist_items.id

reservation_services
├── reservation_id → reservations.id
└── driver_id → workers.id (optional, for driver service)

payments
└── reservation_id → reservations.id
```

---

## Row Level Security (RLS) Policies

All tables have RLS enabled with policy:
```sql
"Allow authenticated to manage [table]"
FOR ALL USING (auth.role() = 'authenticated');
```

Checklist items allow public read:
```sql
"Allow public to read checklist items"
FOR SELECT USING (true);
```

Storage bucket policies:
```sql
- INSERT: Authenticated users can upload
- UPDATE: Authenticated users can update
- DELETE: Authenticated users can delete
- SELECT: Public read access
```

---

## Service Methods Available (ReservationsService)

### Reservations
- `createReservation()` → Create new reservation (status='pending')
- `getReservations()` → Get list with filters
- `getReservationById()` → Get single reservation with all related data
- `updateReservation()` → Update pricing, notes, status
- `activateReservation()` → Set status='active', set activated_at
- `completeReservation()` → Set status='completed', set completed_at
- `cancelReservation()` → Set status='cancelled'
- `deleteReservation()` → Delete from database

### Inspections
- `createInspection()` → Create new inspection with all photos/signature URLs
- `getInspection()` → Get inspection with all responses
- `saveInspectionResponse()` → Save/update checklist item response
- `getChecklistItems()` → Get all checklist items from database
- `addCustomChecklistItem()` → Add new item to database
- `deleteChecklistItem()` → Delete item from database

### Services
- `addService()` → Add service to reservation
- `deleteService()` → Remove service from reservation
- `getServices()` → Get services for reservation

### Payments
- `addPayment()` → Add payment record
- `getPayments()` → Get payment history for reservation
- `deletePayment()` → Delete payment record

### File Upload
- `uploadInspectionPhoto()` → Upload photo to storage, return URL
- `uploadSignature()` → Upload signature to storage, return URL
- `deleteInspectionFile()` → Delete file from storage

---

## Data Flow Summary

### Creating a Reservation

```
Step 1: User selects dates & agencies
  ↓
Step 2: User selects car
  ↓
Step 3: Departure Inspection
  - Save: vehicle_inspections (type='departure')
  - Upload: Photos & signature to storage
  - Save: inspection_responses for each checklist item
  ↓
Step 4: Select or create client
  - Use existing clients table
  ↓
Step 5: Add services (optional)
  - Save: reservation_services
  ↓
Step 6: Final pricing & summary
  - Create: reservations record
  - Status: 'pending'
  ↓
PlannerPage: Shows in list
  - Activate → status='active', activated_at=now()
  - Complete → status='completed', completed_at=now()
  - Delete → deleted from database
```

### Return Process

```
From reservation with status='active':
  ↓
Create Return Inspection
  - Save: vehicle_inspections (type='return')
  - Upload: Return photos & signature
  - Save: inspection_responses
  ↓
Complete Reservation
  - Update: reservations status='completed'
  - Save: Return inspection ID
```

---

## Important Notes

1. **Checkout Items from Database**
   - NOT hardcoded in React
   - Load from `inspection_checklist_items` table
   - Users can add/delete items which persist

2. **Images Use Storage Bucket**
   - NOT stored directly in database
   - URLs stored in database
   - Same method as cars and clients

3. **Cascading Deletes**
   - Delete reservation → Auto-delete related inspections
   - Delete inspection → Auto-delete related responses
   - Delete services → Auto-delete associated records

4. **Status Workflow**
   - 'pending' → 'confirmed' → 'active' → 'completed'
   - Can be 'cancelled' at any point
   - 'pending' reservations are editable

5. **Pricing Calculation**
   - All prices stored in database
   - Discount, TVA, advance payment tracked
   - Remaining payment calculated
   - All stored for audit trail

6. **Multi-Agency Support**
   - Same car can be picked up at one agency
   - Returned at different agency
   - Both agencies tracked in reservation

---

## Configuration Checklist

- [x] reservations_database_setup.sql created
- [x] ReservationsService.ts created with all methods
- [x] RESERVATION_IMPLEMENTATION_GUIDE.md created
- [x] SQL tables defined
- [x] RLS policies configured
- [x] Storage bucket policies configured
- [ ] **NEXT: Update CreateReservationForm to use ReservationsService**
- [ ] **NEXT: Update PlannerPage to load from database**
- [ ] **NEXT: Change button colors to blue gradient**
- [ ] **NEXT: Connect all form steps to database**
- [ ] **NEXT: Test all operations**

