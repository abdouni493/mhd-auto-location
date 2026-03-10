# QUICK REFERENCE - RESERVATION SYSTEM

## 📁 Files Created

| File | Location | Purpose |
|------|----------|---------|
| reservations_database_setup.sql | Root | SQL schema & policies |
| ReservationsService.ts | src/services/ | All database methods |
| COMPLETE_RESERVATION_SETUP.md | Root | Complete overview |
| RESERVATION_IMPLEMENTATION_GUIDE.md | Root | Step-by-step guide |
| SQL_CODE_SUMMARY.md | Root | Database structure |
| INSPECTION_CHECKLIST_REFERENCE.md | Root | Checklist items |
| QUICK_REFERENCE.md | Root | This file |

---

## 🗄️ Database Tables

```sql
reservations              -- Main reservation data (pricing, dates, status)
vehicle_inspections       -- Departure & return inspections
inspection_checklist_items -- 36 pre-populated items + custom
inspection_responses       -- Checklist responses per inspection
reservation_services      -- Additional services (driver, equipment, etc.)
payments                  -- Payment records
```

---

## 🎯 Step Structure

| Step | Component | Key DB Operation | Save Location |
|------|-----------|------------------|---|
| 1 | Dates & Locations | Load agencies | formData.step1 |
| 2 | Vehicle Select | Load cars + images | formData.step2 |
| 3 | Inspection | Create inspection + upload photos | vehicle_inspections |
| 4 | Client Select | Load clients + images | formData.step4 |
| 5 | Services | Add services to DB | reservation_services |
| 6 | Summary & Create | Create reservation | reservations (status='pending') |

---

## 📸 Image Buckets

| Type | Bucket | Table Column | Method |
|------|--------|--------------|--------|
| Car | cars | image_url | uploadCarImage() |
| Client | clients | profile_photo | uploadClientImage() |
| Inspection | inspection | exterior_front_photo, etc. | uploadInspectionPhoto() |
| Signature | inspection | client_signature | uploadSignature() |

**Display Method (All):**
```tsx
<img src={urlFromDB} referrerPolicy="no-referrer" />
```

---

## 🔄 Key Workflows

### Create Reservation
```
Step 1 → formData.step1
  ↓
Step 2 → formData.step2
  ↓
Step 3 → vehicle_inspections + inspection_responses + storage
  ↓
Step 4 → formData.step4
  ↓
Step 5 → reservation_services
  ↓
Step 6 → CREATE reservations (status='pending')
```

### Activate Reservation
```
PlannerPage → Click Activate
  ↓
UPDATE reservations SET status='active', activated_at=NOW()
```

### Complete Reservation
```
Create Return Inspection
  ↓
UPDATE reservations SET status='completed', completed_at=NOW()
```

---

## 🎨 Colors (Standardized)

**All Primary Buttons:**
```
from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700
```

Apply to:
- ➕ Nouveau Client
- Créer un Service
- ✅ Créer Réservation
- Next/Previous step buttons

---

## 📊 Main Queries

### Get All Reservations
```typescript
const reservations = await ReservationsService.getReservations({
  status: 'pending',
  startDate: '2026-03-01',
  endDate: '2026-03-31'
});
```

### Get Single Reservation (with all related data)
```typescript
const res = await ReservationsService.getReservationById(id);
// Includes: cars, clients, inspections, services, payments
```

### Get Checklist Items (from database)
```typescript
const items = await ReservationsService.getChecklistItems();
// Returns: [
//   { id, category: 'securite', item_name: 'Ceintures', ... },
//   ...
// ]
```

### Add Custom Checklist Item
```typescript
await ReservationsService.addCustomChecklistItem('securite', 'New item');
```

### Delete Checklist Item
```typescript
await ReservationsService.deleteChecklistItem(itemId);
```

---

## 🔐 RLS Policies

✅ All tables protected - authenticated users only
✅ Checklist items - public read
✅ Storage bucket - authenticated write/delete, public read

---

## 📋 Inspection Checklist (36 Items)

**Sécurité (12):**
Ceintures, Freins, Feux, Pneus, Direction, Klaxon, Rétroviseurs, Essuie-glaces, Airbags, Triangle, Extincteur, Cric

**Équipements (12):**
GPS, Siège bébé, Chaîne neige, Câbles, Kit secours, Radio/CD, Clim, Verrou, Ouverture auto, Régulateur, Caméra recul, Capteurs parking

**Confort (12):**
Sièges, Volant, Tableau bord, Éclairage, Vitres électriques, Rétroviseurs électriques, Autoradio, Prises USB, Cendrier, Coffre-fort, Tapis, Propreté

