# Manual Price Fix - Testing Verification Card

## ✅ WHAT TO EXPECT AFTER FIX

### Test 1: Create Reservation with Manual Price

**Setup:**
- Create new reservation with any dates/car/client

**Action:**
1. Go to Step 6 (Final Pricing)
2. Note calculated total (e.g., 91,000 DA)
3. Check: "Modifier manuellement"
4. Enter: 85,000
5. Save

**Expected Results:**

| Expectation | Check | Status |
|-------------|-------|--------|
| Price input shows 85,000 | ✓ Input value displays | ✓ |
| Card shows 85,000 DA | ✓ After save, card updates | ✓ |
| Console shows "MANUAL TOTAL PRICE DETECTED" | ✓ Press F12 → Console | ✓ |
| No errors in console | ✓ No red error messages | ✓ |
| Database has 85,000 | ✓ Check reservations table | ✓ |

**Console Signature:**
```
💾 Saving Step6 to formData
   ├─ isManualTotal: true
   ├─ manualTotal: 85000
   ├─ totalPrice: 85000

📤 UPDATE DATA TO SAVE:
   totalPrice: 85000

📊 Updated Reservation Data:
   totalPrice: 85000
```

---

### Test 2: Edit Reservation and Change Price

**Setup:**
- Have existing reservation (e.g., showing 91,000 DA)

**Action:**
1. Click "Edit"
2. Navigate to Step 6
3. Check: "Modifier manuellement"
4. Enter: 80,000
5. Click "✅ Finaliser Modifications"

**Expected Results:**

| Expectation | Check | Status |
|-------------|-------|--------|
| Form loads with 91,000 calculated | ✓ Step 6 shows original total | ✓ |
| Manual input accepts 80,000 | ✓ Input field takes value | ✓ |
| Console shows "MANUAL TOTAL PRICE DETECTED" | ✓ Press F12 → Console | ✓ |
| Card updates to 80,000 DA | ✓ After save, card refreshes | ✓ |
| No page reload needed | ✓ Card updates in place | ✓ |
| Refresh within 1-2 seconds | ✓ Timing looks instant | ✓ |

**Console Signature:**
```
🔍 Checking for manual total price:
   ├─ formData.step6?.isManualTotal: true
   ├─ formData.step6?.manualTotal: 80000
   └─ formData.step6?.totalPrice: 80000

🔧 MANUAL TOTAL PRICE DETECTED: Using manually edited value 80,000 DA

✨ Price Update Summary:
   ├─ BEFORE: totalPrice=91000 DA
   └─ AFTER:  totalPrice=80000 DA

📋 Updated reservations list with fresh data
```

---

### Test 3: Discount NOT Applied to Manual Price

**Setup:**
- Create reservation with:
  - Base: 50,000 DA
  - Service: 5,000 DA
  - Manual price: 45,000 DA
  - Discount: 10% (would be 5,400 DA)

**Action:**
1. At Step 6, set manual price: 45,000
2. Have discount already applied
3. Save

**Expected Results:**

| Expectation | Check | Status |
|-------------|-------|--------|
| Manual price is 45,000 | ✓ Input shows 45,000 | ✓ |
| Discount skipped | ✓ Console shows "Skipping" | ✓ |
| Card shows 45,000 (not 39,600) | ✓ Card value is 45,000 | ✓ |
| Database has 45,000 | ✓ No discount applied | ✓ |

**Console Signature:**
```
⚠️ MANUAL TOTAL SET: Skipping discount application

💰 Subtotal before discount: 45,000 DA

✨ Price Update Summary:
   ├─ BEFORE: totalPrice=50000 DA
   └─ AFTER:  totalPrice=45000 DA
```

---

### Test 4: Normal Calculation Still Works

**Setup:**
- Create reservation WITHOUT using manual pricing

**Action:**
1. Fill all steps
2. At Step 6, DON'T check "Modifier manuellement"
3. Note calculated total
4. Save

**Expected Results:**

| Expectation | Check | Status |
|-------------|-------|--------|
| Price calculated correctly | ✓ Math checks out | ✓ |
| Card shows calculated total | ✓ Card matches calculation | ✓ |
| Console shows normal calculation | ✓ No "MANUAL TOTAL" message | ✓ |
| Database has calculated value | ✓ Matches calculation | ✓ |

**Console Signature:**
```
💰 Calculation: basePrice (50000) + servicesTotal (5000) + ... = 55000

💰 Subtotal before discount: 55000 DA
```

---

### Test 5: Card Refresh Verification

**Setup:**
- Any manual price edit

**Action:**
1. Note card before edit
2. Click Edit
3. Change manual price
4. Click Save
5. Watch card update

**Expected Results:**

| Expectation | Check | Status |
|-------------|-------|--------|
| Card visible before edit | ✓ Can see original price | ✓ |
| Edit form opens | ✓ Form appears | ✓ |
| Save completes | ✓ No errors | ✓ |
| Form closes automatically | ✓ Returns to planner view | ✓ |
| Card shows new price | ✓ Updated immediately | ✓ |
| Update happens within 1-2 sec | ✓ No long delay | ✓ |

