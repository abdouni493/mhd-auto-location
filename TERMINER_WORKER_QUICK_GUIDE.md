# 🏁 TERMINER - WORKER QUICK GUIDE

## What is "Terminer"?

**Terminer** = **Complete** = **Finish a rental** 

When a customer returns the car and you need to officially close the rental in the system.

---

## ✅ How to Terminate a Rental (Terminer)

### Step 1: Find the Rental
- Go to **Reservations** or **Planner** page
- Look for a rental with status **🔄 Actif** (Active)
- Click on it to view details

### Step 2: Click Complete Button
- Look for the button: **🏁 Terminer** (French) or **🏁 إنهاء** (Arabic)
- Click this button

### Step 3: Fill in the Return Information
You'll see a form with:

| Field | Required | What to Enter |
|-------|----------|---------------|
| **Odometer/Mileage** | ✅ YES | The kilometers on the car when returned |
| **Fuel Level** | ✅ YES | How much fuel is in tank (Full/1/2/1/4/1/8/Empty) |
| **Excess Mileage** | ❌ NO | Extra km beyond agreement (0 if no extra) |
| **Missing Fuel** | ❌ NO | Cost if fuel tank not full (0 if full) |
| **Notes** | ❌ NO | Any additional info about the return |

### Step 4: Check the Car Inspection
- Review the security/equipment checklist
- Mark items as **✅ Yes** (present) or **❌ No** (missing/damaged)
- This documents the car condition

### Step 5: Click Confirm
- Click the blue button: **✅ Terminer la Location** or **✅ إنهاء التأجير**
- Wait for it to process (loading spinner appears)
- You should see: **✅ Reservation completed successfully**

---

## 🚨 If You Get an Error

### Error: "Kilométrage obligatoire" (Mileage Required)
```
❌ Problem: You didn't enter the mileage
✅ Solution: Fill in the "Return Mileage" field with the odometer value
```

### Error: "Permission denied" or "Policy violation"
```
❌ Problem: Your account doesn't have permission
✅ Solution 1: Make sure you're logged in as WORKER account
✅ Solution 2: Tell admin to run the RLS fix
```

### Error: "Cannot connect" or "Network error"
```
❌ Problem: Internet connection issue
✅ Solution 1: Check WiFi or 4G connection
✅ Solution 2: Refresh the page (F5)
✅ Solution 3: Try again after 30 seconds
```

### Error: "Reservation not found"
```
❌ Problem: The rental might have been deleted
✅ Solution: Go back to list and find the correct rental
```

---

## 📱 Works on PC and Mobile

You can complete rentals from:
- ✅ Windows/Mac (Chrome, Firefox, Safari)
- ✅ iPhone/iPad (Safari)
- ✅ Android (Chrome)

**Same steps** - just tap instead of click on mobile

---

## ⚡ Tips & Tricks

### Tip 1: Always Check Odometer
- Take a photo of the odometer
- Compare with system before entering
- Prevents disputes about kilometers

### Tip 2: Check Fuel Level
- Look at fuel gauge on car dashboard
- Match to the fuel level options
- Full = PLEIN = ممتلئ

### Tip 3: Document Damage
- Use notes field to document scratches/damage
- Take photos if needed
- Write clear description

### Tip 4: Do This Immediately
- Complete terminer as soon as customer leaves
- Don't wait hours or days
- While information is fresh and accurate

---

## 🔒 Permissions Required

You need:
- ✅ To be logged in as WORKER/DRIVER/ADMIN
- ✅ Admin to run RLS policies (one time setup)
- ✅ Valid account in database

If you can't see the button:
- You might be logged in as CLIENT (not worker)
- Ask admin to give you worker account

---

## 📊 What Happens After Terminer

1. ✅ Reservation status changes to **🏁 Terminé** (Completed)
2. ✅ Return inspection is automatically created
3. ✅ Car mileage is updated in system
4. ✅ Rental is marked as finished
5. ✅ Can now create invoices/receipts
6. ✅ Rental won't appear in "Active" list anymore

---

## ❌ Problems Solved

This fix resolves:
- ❌ Terminer not working on PC → **✅ Now works**
- ❌ Terminer not working on mobile → **✅ Now works**
- ❌ Worker permission errors → **✅ Now allowed**
- ❌ No error messages → **✅ Now shows errors**
- ❌ Unclear why it failed → **✅ Now explains**

---

## 📞 Need Help?

1. **Check the error message** - it explains the problem
2. **Check browser console** (F12) - shows technical details
3. **Tell admin** if you see "permission denied"
4. **Take a screenshot** of the error for admin

---

## Version Info
- Updated: 2026-05-18
- Status: ✅ Production Ready
- Works on: PC & Mobile
- Languages: 🇫🇷 French & 🇸🇦 Arabic
