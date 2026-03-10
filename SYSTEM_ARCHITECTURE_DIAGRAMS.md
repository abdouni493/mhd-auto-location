# RESERVATION SYSTEM - VISUAL ARCHITECTURE

## Database Schema Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      RESERVATIONS SYSTEM ARCHITECTURE                    │
└─────────────────────────────────────────────────────────────────────────┘

CORE TABLES:
═════════════════════════════════════════════════════════════════════════

┌──────────────────────┐
│   reservations       │ (Main)
├──────────────────────┤
│ id (PK)              │
│ client_id (FK)   ────┼──→ clients
│ car_id (FK)      ────┼──→ cars
│ departure_agency ────┼──→ agencies
│ return_agency    ────┼──→ agencies
│ departure_date       │
│ departure_time       │
│ return_date          │
│ return_time          │
│ price_per_day        │
│ total_price          │
│ deposit              │
│ discount_amount      │
│ discount_type        │
│ advance_payment      │
│ remaining_payment    │
│ tva_applied          │
│ tva_amount           │
│ additional_fees      │
│ status               │
│ notes                │
│ created_at           │
│ activated_at         │
│ completed_at         │
└──────────────────────┘
         │
         ├─→ 0..* vehicle_inspections
         │
         ├─→ 0..* reservation_services
         │
         └─→ 0..* payments


┌─────────────────────────┐
│ vehicle_inspections     │ (1 or 2 per reservation)
├─────────────────────────┤
│ id (PK)                 │
│ reservation_id (FK) ────┼──→ reservations
│ type                    │ ('departure' or 'return')
│ mileage                 │
│ fuel_level              │
│ agency_id (FK)      ────┼──→ agencies
│ exterior_front_photo    │ (URL to storage)
│ exterior_rear_photo     │ (URL to storage)
│ interior_photo          │ (URL to storage)
│ other_photos[]          │ (URLs array)
│ client_signature        │ (URL to storage)
│ notes                   │
│ date, time              │
└─────────────────────────┘
         │
         └─→ 0..* inspection_responses


┌──────────────────────────────┐
│ inspection_responses         │ (Multiple per inspection)
├──────────────────────────────┤
│ id (PK)                      │
│ inspection_id (FK)       ────┼──→ vehicle_inspections
│ checklist_item_id (FK)   ────┼──→ inspection_checklist_items
│ status (true/false)          │
│ note (optional)              │
│ UNIQUE(inspection_id, item)  │
└──────────────────────────────┘


┌──────────────────────────────┐
│ inspection_checklist_items   │ (36 default + custom)
├──────────────────────────────┤
│ id (PK)                      │
│ category                     │
│ ('securite'|'equipements'    │
│  |'confort')                 │
│ item_name                    │
│ display_order                │
│ UNIQUE(category, item_name)  │
└──────────────────────────────┘


┌──────────────────────────────┐
│ reservation_services         │ (Multiple per reservation)
├──────────────────────────────┤
│ id (PK)                      │
│ reservation_id (FK)      ────┼──→ reservations
│ category                     │
│ ('decoration'|'equipment'    │
│  |'insurance'|'service'      │
│  |'driver')                  │
│ service_name                 │
│ description                  │
│ price                        │
│ driver_id (FK, optional) ────┼──→ workers
└──────────────────────────────┘


┌──────────────────────┐
│ payments             │ (Multiple per reservation)
├──────────────────────┤
│ id (PK)              │
│ reservation_id (FK)──┼──→ reservations
│ amount               │
│ payment_method       │
│ status               │
│ note                 │
│ date                 │
└──────────────────────┘

═════════════════════════════════════════════════════════════════════════
STORAGE BUCKETS:
═════════════════════════════════════════════════════════════════════════

inspection/
├── inspection-{resId}-exterior-front-{time}.jpg
├── inspection-{resId}-exterior-rear-{time}.jpg
├── inspection-{resId}-interior-{time}.jpg
├── inspection-{resId}-other-{time}.jpg
└── signature-{resId}-{time}.png

