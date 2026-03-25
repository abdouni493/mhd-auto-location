# 📊 Period-Based Availability Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER CREATES RESERVATION                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Select Departure & Return Dates                         │
│  - Departure: March 1, 2026                                     │
│  - Return: March 15, 2026                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Select Vehicle                                          │
│  [LOAD CARS] → DatabaseService.getAvailableCars(               │
│                  departureDate: "2026-03-01",                   │
│                  returnDate: "2026-03-15"                       │
│                )                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
    ┌───────────────────┐       ┌───────────────────┐
    │ DatabaseService  │       │ DatabaseService  │
    │ getAvailableCars │       │getReservedCars   │
    └───────────────────┘       │ForPeriod         │
         │                      └───────────────────┘
         │                              │
         ▼                              ▼
    ┌──────────────────────────────────────────┐
    │ Check Date Overlaps                      │
    │                                          │
    │ For each car with reservations:         │
    │   IF (depDate < resEnd) AND             │
    │      (retDate > resStart)               │
    │   THEN: OVERLAP (car unavailable)       │
    │   ELSE: NO OVERLAP (car available)      │
    │                                          │
    └──────────────────────────────────────────┘
         │                              │
         ▼                              ▼
    Return Available Cars      Return Reserved Cars
         │                              │
         └─────────────┬────────────────┘
                       ▼
    ┌──────────────────────────────────┐
    │ RENDER CAR SELECTION UI           │
    │  - Display Available Cars         │
    │  - Show Reserved Cars Alert       │
    │    (amber/warning style)          │
    └──────────────────────────────────┘
                       │
                       ▼
            ┌────────────────────┐
            │ User Selects Car   │
            └────────────────────┘
                       │
                       ▼
           ✅ Proceed to Step 3
```

## Date Overlap Algorithm

```
Input: NewReservation(startDate, endDate)
       ExistingReservation(resStart, resEnd)

Output: HasOverlap (boolean)

Logic:
  HasOverlap = (newStart < resEnd) AND (newEnd > resStart)

Examples:
  
  New: Mar 1-15    Existing: Mar 5-20    → OVERLAP ✗
  ┌─────────────┐
  ├─────────────────────────┤
       ▲ Overlap starts

  
  New: Mar 1-15    Existing: Mar 16-30   → NO OVERLAP ✅
  ├─────────────┤
                  ├───────────────────┤
                  ▲ Clear separation


  New: Mar 1-15    Existing: Mar 14-30   → OVERLAP ✗
  ├─────────────┤
             ├──────────────────────┤
                ▲ Overlaps on 14-15


  New: Mar 1-15    Existing: Mar 1-15    → OVERLAP ✗
  ├─────────────┤
  ├─────────────┤
  ▲ Same period (exact match)
```

## Component Interaction

```
CreateReservationForm
│
├─ Step 1 (Dates)
│  └─ User selects March 1-15
│     └─ [dates stored in formData.step1]
│
├─ Step 2 (Vehicle Selection) ← YOU ARE HERE
│  │
│  ├─ useEffect() triggered when dates change
│  │  │
│  │  ├─ Call: DatabaseService.getAvailableCars(
│  │  │         "2026-03-01",    // departureDate
│  │  │         "2026-03-15"     // returnDate
│  │  │       )
│  │  │
│  │  ├─ Call: DatabaseService.getReservedCarsForPeriod(
│  │  │         "2026-03-01",
│  │  │         "2026-03-15"
│  │  │       )
│  │  │
│  │  └─ setState(cars, reservedCars)
│  │
│  └─ Render
│     │
│     ├─ IF reservedCars.length > 0
│     │  └─ <ReservedCarsAlert>
│     │     ├─ 🚗 Car images in grid
│     │     ├─ Car brand & model
│     │     ├─ Client name
│     │     └─ Reservation dates
│     │
│     └─ <AvailableCarsGrid>
│        └─ Maps cars array
│           └─ User clicks to select
│
├─ Step 3 (Inspection)
└─ ... (continues)
```

## Database Query Flow

```
USER INTERFACE
      │
      └─ DateRange: Mar 1-15
             │
             ▼
┌─────────────────────────────────────┐
│ DatabaseService.getAvailableCars()  │
└─────────────────────────────────────┘
             │
             ├─ Step 1: Get all cars with status='disponible'
             │           (no other status matters now)
             │
             ├─ Step 2: Fetch all active reservations
             │           SELECT car_id, departure_date, return_date
             │           FROM reservations
             │           WHERE status IN ('pending', 'confirmed', 'active')
             │
             ├─ Step 3: For each car, check overlaps
             │           Loop through reservations
             │           IF (Mar1 < res.endDate) AND 
             │              (Mar15 > res.startDate)
             │           THEN: Skip this car
             │           ELSE: Keep this car
             │
             └─ Return: Only non-overlapping cars
                        │
                        ▼
                   UI Shows: BMW, Mercedes, Toyota, Audi
```

## Timeline Visualization

```
SCENARIO: Two Cars, Multiple Reservations

CAR 1: BMW 3 Series
Timeline:
   Mar    Apr    May    Jun
   ├──────┼──────┼──────┼──────
   │ RES1 │ FREE │ RES2 │ FREE │
   Mar1 Mar15  Apr1 May15  
   
   RES1: Client A (Mar 1-15)  - LOCKED for this period
   RES2: Client B (May 1-15)  - LOCKED for this period
   
   Between March 15 and May 1: CAR IS AVAILABLE ✅
   

