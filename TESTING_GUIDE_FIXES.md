# Quick Start Testing Guide - AutoLocation Fixes

## Overview
This guide provides step-by-step instructions to test both FIX 1 (Maintenance KM) and FIX 2 (Reservation Alerts).

---

## FIX 1: Maintenance Card KM Calculation Testing

### Setup Steps

1. **Open the AutoLocation app** → Navigate to **Maintenance** page

2. **Create a test vehicle** (if none exists):
   - Click "+ Add Car"
   - Enter details:
     - Brand: "Toyota"
     - Model: "Corolla"
     - Registration: "TEST-001"
     - Mileage: **15000** km (exact number for testing)

3. **Add a Vidange expense with interval**:
   - Click on the new car card
   - Click "Vidange" section or "+ Add Vidange"
   - Fill in:
     - Date: Today
     - Current Mileage: **15000** km
     - Next Vidange (Interval): **10000** km
     - Cost: 500 DZD
   - Save

### Expected Result
✅ **Card should show:**
```
Vidange
Dernier: [Today's date]
À 15000 km
Prochain à 10000 km
```
```
Restant: 10000 KM  🟢  (GREEN)
```

### Formula Verification
```
lastMileage = 15,000 km
interval = 10,000 km
nextAbsoluteTarget = 15,000 + 10,000 = 25,000 km
kmRemaining = 25,000 - 15,000 = 10,000 km ✓
```

---

## FIX 1: Test Color Thresholds

### Test 1: Green Color (>2000 km)
1. Create vidange with:
   - Current Mileage: 10,000 km
   - Interval: 5000 km
   - Car Mileage: 12,000 km
   - **kmRemaining = (10,000 + 5,000) - 12,000 = 3,000 km**
2. ✅ Should show **3000 KM 🟢 GREEN** (>2000)

### Test 2: Yellow Color (0-2000 km)
1. Create vidange with:
   - Current Mileage: 10,000 km
   - Interval: 5000 km
   - Car Mileage: 13,000 km
   - **kmRemaining = (10,000 + 5,000) - 13,000 = 2,000 km**
2. ✅ Should show **2000 KM 🟡 YELLOW** (0-2000)

### Test 3: Red Color (≤0 km - Overdue)
1. Create vidange with:
   - Current Mileage: 10,000 km
   - Interval: 5000 km
   - Car Mileage: 16,000 km
   - **kmRemaining = (10,000 + 5,000) - 16,000 = -1,000 km**
2. ✅ Should show **1000 KM 🔴 RED** (negative = overdue)

### Test 4: Chaîne (Chain) - Same Formula
1. Repeat steps above but with "Chaîne" section
2. ✅ Should use identical calculation and colors

### Test 5: Insurance/Contrôle - Day-based
1. Add Assurance with:
   - Expiration Date: 45 days from today
   - **daysRemaining = 45**
2. ✅ Should show **45 Jours 🟢 GREEN** (>30)

1. Add Assurance with:
   - Expiration Date: 15 days from today
   - **daysRemaining = 15**
2. ✅ Should show **15 Jours 🟡 YELLOW** (0-30)

1. Add Assurance with:
   - Expiration Date: 5 days ago (expired)
   - **daysRemaining = -5**
2. ✅ Should show **5 Jours 🔴 RED** (negative)

---

## FIX 2: Reservation Expiry Alert Testing

### Setup Steps

1. **Open the AutoLocation app** → Navigate to **Dashboard**

2. **Create a test reservation**:
   - Go to **Planner** or **Reservations**
   - Click "+ New Reservation"
   - Fill in Step 1:
     - Select any car
     - Departure Date: Tomorrow
     - Departure Time: 10:00 AM
     - Return Date: **Tomorrow** (same day)
     - Return Time: 5:00 PM
     - Select agencies
   - Fill in Step 2: Client details
   - Complete and save reservation

3. **Verify reservation status**:
   - Status should be: "confirmed" or "active"

4. **Go back to Dashboard**:
   - You should see the reservation in "Alerts" section

### Expected Result
✅ **Should appear in "Réservation Alerts" section:**

**Alert Card shows:**
- 🔔 Icon (bell)
- Orange background (warning)
- Title: "Réservation expire demain"
- Body: "La réservation de [CLIENT NAME] pour [VEHICLE] expire demain ([DATE])"
- Status: Tappable to navigate to reservation

---

## FIX 2: Browser Notification Testing

### Prerequisites
1. Browser must support Web Notifications (Chrome, Firefox, Safari, Edge)
2. Notifications must be allowed in browser settings

### Test Steps

