# Reservation System - Complete Implementation Guide

## Overview
This guide provides complete instructions for integrating the reservation system with the database across all steps.

---

## DATABASE SETUP

### 1. Execute SQL File
Run the `reservations_database_setup.sql` file in your Supabase SQL editor to create:
- `reservations` table (main reservation data)
- `vehicle_inspections` table (inspection records)
- `inspection_checklist_items` table (predefined checklist items)
- `inspection_responses` table (checklist responses per inspection)
- `reservation_services` table (additional services)
- `payments` table (payment records)
- RLS policies and storage bucket policies

### 2. Storage Bucket Configuration
Already created at: `https://supabase.com/dashboard/project/tjyqmxiqeegcnvopibyb/storage/files/buckets/inspection`

Policy already configured for authenticated uploads.

---

## STEP-BY-STEP IMPLEMENTATION

### STEP 1: DATES AND LOCATIONS (Pickup & Return)

**What to Display:**
1. Departure date, time, and agency selection
2. Return date, time, and agency selection
3. Agencies loaded from database

**Database Components:**
- Table: `reservations` (departure_date, departure_time, departure_agency_id, return_date, return_time, return_agency_id)
- Table: `agencies` (already exists - use for dropdown)

**Implementation:**
```typescript
// Load agencies from database
const agencies = await DatabaseService.getAgencies();

// When user submits:
// Store in formData.step1:
// - departureDate, departureTime, departureAgencyId
// - returnDate, returnTime, returnAgencyId
// - differentReturnAgency (boolean)
```

**Button Color:**
Change button colors to match CarsPage (blue gradient: `from-blue-600 to-purple-600`)

---

### STEP 2: VEHICLE SELECTION

**What to Display:**
1. List of available cars with images from database
2. Car details (specs, pricing)
3. Car images displayed exactly like CarsPage

**Database Components:**
- Table: `cars` (fetch all available cars)
- Field: `image_url` (main image)

**Implementation:**
```typescript
// Load cars from database
const cars = await DatabaseService.getCars();

// Filter available cars (status = 'available' AND no conflicting reservations)
const availableCars = cars.filter(car => car.status === 'available');

// Display car with image same as CarsPage:
<img 
  src={car.images[0] || 'https://picsum.photos/seed/car/400/300'}
  alt={`${car.brand} ${car.model}`}
  className="w-full h-full object-cover"
  referrerPolicy="no-referrer"
/>

// Store selected car in formData.step2.selectedCar
```

---

### STEP 3: DEPARTURE INSPECTION

#### Part 1: Vehicle Information
**Display:**
- Selected car info with image
- Mileage at departure
- Fuel level (select from: PLEIN, 1/2, 1/4, 1/8, VIDE)
- Inspection agency (select from database)
- Inspection notes (optional text)

**Database Components:**
- Table: `vehicle_inspections` (mileage, fuel_level, agency_id, notes)

#### Part 2: Inspection Checklist
**Display:**
- Load ALL items from database table `inspection_checklist_items`
- Organized by category (Sécurité, Équipements, Confort)
- Allow user to check/uncheck items
- Allow user to DELETE items from database
- Allow user to ADD custom items to database