```

---

## User Flow Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                    RESERVATION CREATION FLOW                        │
└────────────────────────────────────────────────────────────────────┘

                              START
                                │
                                ▼
                    ╔═══════════════════════╗
                    ║  STEP 1: Dates & Locations
                    ║  ═══════════════════════
                    ║  • Select departure date/time
                    ║  • Load agencies from DB
                    ║  • Select departure agency
                    ║  • Select return date/time
                    ║  • Select return agency
                    ║  • Save to formData.step1
                    ╚═══════════════════════╝
                                │
                                ▼
                    ╔═══════════════════════╗
                    ║  STEP 2: Vehicle Selection
                    ║  ═══════════════════════
                    ║  • Load cars from DB
                    ║  • Display with images
                    ║  • Show specs & pricing
                    ║  • User selects car
                    ║  • Save to formData.step2
                    ╚═══════════════════════╝
                                │
                                ▼
                    ╔═══════════════════════╗
                    ║  STEP 3: Departure Inspection
                    ║  ═════════════════════════════
                    ║  ┌─ Vehicle Info
                    ║  │  • Display selected car & image
                    ║  │
                    ║  ├─ Inspection Details
                    ║  │  • Enter mileage
                    ║  │  • Select fuel level
                    ║  │  • Select agency
                    ║  │  • Add notes
                    ║  │
                    ║  ├─ Checklist Items
                    ║  │  • Load from DB (36 items)
                    ║  │  • Check/uncheck items
                    ║  │  • Delete items (persists to DB)
                    ║  │  • Add custom items (persists to DB)
                    ║  │  • Save responses to DB
                    ║  │
                    ║  ├─ Photo Uploads
                    ║  │  • Exterior Front → storage
                    ║  │  • Exterior Rear → storage
                    ║  │  • Interior → storage
                    ║  │  • Other → storage
                    ║  │
                    ║  └─ Client Signature
                    ║     • Draw signature
                    ║     • Upload to storage
                    ║     • Save URL to DB
                    ║
                    ║  CREATE: vehicle_inspections
                    ║  CREATE: inspection_responses
                    ║  UPLOAD: photos & signature
                    ╚═══════════════════════╝
                                │
                                ▼
                    ╔═══════════════════════╗
                    ║  STEP 4: Client Selection
                    ║  ═════════════════════════
                    ║  • Load clients from DB
                    ║  • Display with images
                    ║  • Search clients
                    ║  • User selects or creates
                    ║  • If new: upload profile photo
                    ║  • Save to formData.step4
                    ╚═══════════════════════╝
                                │
                                ▼
                    ╔═══════════════════════╗
                    ║  STEP 5: Additional Services
                    ║  ═══════════════════════════
                    ║  • Display available services
                    ║  • User adds services
                    ║  • If driver: load from DB
                    ║  • Save services to DB
                    ║  • User can delete services
                    ╚═══════════════════════╝
                                │
                                ▼
                    ╔═══════════════════════╗
                    ║  STEP 6: Final Summary
                    ║  ═══════════════════════
                    ║  • Display all summary info
                    ║  • Show car image & details
                    ║  • Show client image & details
                    ║  • Calculate pricing:
                    ║    - Base price × days
                    ║    - + Services total
                    ║    - + TVA (if enabled)
                    ║  • Show deposit
                    ║  • Show advance payment
                    ║  • Calculate remaining
                    ║
                    ║  CREATE: reservations
                    ║  (status='pending')
                    ╚═══════════════════════╝
                                │
                                ▼
                        🎉 RESERVATION CREATED
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
        PLANNER PAGE: List View    Admin Actions
        ═══════════════════════     ═════════════
        • Show with images          • Activate
        • Filter by status          • Complete
        • Search                    • Cancel
        • View details              • Delete

```

---

## Database Relationships Diagram

```
                          clients
                             ▲
                             │ (referenced by)
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        │              reservations               │
        │              (main table)               │
        │                    │                    │
        │        ┌───────────┼───────────┐        │
        │        │           │           │        │
        ▼        ▼           ▼           ▼        │
       cars   agencies  workers(driver)  │        │
                            │            │        │
        ┌───────────────────┘            │        │
        │                                 │        │
        │   reservation_services ←────────┼────────┘
        │        (optional)              │
        │                                 │
        └───────────────────┬─────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
    vehicle_inspections payments      (future: return_inspection)
         │
         ├─→ agencies
         │
         └─→ inspection_responses
              │
              └─→ inspection_checklist_items


STORAGE HIERARCHY:
─────────────────

inspection/ bucket
├── photos/
│   ├── {reservationId}-exterior-front-{time}.jpg
│   ├── {reservationId}-exterior-rear-{time}.jpg
│   ├── {reservationId}-interior-{time}.jpg
│   └── {reservationId}-other-{time}.jpg
│
└── signatures/
    └── {reservationId}-{time}.png

```

---

## Data Validation Flow