1. **On Dashboard, check browser console:**
   ```
   [Dashboard] Scheduled [N] notification(s) for expiring reservations
   [Notification] Scheduled notification: {...}
   ```

2. **Check browser permission prompt:**
   - Browser should ask: "Allow notifications from this site?"
   - Click "Allow"

3. **Verify localStorage:**
   - Open Browser DevTools → Application → LocalStorage
   - Find key: `scheduled_notifications`
   - Should contain JSON array with notification object:
   ```json
   [
     {
       "id": "reservation-123-expiry-9am",
       "reservationId": "reservation-123",
       "type": "reservation_expiry",
       "scheduledTime": "2026-05-07T09:00:00.000Z",
       "message": "La réservation de John Doe pour Toyota Corolla expire demain!",
       "triggered": false
     }
   ]
   ```

4. **Wait for 9:00 AM on reservation return date:**
   - At 9:00 AM ± 5 minutes, browser notification should appear
   - Title: 🔔 La réservation de [Name] pour [Vehicle] expire demain!

5. **Check console for trigger:**
   ```
   [Notification] Triggered scheduled notification: reservation-123-expiry-9am
   ```

### Manual Notification Trigger (for testing)
1. Open Browser Console (F12)
2. Run:
```javascript
// Request permission first
Notification.requestPermission();

// Then trigger manually
new Notification('🔔 Test Notification', {
  body: 'La réservation de John Doe expire demain!',
  icon: '🚗'
});
```

---

## Deduplication Test

### Test Duplicate Prevention

1. **Load Dashboard** → System schedules notifications
2. **Refresh page** → System schedules again
3. **Check localStorage:**
   - Should still have only 1 notification per reservation
   - NOT 2 duplicates
4. ✅ If only 1 remains → Deduplication works!

---

## Full End-to-End Test Scenario

### Complete Flow:
1. ✅ Add Vidange: 15000 km base, 10000 km interval
2. ✅ Verify shows 10000 KM 🟢 on card
3. ✅ Create reservation returning tomorrow
4. ✅ Go to Dashboard
5. ✅ See "expiring_tomorrow" alert card
6. ✅ Check browser console for scheduling
7. ✅ Allow notifications when prompted
8. ✅ Check localStorage for scheduled notification
9. ✅ (Optional) Wait for 9:00 AM to see browser notification

---

## Troubleshooting

### Maintenance Card shows 0 KM
- ❌ Problem: Old calculation not updated
- ✅ Solution: Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)

### Maintenance Card shows wrong colors
- ❌ Problem: Thresholds not applied
- ✅ Solution: Check getStatusColor() in maintenanceService.ts
- ✅ Verify: 2000 km threshold, not 1000

### Reservation Alert not showing
- ❌ Problem: Return date might not be tomorrow
- ✅ Solution: Create new reservation with returnDate = tomorrow
- ✅ Verify: Reservation status is "active" or "confirmed"

### Notifications not appearing
- ❌ Problem: Permission denied
- ✅ Solution: Check browser notification settings
- ✅ Verify: Site has notification permission
- ❌ Problem: 9:00 AM hasn't arrived
- ✅ Solution: Check localStorage - should be scheduled
- ✅ Manual test: Use console to send notification

### localStorage is empty
- ❌ Problem: Notifications not scheduled
- ✅ Solution: Check DashboardPage useEffect
- ✅ Verify: getReservationAlerts includes expiring_tomorrow
- ✅ Console: Should show "Scheduled [N] notification(s)"

---

## Quick Checklist

### FIX 1 - Maintenance KM
- [ ] Created test vehicle with 15000 km mileage
- [ ] Added Vidange with 15000 km current, 10000 km interval
- [ ] Verified card shows 10,000 KM remaining in green
- [ ] Tested yellow color (0-2000 km)
- [ ] Tested red color (≤0 km/overdue)
- [ ] Tested chaîne with same formula
- [ ] Tested insurance/contrôle with day thresholds

### FIX 2 - Reservation Alerts
- [ ] Created reservation returning tomorrow
- [ ] Loaded Dashboard
- [ ] Alert appears in "Réservations" section
- [ ] Alert shows correct client and vehicle name
- [ ] Alert is clickable (navigates to reservation)
- [ ] Browser allowed notifications
- [ ] Console shows scheduling message
- [ ] localStorage contains scheduled notification
- [ ] Deduplication verified (no duplicates)
- [ ] (Optional) Waited for 9:00 AM notification

---

## Support

If tests fail:
1. Check browser console for errors
2. Verify file modifications were saved
3. Hard refresh browser (clear cache)
4. Check localStorage is enabled
5. Review detailed logs in console (search for "[Dashboard]", "[Notification]")