CAR 2: Mercedes E Class
Timeline:
   Mar    Apr    May    Jun
   ├──────┼──────┼──────┼──────
   │ FREE │ RES3 │ FREE │ RES4 │
   Mar15   May1   Jun15
   
   RES3: Client C (Apr 5-30) - LOCKED for this period
   RES4: Client D (Jun 1-20) - LOCKED for this period
   
   Before Apr 5: CAR IS AVAILABLE ✅
   Between May 1-31: CAR IS AVAILABLE ✅


TRYING TO BOOK CAR 1 FOR MARCH 1-15:
Timeline:
   │ Try │ Existing │
   ├─────┼──────────┤
   Match! → CONFLICT ✗

TRYING TO BOOK CAR 1 FOR MARCH 16-30:
Timeline:
   │ Existing │ Try │
   ├──────────┼─────┤
   No overlap! → ALLOWED ✅
```

## State Management

```
CreateReservationForm State:

formData: {
  step1: {
    departureDate: "2026-03-01",    ← USED HERE
    returnDate: "2026-03-15",       ← USED HERE
    departureTime: "10:00",
    returnTime: "16:00",
    ...
  },
  step2: {
    selectedCar: Car | null,        ← USER SELECTS
  },
  ...
}

Local State in Step2:
  cars: Car[]                       ← Available cars (filtered)
  reservedCars: Array<{             ← Cars with conflicts
    id, carId, brand, model,
    image, departureDate, returnDate,
    clientName
  }>
  isLoadingCars: boolean
  searchQuery: string


When user changes dates in Step 1:
  → formData.step1.departureDate changes
  → useEffect dependency triggers
  → useEffect calls loadCars()
  → loadCars() calls getAvailableCars(newDates)
  → New cars array rendered
  → User sees updated availability
```

## Error Handling

```
getAvailableCars() Error Flow:

TRY {
  ✓ Get all cars from DB
  ✓ Get all reservations from DB
  ✓ Check overlaps
  ✓ Return filtered cars
}
CATCH (error) {
  console.error('Error fetching active reservations:', error)
  
  IF error happened during reservations fetch:
    → Return all 'disponible' cars (fallback)
  
  This ensures:
    • App doesn't crash
    • User can still select cars
    • Worst case: shows more cars than should
}

getReservedCarsForPeriod() Error Flow:

TRY {
  ✓ Fetch overlapping reservations
  ✓ Format car details
  ✓ Return array
}
CATCH (error) {
  console.error('Error fetching reservations:', error)
  return []  ← Empty array
  
  Effect:
    • No reserved cars alert shown
    • But available cars are still correct
    • User can proceed normally
}
```

## Performance Considerations

```
Call Stack Timing:

User clicks Step 2
    │
    ├─ useEffect triggers (~1ms)
    │
    ├─ loadCars() starts
    │  │
    │  ├─ DatabaseService.getAvailableCars()
    │  │  │
    │  │  ├─ getCars() [Supabase query] ← ~200-500ms
    │  │  │  └─ Returns all cars
    │  │  │
    │  │  └─ getReservations() [Supabase query] ← ~200-500ms
    │  │     └─ Returns all active reservations
    │  │
    │  └─ Filtering [JavaScript] ← <1ms
    │
    ├─ DatabaseService.getReservedCarsForPeriod()
    │  └─ Supabase query [already cached] ← ~100ms
    │
    ├─ setState() ← triggers re-render
    │
    └─ UI renders with cars (~100ms)

Total: ~600-1200ms (depends on network)

Optimization:
  • Queries are only made when dates change
  • Results are cached in state
  • No queries on every keystroke
```

## Migration Path

```
OLD SYSTEM (Before Fix):
  Car Status → "disponible"
       ↓ [Create any reservation]
  Car Status → "loué"
       ↓ [Status stuck until manually reset]
  Can't use for new periods
  
  Data: Car.status = "loué"

NEW SYSTEM (After Fix):
  Car Status → "disponible" (NEVER CHANGES for availability)
       ↓ [Create reservation March 1-15]
  Reservation 1: March 1-15 stored
       ↓ [Try to create March 16-30]
  Check: Does March 16-30 overlap March 1-15?
  NO → ✅ ALLOWED
  
  Data: Car.status = "disponible" (same)
        Reservations: [res1: Mar1-15, res2: Mar16-30]

EXISTING DATA:
  • Old cars with status="loué" still work
  • System ignores status for availability
  • Can cleanup status field later if needed
```

## Security & Validation

```
Date Validation:

INPUT: departureDate="2026-03-01", returnDate="2026-03-15"

✓ Check: Return date > Departure date
  IF returnDate <= departureDate → ERROR

✓ Check: Dates are valid ISO format
  IF !isValidDate(departureDate) → ERROR

✓ Check: User permissions (from auth)
  IF !isAuthenticated → DENY

✓ Check: Reservation status
  Only count 'pending', 'confirmed', 'active'
  Ignore 'completed', 'cancelled'

✓ Check: No time zone issues
  All dates compared at UTC midnight
```

---

**For detailed explanations, see:** 
- [RESERVATION_PERIOD_AVAILABILITY_FIX.md](RESERVATION_PERIOD_AVAILABILITY_FIX.md)
- [PERIOD_AVAILABILITY_QUICK_GUIDE.md](PERIOD_AVAILABILITY_QUICK_GUIDE.md)