```
┌──────────────────────────────────────────────────────────────┐
│                 VALIDATION AT EACH STEP                      │
└──────────────────────────────────────────────────────────────┘

STEP 1: Dates & Locations
  Input: dates, times, agencies
  Validation:
    ✓ Return date > Departure date
    ✓ Both agencies exist in DB
    ✓ Departure time valid (format HH:MM)
    ✓ Return time valid (format HH:MM)

STEP 2: Vehicle Selection
  Input: car ID
  Validation:
    ✓ Car exists in DB
    ✓ Car status = 'available'
    ✓ No conflicting reservations for dates
    ✓ Car has required fields

STEP 3: Inspection
  Input: mileage, fuel, photos, checklist, signature
  Validation:
    ✓ Mileage is positive integer
    ✓ Fuel level in ['full','half','quarter','eighth','empty']
    ✓ Agency exists in DB
    ✓ At least one checklist item selected
    ✓ Photos < 5MB each
    ✓ Signature captured
    ✓ All photos uploaded successfully

STEP 4: Client
  Input: client ID or new client data
  Validation:
    ✓ If existing: client exists in DB
    ✓ If new: all required fields filled
    ✓ Phone format valid
    ✓ ID number valid
    ✓ License number valid
    ✓ Profile photo uploaded

STEP 5: Services
  Input: service selections
  Validation:
    ✓ If driver selected: driver exists in DB with type='driver'
    ✓ All prices are positive
    ✓ Service names not empty

STEP 6: Summary & Create
  Input: all collected data
  Validation:
    ✓ All previous steps completed
    ✓ Pricing calculated correctly
    ✓ Deposit > 0
    ✓ Remaining > 0
    ✓ Foreign keys valid (car, client, agencies)
    ✓ Can INSERT into reservations

If any validation fails:
  → Show error toast
  → Don't proceed
  → User can fix and retry

```

---

## Checklist Items Organization

```
inspection_checklist_items (Database)
│
├─ Sécurité (12 items, category='securite')
│  ├─ Ceintures de sécurité
│  ├─ Freins
│  ├─ Feux
│  ├─ Pneus
│  ├─ Direction
│  ├─ Klaxon
│  ├─ Rétroviseurs
│  ├─ Essuie-glaces
│  ├─ Airbags
│  ├─ Triangle de signalisation
│  ├─ Extincteur
│  └─ Cric et roue de secours
│
├─ Équipements (12 items, category='equipements')
│  ├─ GPS
│  ├─ Siège bébé
│  ├─ Chaîne neige
│  ├─ Câbles de démarrage
│  ├─ Kit de premiers secours
│  ├─ Radio/CD
│  ├─ Climatisation
│  ├─ Verrouillage centralisé
│  ├─ Ouverture automatique portes
│  ├─ Régulateur de vitesse
│  ├─ Caméra de recul
│  └─ Capteurs de stationnement
│
└─ Confort & Propreté (12 items, category='confort')
   ├─ Sièges
   ├─ Volant
   ├─ Tableau de bord
   ├─ Éclairage intérieur
   ├─ Vitres électriques
   ├─ Rétroviseurs électriques
   ├─ Autoradio
   ├─ Prises USB
   ├─ Cendrier
   ├─ Coffre-fort
   ├─ Tapis de sol
   └─ Propreté générale

User Actions:
  • Check/Uncheck: Save response (true/false)
  • Delete: Remove from DB (won't show in future)
  • Add Custom: Insert to DB (appears in category)

```

---

## Status Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   RESERVATION STATUS FLOW                   │
└─────────────────────────────────────────────────────────────┘

┌─────────┐         ┌──────────────┐        ┌──────────┐
│ PENDING │ -----→  │  CONFIRMED   │  ---→  │ ACTIVE   │
└─────────┘         └──────────────┘        └──────────┘
     │                    │                        │
     │                    │                        │
     │                    │                        ▼
     │                    │                    ┌──────────┐
     │                    │                 → │COMPLETED │
     │                    │                 │ └──────────┘
     │                    │                 │
     │                    │      (with return inspection)
     │                    │
     │                    ▼
     │              ┌──────────────┐
     └────────────→ │  CANCELLED   │
                    └──────────────┘

Transitions:
═══════════
PENDING → CONFIRMED    (User confirms before pickup)
CONFIRMED → ACTIVE     (Activation = "Activate" button)
ACTIVE → COMPLETED     (Add return inspection + Complete)
PENDING → CANCELLED    (Cancel button)
CONFIRMED → CANCELLED  (Cancel button)
ACTIVE → CANCELLED     (Cancel button - requires deactivation)

Status Permissions:
══════════════════
pending:    CAN edit, activate, cancel, delete
confirmed:  CAN activate, cancel, delete
active:     CAN complete (with return inspection), cancel
completed:  READ-ONLY (view only)
cancelled:  READ-ONLY (view only)

```

---

## Image Upload Process

```
All Image Types Use Same Flow:
═════════════════════════════

USER SELECTS FILE
     │
     ▼
VALIDATE:
  • Is image file?
  • < 5MB?
     │
     ├─ YES
     │  ▼
     │  UPLOAD TO STORAGE BUCKET
     │  │
     │  ├─ Car image → 'cars' bucket
     │  ├─ Client image → 'clients' bucket
     │  └─ Inspection image → 'inspection' bucket
     │     │
     │     ▼
     │  GET PUBLIC URL
     │     │
     │     ▼
     │  STORE URL IN DATABASE
     │  (not the file itself)
     │     │
     │     ▼
     │  DISPLAY IN UI
     │  <img src={urlFromDB} referrerPolicy="no-referrer" />
     │
     └─ NO
        ▼
        SHOW ERROR
        "File must be image, < 5MB"

```

---

Done! All diagrams provided for complete system understanding.