**Timing:**
- Save click → API response: < 1 second
- API response → Card update: < 1 second
- Total: < 2 seconds ✓

---

## 🔍 Console Log Deep Dive

### Step 1: Open Developer Tools
- Press: `F12` (Windows/Linux) or `Cmd+Option+I` (Mac)
- Click: "Console" tab
- Scroll: To top to see all logs

### Step 2: Look for Key Messages

**Create with Manual Price:**
```
✅ Look for:
💾 Saving Step6 to formData
   ├─ isManualTotal: true

🔧 MANUAL TOTAL PRICE DETECTED
```

**Edit with Manual Price:**
```
✅ Look for:
🔍 Checking for manual total price:
   ├─ formData.step6?.isManualTotal: true

🔧 MANUAL TOTAL PRICE DETECTED
```

**Discount Skipped:**
```
✅ Look for:
⚠️ MANUAL TOTAL SET: Skipping discount application
```

**Database Refetch:**
```
✅ Look for:
📊 Fresh data from database:
   totalPrice: [your manual value]
```

### Step 3: Check for Errors

**Good (No Errors):**
- ✅ No red error messages
- ✅ No "Uncaught" messages
- ✅ No failed network requests

**Bad (Errors Present):**
- ❌ Red error text in console
- ❌ "Failed to save" message
- ❌ "Cannot read property" error
- ❌ Network error (404, 500, etc)

---

## 📊 Checklist - Complete After Each Test

### Test 1: Create with Manual Price
- [ ] Input accepts manual value (85,000)
- [ ] Card displays 85,000 after save
- [ ] Console shows "MANUAL TOTAL PRICE DETECTED"
- [ ] No errors in console
- [ ] isManualTotal: true in logs

### Test 2: Edit with Manual Price
- [ ] Form loads with calculated value
- [ ] Manual checkbox can be toggled
- [ ] New price (80,000) accepted
- [ ] Card updates within 2 seconds
- [ ] Console shows before/after prices

### Test 3: Discount with Manual Price
- [ ] Manual price not reduced by discount
- [ ] Console shows "Skipping discount"
- [ ] Card shows full manual amount
- [ ] Database confirms no discount

### Test 4: Normal Calculation
- [ ] Calculated price correct
- [ ] No "MANUAL TOTAL" in console
- [ ] Card shows calculated value
- [ ] Discount applies normally

### Test 5: Card Refresh
- [ ] Refresh happens automatically
- [ ] No manual page reload needed
- [ ] Price updates within 2 seconds
- [ ] Form closes after save

---

## 🚨 If Something Is Wrong

### Issue: Card still shows old price
**Check:**
1. Did you click Save/Finaliser? ✓
2. Is there an error in console? ✓
3. Did form close? ✓
4. Is card showing correct reservation? ✓

**Fix:**
- Refresh page (F5)
- Check console for errors
- Verify database has new value

### Issue: Console doesn't show expected logs
**Check:**
1. Is Console tab open? ✓ (F12)
2. Are logs being filtered? ✓
3. Is there an error preventing logs? ✓

**Fix:**
- Clear console filter
- Check for errors above
- Scroll to top of console

### Issue: "Cannot find manual value" errors
**Check:**
1. Did you check "Modifier manuellement"? ✓
2. Did you enter a number? ✓
3. Is field accepting input? ✓

**Fix:**
- Ensure checkbox is checked
- Ensure value is numeric
- Clear field and re-enter

### Issue: Discount still applied to manual price
**Check:**
1. Is "Modifier manuellement" checked? ✓
2. Does console show "Skipping discount"? ✓

**Fix:**
- Verify checkbox is checked
- Check console for "Skipping" message
- Manual prices should never have discount applied

---

## 📈 Performance Checks

### Response Time
- **Acceptable:** < 2 seconds from save to card update
- **Target:** < 1 second
- **Measure:** Click Save → Watch card update

### No UI Freezing
- **Acceptable:** No "spinning" or "loading" state
- **Expected:** Instant feedback
- **Measure:** Try clicking other buttons during save

### Network Requests
- **Should see:** 1-2 API calls for save + refetch
- **Should NOT see:** Multiple retries or errors
- **Check:** DevTools → Network tab

---

## ✅ Success Indicators (All Should Be YES)

1. ✅ Manual prices save to database
2. ✅ Manual prices display on card immediately
3. ✅ Console shows "MANUAL TOTAL PRICE DETECTED"
4. ✅ Discounts don't apply to manual prices
5. ✅ Normal calculations still work
6. ✅ No errors in console
7. ✅ Card refreshes within 2 seconds
8. ✅ Form closes after save
9. ✅ Database confirms correct value
10. ✅ Existing reservations unaffected

---

## 🎯 Final Verification

**If ALL checks pass:**
✅ Fix is working correctly

**If ANY check fails:**
- Note which test failed
- Check console for errors
- Refer to troubleshooting section
- Contact development team

---

**Testing Complete When:**
- ✅ All 5 tests pass
- ✅ All 10 success indicators are YES
- ✅ No errors in console
- ✅ Card updates work correctly
- ✅ Ready to sign off on QA
