# Manual Price Fix - Testing Scenarios

## Quick Test (5 minutes)

### Test A: New Reservation with Manual Price
**Steps:**
1. Click "New Reservation" button
2. Select dates, car, client, services (any values)
3. At Step 6 (Final Pricing), note the calculated "TOTAL LOCATION" price
4. Check the box "Modifier manuellement"
5. Clear the manual total input and enter: `85000`
6. Verify displayed price changes to: 85,000 DA
7. Click "Finaliser la Réservation"
8. **Expected Result:** Card shows 85,000 DA

**Console Check:**
- Look for: `🔧 MANUAL TOTAL PRICE DETECTED`
- Should see: `isManualTotal: true, manualTotal: 85000`

---

### Test B: Edit Existing Reservation with Price Change
**Steps:**
1. Click on any existing reservation card
2. Click the "Edit" button
3. Navigate to Step 6 (Final Pricing)
4. Note the current calculated price
5. Check the box "Modifier manuellement"
6. Enter: `80000` in the manual total input
7. Verify displayed price changes to: 80,000 DA
8. Click "✅ Finaliser Modifications"
9. **Expected Result:** Card shows 80,000 DA (refreshes after save)

**Console Check:**
- Look for: `🔧 MANUAL TOTAL PRICE DETECTED: Using manually edited value 80,000 DA`
- Should see: `BEFORE: totalPrice=XXXX DA | AFTER: totalPrice=80000 DA`

---

## Full Test Suite (15 minutes)

### Test 1: Manual Price Preservation (Critical)

**Objective:** Verify manual prices are properly detected and used

**Setup:**
- Have browser developer tools open (F12)
- Console tab visible
- Clear console before starting

**Steps:**
1. Create new reservation:
   - Dates: Any 7-day period
   - Car: Any car (note its priceDay)
   - Client: Any client
   - Services: Any 1-2 services
   - Total at Step 6: Will be calculated as (7 × priceDay + services)

2. At Step 6:
   - Toggle "Modifier manuellement" ON
   - Enter manual price: (calculated_total - 2000) e.g., if total is 95000, enter 93000
   - Toggle "Modifier manuellement" OFF → price should revert to calculated
   - Toggle "Modifier manuellement" ON again
   - Price should show your manual value again
   - Save reservation

3. Check card:
   - Should show your manual value (93000 in example)

4. Edit reservation:
   - Click Edit
   - Go to Step 6
   - Price should show calculated value again (95000)
   - This is expected - manual flag resets on edit load
   - Toggle "Modifier manuellement" ON
   - Enter different value: 90000
   - Save

5. Check card:
   - Should show new manual value: 90000
   - Should NOT show original: 95000

**Console Validation:**
```
CREATE FLOW:
💾 Saving Step6 to formData
   ├─ isManualTotal: true
   ├─ manualTotal: 93000
   ├─ totalPrice: 93000

📤 UPDATE DATA TO SAVE:
   ...
   totalPrice: 93000

EDIT FLOW:
🔍 Checking for manual total price:
   ├─ formData.step6?.isManualTotal: true
   ├─ formData.step6?.manualTotal: 90000
   ├─ formData.step6?.totalPrice: 90000

🔧 MANUAL TOTAL PRICE DETECTED: Using manually edited value 90,000 DA

🔍 Refetching reservation from database...
💰 Fresh pricing info:
   ├─ totalPrice: 90000
```

---

### Test 2: Discount Bypass for Manual Prices

**Objective:** Verify discounts are NOT applied to manual prices

**Setup:**
- No discounts previously applied
- Clear console

**Steps:**
1. Create new reservation with:
   - 5 days rental
   - 1 service ($5000)
   - Calculated total: Let's say 50000 DA
   - Toggle "Modifier manuellement" ON
   - Enter manual price: 45000 DA
   - Save

2. Edit reservation:
   - At Step 1 or elsewhere, add a discount: 10% or 5000 DA fixed
   - Go to Step 6
   - Toggle "Modifier manuellement" ON
   - Enter: 45000 DA (same as before)
   - Save

3. Expected:
   - Card shows: 45000 DA (NOT 40500 or 40000)
   - Console shows: "Skipping discount application"

**Console Validation:**
```
After discount calculation:
⚠️ MANUAL TOTAL SET: Skipping discount application

Price Update Summary:
   ├─ BEFORE: totalPrice=50000 DA
   └─ AFTER: totalPrice=45000 DA (not reduced by discount)
```

---

### Test 3: Normal Operation (No Manual Price)

**Objective:** Verify normal calculations still work when NOT using manual pricing

**Steps:**
1. Create new reservation:
   - Dates: 5 days
   - Car: One with clear pricing (e.g., 10000 DA/day = 50000 for 5 days)
   - Services: 5000 DA service
   - Expected total: 55000 DA
   - **DON'T toggle manual pricing**
   - Save