---

## 🚗 Features Summary

| Feature | Status | Location |
|---------|--------|----------|
| Load agencies from DB | ✅ | Step 1 |
| Load cars with images | ✅ | Step 2 |
| Display checklist from DB | ✅ | Step 3 |
| Upload inspection photos | ✅ | Step 3 |
| Upload client signature | ✅ | Step 3 |
| Load clients with images | ✅ | Step 4 |
| Add/delete services | ✅ | Step 5 |
| Load drivers for service | ✅ | Step 5 |
| Calculate pricing & TVA | ✅ | Step 6 |
| Create reservation | ✅ | Step 6 |
| List reservations | ✅ | PlannerPage |
| Activate/Complete/Cancel | ✅ | PlannerPage |
| View full details | ✅ | Details view |

---

## ❌ What NOT to Do

- ❌ Hardcode checklist items (load from database)
- ❌ Store images in database (use storage bucket)
- ❌ Use different image display method (use referrerPolicy)
- ❌ Forget foreign key relationships (use FK constraints)
- ❌ Forget RLS policies (protect all tables)
- ❌ Use old mock data (load from database)
- ❌ Different button colors (use blue gradient)

---

## ✅ Implementation Checklist

- [ ] Run reservations_database_setup.sql
- [ ] Copy ReservationsService.ts to src/services/
- [ ] Update CreateReservationForm Step 1 (load agencies)
- [ ] Update CreateReservationForm Step 2 (load cars)
- [ ] Update CreateReservationForm Step 3 (load checklist, upload photos/signature)
- [ ] Update CreateReservationForm Step 4 (load clients)
- [ ] Update CreateReservationForm Step 5 (add/delete services, load drivers)
- [ ] Update CreateReservationForm Step 6 (create reservation, display summary)
- [ ] Update CreateReservationForm button colors
- [ ] Update PlannerPage (load reservations with images)
- [ ] Update PlannerPage (action buttons)
- [ ] Update ReservationDetailsView (display all data)
- [ ] Test all steps end-to-end
- [ ] Test image uploads
- [ ] Test database operations
- [ ] Test RLS policies

---

## 🔗 Key Methods Quick Call

```typescript
// === RESERVATIONS ===
await ReservationsService.createReservation({...})
await ReservationsService.getReservations({status: 'pending'})
await ReservationsService.getReservationById(id)
await ReservationsService.updateReservation(id, {...})
await ReservationsService.activateReservation(id)
await ReservationsService.completeReservation(id, inspectionId)
await ReservationsService.deleteReservation(id)

// === INSPECTIONS ===
await ReservationsService.createInspection({...})
await ReservationsService.saveInspectionResponse(inspectionId, itemId, status)
await ReservationsService.getChecklistItems()
await ReservationsService.addCustomChecklistItem(category, name)
await ReservationsService.deleteChecklistItem(id)

// === UPLOADS ===
const url = await ReservationsService.uploadInspectionPhoto(file, resId, type)
const url = await ReservationsService.uploadSignature(file, resId)

// === SERVICES ===
await ReservationsService.addService({...})
await ReservationsService.deleteService(serviceId)

// === PAYMENTS ===
await ReservationsService.addPayment({...})
await ReservationsService.getPayments(resId)
```

---

## 📞 Support

**Issue:** Checklist items hardcoded
**Fix:** Use `ReservationsService.getChecklistItems()`

**Issue:** Images not loading
**Fix:** Add `referrerPolicy="no-referrer"` to img tag

**Issue:** RLS policy errors
**Fix:** Verify auth status, check RLS policies exist

**Issue:** Foreign key constraints
**Fix:** Ensure parent record exists (agency, car, client)

**Issue:** Storage upload fails
**Fix:** Check file size < 5MB, verify bucket policy

---

## 📚 Documentation Index

1. **COMPLETE_RESERVATION_SETUP.md** - Start here
2. **RESERVATION_IMPLEMENTATION_GUIDE.md** - Step-by-step
3. **SQL_CODE_SUMMARY.md** - Database structure
4. **INSPECTION_CHECKLIST_REFERENCE.md** - Checklist items
5. **reservations_database_setup.sql** - Run to setup DB
6. **ReservationsService.ts** - Use for all DB operations

---

## 🎉 Ready to Start!

1. Execute SQL setup
2. Copy service file
3. Follow implementation guide
4. Update components step by step
5. Test thoroughly
6. Deploy

All SQL code provided. All methods documented. All steps explained.

**Good luck! 🚀**
