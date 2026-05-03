# Troubleshooting Guide: Creator Info Not Displaying

## Quick Diagnosis Steps

### Step 1: Check Browser Console During Creation
1. Open your app in browser
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Create a new reservation
5. Look for these logs:

```
Creating reservation with creator info: {
  createdBy: "...",
  createdByName: "..."
}

✅ Reservation created successfully with ID: ...
```

**Problem if:**
- You don't see these logs → Form might have JS error (check for red errors)
- `createdByName` is null → User object not passed to form
- Error shows → Creator saving failed (read error message)

---

### Step 2: Check Data Flow in Service
1. Keep console open
2. Navigate to Planner Page (or refresh if already there)
3. Look for these logs:

```
📦 Raw reservation data from DB (first item): {
  id: "...",
  created_by: "uuid" or null,
  created_by_name: "John Doe" or null,
  allKeys: [...]
}

✅ Mapped reservation: {
  id: "...",
  createdBy: "uuid" or null,
  createdByName: "John Doe" or null
}

Reservation: {
  id: "...",
  createdBy: "uuid" or null,
  createdByName: "John Doe" or null,
  hasCreatedByName: true/false
}
```

**Problem if:**
- Raw DB data shows `created_by` and `created_by_name` are null → Data wasn't saved to DB
- Mapped data shows null → Service mapping has issue
- Component data shows null → Data lost somewhere in pipeline

---

### Step 3: Verify Card Display

**Expected Display (If Data Exists):**
```
👤 Créée par
John Doe
```
- Indigo/Blue gradient background
- Dark indigo text
- Shows actual name

**Fallback Display (If No Data):**
```
👤 Créée par
(Non disponible)
```
- Gray gradient background
- Gray text
- Shows "(Non disponible)" placeholder

---

## Common Issues & Solutions

### Issue 1: Creator Info Shows "(Non disponible)"

**Cause:** Data not being saved to database

**Solution:**
1. Check if database columns exist:
   - Run this SQL:
   ```sql
   SELECT created_by, created_by_name FROM reservations LIMIT 1;
   ```
   - If error: Run migration file `add_created_by_reservation.sql`

2. Check if user is being passed:
   - Look at console log during creation
   - Verify `createdByName` is not null

---

### Issue 2: Console Shows Error During Creation

**Example Error:**
```
❌ Error creating reservation with creator info: {
  error: "Column created_by_name does not exist",
  ...
}
```

**Solution:**
- Database migration not run
- Run: `add_created_by_reservation.sql`
- Reconnect to database

---

### Issue 3: Creator Info Doesn't Show on Card

**Even Though Console Shows Data:**

Check these:
1. **Is the conditional rendering correct?**
   ```tsx
   {reservation.createdByName && (...)}
   ```
   
2. **Is the field name correct?**
   - Should be: `reservation.createdByName` (camelCase)
   - NOT: `reservation.created_by_name` (snake_case)

3. **Did you refresh the page?**
   - Reload browser to see new data

---

### Issue 4: Creator Info Shows on Old Cards But Not New

**Cause:** Only new reservations have creator info saved

**Solution:**
- This is expected behavior
- Old reservations have NULL values
- New reservations will show the creator

**To Populate Old Reservations:**
```sql
-- Temporary fix: Mark all as created by admin
UPDATE reservations 
SET created_by_name = 'Admin' 
WHERE created_by_name IS NULL;
```

---

## Console Command Cheatsheet

### Copy this to your browser console to debug:

```javascript
// See all reservations and their creator info
console.table(window.__reservations?.map(r => ({
  id: r.id,
  client: r.client?.firstName,
  createdByName: r.createdByName,
  status: r.status
})));

// Check if user object has data
console.log('Current User:', {
  id: window.__user?.id,
  name: window.__user?.full_name
});
```

---

## Expected Behavior

### Creation Flow:
1. User clicks "Create Reservation"
2. Form loads with user data
3. User fills form and submits
4. Console shows: `Creating reservation with creator info...`
5. After success: `✅ Reservation created successfully...`
6. Alert appears: "Réservation créée avec succès"
7. Page reloads or navigates back

### Display Flow:
1. Go to Planner Page
2. Console shows: `📦 Raw reservation data from DB...`
3. Console shows: `✅ Mapped reservation...`
4. Console shows per-card: `Reservation: { ... createdByName: "John" }`
5. Card displays indigo badge with creator name

---

## Still Having Issues?

1. **Open Developer Tools** (F12)
2. **Go to Console tab**
3. **Perform the action** (create reservation, view planner)
4. **Copy all console output**
5. **Check for red errors** - these will point to the issue

The console logs are very detailed - they will show exactly where in the process things go wrong!