2. Card should show: 55000 DA

3. Edit reservation:
   - Change to 7 days
   - Expected: 70000 + 5000 = 75000 DA
   - **DON'T toggle manual pricing**
   - Save

4. Card should show: 75000 DA

**Console Validation:**
```
Should see:
💰 Calculation: basePrice (70000) + servicesTotal (5000) + additionalFees (0) + tvaAmount (0) = 75000

Should NOT see:
🔧 MANUAL TOTAL PRICE DETECTED
```

---

### Test 4: Manual Price with TVA

**Objective:** Verify manual prices interact correctly with TVA

**Steps:**
1. Create reservation with TVA enabled:
   - Dates: 7 days
   - Car: 10000 DA/day = 70000 base
   - TVA enabled (19%): 70000 × 1.19 = 83300 DA
   - Enter manual price: 80000 DA
   - Save

2. Card should show: 80000 DA (TVA calculation overridden)

3. Edit: Enter manual price: 85000 DA

4. Card should show: 85000 DA

**Console Validation:**
```
Should see calculated TVA amount, but then:
🔧 MANUAL TOTAL PRICE DETECTED: Using manually edited value
Total Price: 80000 DA (not 83300)
```

---

### Test 5: Card Refresh Verification

**Objective:** Verify card updates immediately after edit save

**Steps:**
1. Create reservation with price: 90000 DA
2. Note card display
3. Click Edit
4. Go to Step 6
5. Change to manual: 75000 DA
6. Click Save
7. Immediately observe card:
   - **Should refresh and show 75000 DA**
   - Should NOT still show 90000 DA

**Timing Check:**
- Refresh should happen within 1-2 seconds after save
- Should NOT require manual page refresh

---

## Regression Tests

### R1: Existing Reservations Still Work
- Open an old reservation (before this fix)
- Edit it without changing price
- Save
- **Expected:** Price remains same, no errors

### R2: Advance/Remaining Payment Calculation
- Create reservation with:
  - Manual price: 100000 DA
  - Advance payment: 30000 DA
  - **Expected remaining:** 70000 DA
- Edit and save again
- **Expected:** Remaining payment correctly recalculated

### R3: Multiple Reservations
- Create 3 reservations:
  - One with manual price
  - One with normal calc
  - One with discount + manual price
- Edit one and change price
- **Expected:** Other cards not affected, update correct card

### R4: Page Navigation
- Create reservation with manual price
- Go to Dashboard
- Return to Planner
- **Expected:** Price still shows correctly in card

---

## Error Scenarios (Should NOT Happen)

### E1: Negative Manual Prices
- Try entering negative number in manual price
- **Expected:** Input validation prevents it (no negative)

### E2: Non-numeric Input
- Try entering text in manual price field
- **Expected:** Only numbers accepted (inputMode="decimal")

### E3: Empty Manual Price
- Toggle "Modifier manuellement" ON
- Leave field empty
- Save
- **Expected:** Falls back to calculated price

### E4: Zero Manual Price
- Enter 0 in manual price
- **Expected:** Accepted (0 is valid number)
- **Warning:** May indicate free rental

---

## Performance Checks

### P1: Save Performance
- Time from clicking Save to card update
- **Expected:** < 2 seconds

### P2: Large Data Load
- Edit reservation with many services (10+)
- Toggle manual pricing
- Save
- **Expected:** No lag, immediate card update

### P3: Rapid Edits
- Create reservation
- Edit → change price → save
- Edit → change price again → save
- Immediately (within 1 sec) Edit → change → save
- **Expected:** All prices saved correctly, no race conditions

---

## Success Criteria Checklist

- [ ] Manual prices are saved to formData.step6.totalPrice
- [ ] isManualTotal flag properly indicates manual vs calculated
- [ ] Manual prices bypass discount calculations
- [ ] Card immediately displays new manual price after save
- [ ] Database confirms correct totalPrice is stored
- [ ] Console logs show "MANUAL TOTAL PRICE DETECTED" when expected
- [ ] Normal calculations (no manual) still work perfectly
- [ ] TVA calculations work with manual prices
- [ ] Existing reservations continue to work
- [ ] No errors in console during any test

---

## Support Information for Users

If users report issues, have them provide:

1. **Screenshot of:** The card before and after edit
2. **Console logs:** From browser DevTools (F12 → Console tab)
3. **Steps to reproduce:** Exact steps they took
4. **What they saw vs expected:** Clear description of mismatch
5. **Database value:** Check the actual totalPrice in the reservations table

Key things to check:
- Is "Modifier manuellement" checkbox actually checked?
- Is the value being entered in the input field?
- Is there an error in the console?
- Does the manual price match what was entered?
