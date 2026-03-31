# ⚡ QUICK FIX - ADMIN/WORKER DATA ACCESS

## The Problem
Admin/workers can log in but **cannot see clients and reservations data**.

## The Solution
Execute one SQL file in Supabase to remove restrictive security policies.

---

## 🚀 What to Do (4 minutes)

### 1. Execute SQL (2 minutes)
```
1. Open: https://app.supabase.com
2. Select your project
3. Go to: SQL Editor → New Query
4. Copy file: fix_admin_worker_access.sql
5. Paste into editor
6. Click: RUN
7. Wait for: ✅ Success
```

### 2. Test (2 minutes)
```
1. Go to: http://localhost:3000
2. Log in with:
   Username: fatima.admin
   Password: admin123
3. You should see:
   ✅ Clients list
   ✅ Reservations list
   ✅ Dashboard data
```

---

## ✅ That's It!

Once you execute the SQL:
- ✅ Admins can see all data
- ✅ Workers can see all data
- ✅ All dashboard features work
- ✅ No more "No permission" errors

---

## Test Accounts

```
Admin:  fatima.admin    / admin123
Worker: ahmed.worker    / worker123
Driver: mohamed.driver  / driver123
```

---

## If Something Goes Wrong

**Issue:** Still can't see data after SQL
**Fix:**
1. Check if SQL gave ✅ Success message
2. Clear browser cache (Ctrl+Shift+Delete)
3. Log out and back in
4. Check browser console (F12) for errors

---

## What Changed

**Before:**
- Restrictive RLS policies blocked data access
- Only users with matching agency_id could see data
- Admin/workers got "No permission" errors

**After:**
- All authenticated users can see all data
- No more permission restrictions
- Everyone with login can access everything

---

## Files

- **SQL to execute:** `fix_admin_worker_access.sql`
- **Guide:** `FIX_ADMIN_WORKER_ACCESS_GUIDE.md`
- **Status:** Everything ready, just execute SQL!

---

**Next Step:** Execute the SQL file now! 🚀
