# Manual Price Edit Fix - Verification Guide

## Changes Made

### 1. **EditReservationForm.tsx - Manual Total Price Detection**
- Added `isManualTotal` and `manualTotal` initialization in formData.step6
- Enhanced logging to show when manual total price is detected
- Modified the save logic to:
  - First check if `formData.step6?.isManualTotal` is true
  - If true, use `formData.step6?.totalPrice` as the manual value
  - Otherwise, calculate normally from base price + services + fees + TVA
  - **IMPORTANT**: Skip discount application when manual price is set

### 2. **CreateReservationForm.tsx - Step6FinalPricing Component**
- Updated formData save useEffect to include:
  - `isManualTotal` flag
  - `manualTotal` value
  - Top-level `totalPrice` synchronization
- Added detailed logging for manual total changes

### 3. **EditReservationForm.tsx - Discount Handling**
- Modified discount application to skip when manual price is set
- Added console log: "MANUAL TOTAL SET: Skipping discount application"

## How It Works Now

### User Flow: Create Reservation with Manual Price
1. User creates reservation following all steps
2. At Step 6 (Final Pricing), user sees calculated total (e.g., 91,000 DA)
3. User toggles "Modifier manuellement" checkbox
4. User enters new price (e.g., 85,000 DA)
5. Form saves with `isManualTotal: true` and `manualTotal: 85000`
6. Reservation card displays: 85,000 DA ✅

### User Flow: Edit Reservation and Change Price Manually
1. User views reservation with original total: 91,000 DA
2. User clicks "Edit"
3. EditReservationForm loads with `isManualTotal: false` (reset)
4. Form displays all fields including calculated pricing
5. At Step 6, user toggles "Modifier manuellement" checkbox
6. User changes price to new value (e.g., 85,000 DA)
7. Step6FinalPricing updates formData with new values
8. User clicks "Sauvegarder" / "✅ Finaliser Modifications"
9. EditReservationForm.handleSave() detects `isManualTotal: true`
10. Uses the manual value (85,000 DA) instead of recalculating
11. Saves to database: `totalPrice: 85000, isManualTotal: true`
12. Refetches fresh data from database
13. Updates parent (PlannerPage) with fresh data
14. Reservation card displays: 85,000 DA ✅

## Console Logs to Watch

### When Creating/Editing with Manual Price

**Step6FinalPricing Component:**
```
💾 Saving Step6 to formData
   ├─ isManualTotal: true
   ├─ manualTotal: 85000
   ├─ totalPrice: 85000
```

**EditReservationForm - Pricing Calculation:**
```
🔍 Checking for manual total price:
   ├─ formData.step6?.isManualTotal: true
   ├─ formData.step6?.manualTotal: 85000
   ├─ formData.step6?.totalPrice: 85000
   └─ formData.totalPrice: 85000

🔧 MANUAL TOTAL PRICE DETECTED: Using manually edited value 85,000 DA

💰 Subtotal before discount: 85,000 DA

⚠️ MANUAL TOTAL SET: Skipping discount application
```

**EditReservationForm - Save Confirmation:**
```
✨ Price Update Summary:
   ├─ BEFORE: totalPrice=91000 DA | deposit=...
   └─ AFTER:  totalPrice=85000 DA | deposit=...

🔔 Notifying parent component with updated data...
📤 Data passed to parent onUpdate:
   ...
   totalPrice: 85000
   ...
```

**PlannerPage - Update Confirmation:**
```
🔄 === UPDATING RESERVATION IN PLANNER ===
📝 Updated Reservation from form:
   ...
   totalPrice: 85000
   ...

🔍 Refetching reservation from database...
📊 Fresh data from database:
   ...
   totalPrice: 85000
   ...

📋 Updated reservations list with fresh data
```

## Verification Steps

### Test 1: Create New Reservation with Manual Price
1. Click "New Reservation"
2. Fill all steps through Step 6
3. At Step 6, see calculated price (e.g., 91,000 DA)
4. Check "Modifier manuellement"
5. Change price to 85,000
6. Click "Finaliser la Réservation"
7. ✅ Expected: Card shows 85,000 DA
8. ✅ Expected: Console shows `isManualTotal: true`

### Test 2: Edit Existing Reservation and Change Price
1. Click on any reservation
2. Click "Edit"
3. Keep all fields the same except...
4. Go to Step 6
5. Check "Modifier manuellement"
6. Change price to different value (e.g., 80,000)
7. Click "✅ Finaliser Modifications"
8. ✅ Expected: Card shows new price (80,000 DA)
9. ✅ Expected: Console shows `MANUAL TOTAL PRICE DETECTED`

### Test 3: Edit Reservation with Manual Price (Regression Test)
1. Create reservation with manual price: 85,000
2. Click Edit
3. Go to Step 6 (should show 85,000 calculated price now, but manual might be forgotten)
4. Keep everything same, just save
5. ⚠️ Expected: If no manual checkbox, it will recalculate to 91,000
6. ℹ️ Note: This is expected behavior - users need to re-toggle manual if they want to keep it

### Test 4: Manual Price with Discount
1. Create reservation with manual price: 85,000
2. On same form, add a discount (e.g., 10%)
3. Save
4. ✅ Expected: Discount should NOT be applied to manual price
5. ✅ Expected: Total stays 85,000 (not 76,500)
6. ✅ Expected: Console shows "Skipping discount application"

## Troubleshooting

### Issue: Card shows old price after edit
- Check console for `totalPrice` values
- Verify `isManualTotal` is being detected
- Confirm database refetch is fetching correct value
- Check that PlannerPage.updateReservation is being called

### Issue: Manual price becoming calculated price
- Verify Step6FinalPricing is saving `isManualTotal: true` to formData
- Check EditReservationForm initialization includes `isManualTotal: false`
- Confirm manual checkbox was toggled before save

### Issue: Discount applied to manual price
- Verify EditReservationForm has the discount-skip logic
- Check console for "MANUAL TOTAL SET: Skipping discount application"

## Database Fields

The following fields are used in database:
- `totalPrice`: The final price (manual or calculated)
- `discountAmount`: Discount amount
- `discountType`: 'percentage' or 'fixed'

⚠️ **Note**: The `isManualTotal` flag is NOT stored in the database. It's only used during form editing to control calculation logic. When editing an existing reservation, it will default to `false`.

## Known Limitations

1. **Manual flag not persisted**: The `isManualTotal` flag is not stored in the database, so when editing a reservation that was created with a manual price, the system will recalculate by default unless the user manually toggles it again.

2. **Discount behavior with manual price**: Discounts are skipped for manual prices. If users want to apply a discount to a manual price, they should calculate it themselves before entering.

3. **No audit trail**: There's no way to tell from the database whether a price was manually set or calculated. It's just stored as `totalPrice`.

## Future Improvements

1. Add `is_manual_total` or `pricing_source` field to reservations table
2. Store manual total separately for audit trail
3. Add history/versioning to track price changes
4. Allow users to toggle discount application on manual prices