**Database Components:**
- Table: `inspection_checklist_items` (all predefined items)
- Table: `inspection_responses` (save user's responses per item)

**Implementation:**
```typescript
// Load checklist items from database
const checklistItems = await ReservationsService.getChecklistItems();

// Group by category
const grouped = checklistItems.reduce((acc, item) => {
  if (!acc[item.category]) acc[item.category] = [];
  acc[item.category].push(item);
  return acc;
}, {});

// When user deletes item:
await ReservationsService.deleteChecklistItem(itemId);

// When user adds custom item:
await ReservationsService.addCustomChecklistItem(category, itemName);

// When user saves inspection:
// For each checked item:
await ReservationsService.saveInspectionResponse(
  inspectionId,
  checklistItemId,
  status, // true = OK, false = Issue
  note // optional issue notes
);
```

#### Part 3: Photos Upload
**Display:**
- 4 image upload sections:
  1. Extérieur Avant (Front exterior)
  2. Extérieur Arrière (Rear exterior)
  3. Intérieur (Interior)
  4. Autres (Other)

**Same method as:**
- CarsPage image upload
- ClientsPage image upload

**Implementation:**
```typescript
// Use same upload method as cars/clients:
const photoUrl = await ReservationsService.uploadInspectionPhoto(
  file,
  reservationId,
  'exterior-front' // or 'exterior-rear', 'interior', 'other'
);

// Storage path: inspection/inspection-{reservationId}-{photoType}-{timestamp}.jpg
```

#### Part 4: Client Signature
**Display:**
- Signature pad canvas (same component already exists)
- Capture signature and save to storage bucket

**Implementation:**
```typescript
// When signature is captured:
const signatureFile = dataURLToFile(signatureDataURL, 'signature.png');
const signatureUrl = await ReservationsService.uploadSignature(
  signatureFile,
  reservationId
);

// Storage path: inspection/signature-{reservationId}-{timestamp}.png
```

**Final Step 3 Submission:**
```typescript
const inspectionId = await ReservationsService.createInspection({
  reservationId,
  type: 'departure',
  mileage: parseInt(mileage),
  fuelLevel, // 'full', 'half', etc.
  agencyId: inspectionAgencyId,
  date: currentDate,
  time: currentTime,
  notes,
  exteriorFrontPhotoUrl,
  exteriorRearPhotoUrl,
  interiorPhotoUrl,
  otherPhotosUrls: [otherPhoto1, otherPhoto2, ...],
  clientSignatureUrl,
});

// Save all inspection responses
for (const [itemId, status] of Object.entries(responses)) {
  await ReservationsService.saveInspectionResponse(inspectionId, itemId, status);
}
```

---

### STEP 4: CLIENT SELECTION

**What to Display:**
1. List of existing clients with images from database
2. Same image display method as ClientsPage
3. Option to create new client (same form as ClientsPage)

**Database Components:**
- Table: `clients` (already exists)
- Field: `profile_photo` (client image)

**Implementation:**
```typescript
// Load clients from database
const clients = await DatabaseService.getClients();

// Display client with image same as ClientsPage:
<img 
  src={client.profilePhoto}
  alt={client.firstName}
  className="w-12 h-12 rounded-full object-cover"
  referrerPolicy="no-referrer"
/>

// For NEW CLIENT button:
// Use SAME form as ClientsPage - don't create separate table
// Upload profile photo to 'clients' bucket (same as ClientsPage)
// Upload documents to 'clients' bucket

// Store selected client in formData.step4
```

**Button Color:**
Change "➕ Nouveau Client" button to match CarsPage button color

---

### STEP 5: ADDITIONAL SERVICES

**What to Display:**
1. List of available services
2. Option to add services (button with CarsPage button color)
3. Services saved in database
4. Delete button for each service

**Database Components:**
- Table: `reservation_services`
  - category: 'decoration' | 'equipment' | 'insurance' | 'service' | 'driver'
  - service_name, price, etc.

**Special Case - Driver Service:**
If user activates "🚗 Chauffeur (Optionnel)":
- Load all workers with role = 'driver' from `workers` table
- Let user select driver
- Save driver_id in reservation_services

**Implementation:**
```typescript
// Add service to reservation:
const serviceId = await ReservationsService.addService({
  reservationId,
  category: 'driver',
  serviceName: 'Chauffeur',
  price: driverPrice,
  driverId: selectedDriverId, // if driver service
});

// Delete service:
await ReservationsService.deleteService(serviceId);

// Load drivers for selection:
const drivers = await DatabaseService.getWorkers({ type: 'driver' });
```

**Button Color:**
Change "Créer un Service" button to match CarsPage button color

---

### STEP 6: FINAL PRICING & SUMMARY

**What to Display:**
1. Reservation period and days calculation
2. Vehicle details with image from database
3. Client information from database
4. Departure and return locations (agency names from database)
5. Price breakdown:
   - Base price per day × number of days
   - Subtotal
   - TVA (if applied)
   - Total rental
   - Deposit (refundable)
   - Advance payment
   - Remaining payment
6. Payment notes (optional)

**Database Components:**
All data comes from:
- `reservations` (pricing, dates)
- `cars` (car details, images, pricing)
- `clients` (client info)
- `agencies` (location names)
- `reservation_services` (additional fees)

**Implementation:**
```typescript
// Calculate total price:
const totalDays = calculateDays(departureDate, returnDate);
const pricePerDay = car.priceDay;
const baseCost = totalDays * pricePerDay;

// Add services
const servicesTotal = services.reduce((sum, s) => sum + s.price, 0);

// Calculate TVA if enabled
const tvaAmount = tvaApplied ? (baseCost + servicesTotal) * 0.19 : 0;

// Final total
const totalPrice = baseCost + servicesTotal + tvaAmount;
const remainingPayment = totalPrice - advancePayment;

// Display all from database
<img src={car.images[0]} alt={car.brand} />
<p>{client.firstName} {client.lastName}</p>
<p>{departureAgency.name}</p>
<p>{returnAgency.name}</p>
```

**Final Submit:**
```typescript
// Create reservation with all data
const reservationId = await ReservationsService.createReservation({
  clientId,
  carId,
  departureDate,
  departureTime,
  departureAgencyId,
  returnDate,
  returnTime,
  returnAgencyId,
  pricePerDay: car.pricePerDay,
  priceWeek: car.priceWeek,
  priceMonth: car.priceMonth,
  totalDays,
  totalPrice,
  deposit: car.deposit,
  discountAmount,
  discountType,
  advancePayment,
  remainingPayment,
  notes: paymentNotes,
});

// Status = 'pending' initially
// User can activate it from PlannerPage list
```

**Button Color:**
Change "✅ Créer Réservation" button to match CarsPage button color (blue gradient)

---

## PLANNER PAGE (Main Reservations List)

### Display Reservations List

**What to Show for Each Reservation:**
1. Car image (from database)
2. Client image (from database)
3. Reservation period (dates)
4. Car brand/model
5. Client name
6. Status badge
7. Action buttons

**Implementation:**
```typescript
// Load reservations from database
const reservations = await ReservationsService.getReservations({
  status: filterStatus,
});

// For each reservation:
<div className="flex items-center gap-4">
  {/* Car Image */}
  <img 
    src={reservation.car.images[0]}
    alt={reservation.car.brand}
    className="w-16 h-12 rounded-lg object-cover"
    referrerPolicy="no-referrer"
  />
  
  {/* Client Image */}
  <img 
    src={reservation.client.profilePhoto}
    alt={reservation.client.firstName}
    className="w-10 h-10 rounded-full object-cover"
    referrerPolicy="no-referrer"
  />
  
  {/* Details */}
  <div>
    <p>{reservation.car.brand} {reservation.car.model}</p>
    <p>{reservation.client.firstName} {reservation.client.lastName}</p>
    <p>{reservation.step1.departureDate} → {reservation.step1.returnDate}</p>
  </div>
</div>
```

### Action Buttons
1. **View Details** → Show ReservationDetailsView
2. **Edit** → Edit reservation (if status = 'pending')
3. **Activate** → Change status to 'active'
4. **Complete** → Change status to 'completed' (requires return inspection)
5. **Cancel** → Change status to 'cancelled'
6. **Delete** → Delete reservation from database
7. **Print** → Generate PDF/Print reservation

**Implementation:**
```typescript
// View details
const reservation = await ReservationsService.getReservationById(id);

// Activate
await ReservationsService.activateReservation(id);

// Complete
await ReservationsService.completeReservation(id, returnInspectionId);

// Cancel
await ReservationsService.cancelReservation(id);

// Delete
await ReservationsService.deleteReservation(id);
```

### Details View

**What to Display:**
1. All reservation information from database
2. Car image and details
3. Client image and details
4. Both inspections (departure & return) with:
   - Photos
   - Checklist status
   - Signature
   - Mileage and fuel level
5. Services list
6. Payments history
7. All pricing details

**Implementation:** Load via `ReservationsService.getReservationById()` which includes all related data

---

## BUTTON COLOR STANDARDIZATION

Change all action buttons in CreateReservationForm to match CarsPage:
- **Primary buttons** (Create, Add, Submit): `from-blue-600 to-purple-600`
- **Hover**: `from-blue-700 to-purple-700`
- Classes: `bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black`

Buttons to update:
1. ➕ Nouveau Client
2. Créer un Service  
3. ✅ Créer Réservation
4. Step navigation buttons

---

## IMAGE UPLOAD STANDARDIZATION

All images use same method:

**Cars:**
- Upload: Supabase storage bucket `cars`
- URL: Stored in `cars.image_url`
- Display: `referrerPolicy="no-referrer"`

**Clients:**
- Upload: Supabase storage bucket `clients`
- URL: Stored in `clients.profile_photo`
- Display: `referrerPolicy="no-referrer"`

**Inspection Photos & Signature:**
- Upload: Supabase storage bucket `inspection`
- URLs: Stored in `vehicle_inspections` columns
- Display: `referrerPolicy="no-referrer"`
- Path format: `inspection/{reservationId}-{type}-{timestamp}.{ext}`

**Code pattern for all uploads:**
```typescript
const { data, error } = await supabase.storage
  .from('bucket-name')
  .upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  });

const { data: publicUrl } = supabase.storage
  .from('bucket-name')
  .getPublicUrl(data.path);

return publicUrl.publicUrl;
```

---

## FILTERING & SEARCH

Implement on PlannerPage:
1. **Status filter**: pending, confirmed, active, completed, cancelled
2. **Search**: By client name or reservation ID
3. **Date range**: Filter by departure date
4. **Sort**: By date, status, client name

**Implementation:**
```typescript
const filtered = reservations.filter(r => {
  if (filterStatus !== 'all' && r.status !== filterStatus) return false;
  if (searchQuery && !r.client.firstName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
  return true;
});
```

---

## NOTES & BEST PRACTICES

1. **Always use database first** - Don't use mock data in production
2. **Handle errors gracefully** - Show toast notifications for failures
3. **Validate dates** - Ensure return date > departure date
4. **Check availability** - Verify car isn't already booked for dates
5. **Image optimization** - All images use `referrerPolicy="no-referrer"`
6. **Consistent UX** - Use same colors, sizes, spacing across all forms
7. **Data validation** - Validate all inputs before sending to database
8. **Timestamps** - Always use ISO format for dates/times
9. **RLS policies** - All tables have authenticated-only access

---

## TESTING CHECKLIST

- [ ] Step 1: Agencies load from database
- [ ] Step 2: Cars display with correct images
- [ ] Step 3: Checklist items load from database
- [ ] Step 3: Photos upload to storage bucket
- [ ] Step 3: Signature uploads to storage bucket
- [ ] Step 4: Clients load with images
- [ ] Step 5: Services save/delete from database
- [ ] Step 5: Driver dropdown shows database drivers
- [ ] Step 6: All pricing calculated correctly
- [ ] Reservation created in database
- [ ] PlannerPage shows reservations with images
- [ ] Action buttons work (activate, complete, delete)
- [ ] DetailsView displays all information
- [ ] All images display with correct referrer policy
