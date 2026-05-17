# 🔴 WORKER LOGIN ERROR FIX - IMMEDIATE ACTION GUIDE

## The Problem
```
POST https://tjyqmxiqeegcnvopibyb.supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)
[Login] Email auth failed: Invalid login credentials Status: 400
```

Workers created from the equipe (team) interface cannot login because the `login_worker` RPC function is missing execute permissions for **anonymous users** (unauthenticated users).

---

## The Root Cause

When a worker tries to login:
1. They are **unauthenticated** (anon role)
2. They call the `login_worker` RPC function
3. Supabase checks: "Can this unauthenticated user call this function?"
4. Result: **NO** ❌ (only authenticated users have permission)
5. Error: 400 Bad Request

---

## ⚡ QUICK FIX (2 MINUTES)

### Step 1: Go to Supabase Dashboard
1. Open: https://app.supabase.com
2. Select your project: `tjyqmxiqeegcnvopibyb`
3. Go to **SQL Editor**

### Step 2: Execute the SQL Fix
Copy and paste this SQL in the SQL Editor:

```sql
-- Grant execute permission to anon role (for unauthenticated users during login)
GRANT EXECUTE ON FUNCTION public.login_worker(TEXT, TEXT) TO anon;

-- Grant execute permission to authenticated role (for users after login)
GRANT EXECUTE ON FUNCTION public.login_worker(TEXT, TEXT) TO authenticated;

-- Create performance indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_workers_username_password 
ON public.workers(username) 
WHERE type IN ('admin', 'worker', 'driver');

CREATE INDEX IF NOT EXISTS idx_workers_email_password 
ON public.workers(email) 
WHERE type IN ('admin', 'worker', 'driver');
```

Click **Run** button.

### Step 3: Refresh and Test
1. Go back to your application: `http://localhost:3000`
2. Refresh the page (Ctrl+F5 or Cmd+Shift+R)
3. Try logging in with a worker account using:
   - **Username**: (whatever you set in the equipe interface)
   - **Password**: (the password you set)

---

## ✅ Expected Results

### Before Fix ❌
- Login with worker account → 400 error
- Error message: "Identifiants invalides" or connection error
- Cannot access dashboard

### After Fix ✅
- Login with worker account → Success
- Redirected to dashboard
- User info displayed in header
- Can access all worker features

---

## 🔍 How to Verify It's Fixed

### Check 1: In Supabase Dashboard
1. Go to **SQL Editor**
2. Run this query:
```sql
SELECT * FROM information_schema.role_routine_grants 
WHERE routine_name = 'login_worker';
```

You should see:
- `anon` with execute permission ✅
- `authenticated` with execute permission ✅

### Check 2: Test Worker Login
Use any worker account you created from the equipe interface:
1. Username: (from equipe interface)
2. Password: (from equipe interface)
3. Should login successfully

### Check 3: Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Try logging in with a worker account
4. You should see:
```
[Login] === WORKER LOGIN ===
[Login] Worker RPC response: {success: true, worker: {...}}
[Login] === WORKER AUTH SUCCESSFUL ===
```

---

## 🚨 If It Still Doesn't Work

### Troubleshooting Step 1: Verify Worker Exists
In Supabase SQL Editor, run:
```sql
SELECT id, full_name, email, username, type FROM public.workers 
WHERE type IN ('worker', 'admin', 'driver');
```

You should see the worker you created.

### Troubleshooting Step 2: Check Password
In Supabase SQL Editor, run:
```sql
SELECT id, username, password FROM public.workers 
WHERE username = 'YOUR_USERNAME_HERE';
```

Make sure:
- Username matches what you're entering
- Password matches what you're entering
- Both are non-empty

### Troubleshooting Step 3: Test RPC Directly
In Supabase SQL Editor, run:
```sql
SELECT public.login_worker('YOUR_USERNAME', 'YOUR_PASSWORD');
```

Should return:
```
{"success":true,"worker":{"id":"...","full_name":"...","email":"...","username":"...","type":"worker","profile_photo":null}}
```

If it returns `{"success":false}`, the username/password is wrong.

### Troubleshooting Step 4: Check Function Definition
In Supabase SQL Editor, run:
```sql
\df+ public.login_worker
```

Should show:
- Function name: `login_worker`
- Language: `plpgsql`
- Security: `definer` (SECURITY DEFINER)

---

## 📚 Alternative: Complete Function Rebuild

If the above doesn't work, run the complete fix script:

```sql
-- Drop the existing function
DROP FUNCTION IF EXISTS public.login_worker(TEXT, TEXT);

-- Recreate it from scratch
CREATE OR REPLACE FUNCTION public.login_worker(p_email_or_username TEXT, p_password TEXT)
RETURNS JSON AS $$
DECLARE
    worker_record RECORD;
BEGIN
    -- Try to find worker by email first
    SELECT id, full_name, email, username, type, profile_photo, password INTO worker_record
    FROM public.workers
    WHERE email = p_email_or_username AND password = p_password
    LIMIT 1;

    -- If not found by email, try by username
    IF worker_record IS NULL THEN
        SELECT id, full_name, email, username, type, profile_photo, password INTO worker_record
        FROM public.workers
        WHERE username = p_email_or_username AND password = p_password
        LIMIT 1;
    END IF;

    -- If worker found, return success with worker data
    IF worker_record IS NOT NULL THEN
        RETURN json_build_object(
            'success', true,
            'worker', json_build_object(
                'id', worker_record.id,
                'full_name', worker_record.full_name,
                'email', worker_record.email,
                'username', worker_record.username,
                'type', worker_record.type,
                'profile_photo', worker_record.profile_photo
            )
        );
    END IF;

    -- If no worker found, return failure
    RETURN json_build_object(
        'success', false, 
        'error', 'Invalid credentials',
        'worker', NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.login_worker(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.login_worker(TEXT, TEXT) TO authenticated;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workers_username_password 
ON public.workers(username) 
WHERE type IN ('admin', 'worker', 'driver');

CREATE INDEX IF NOT EXISTS idx_workers_email_password 
ON public.workers(email) 
WHERE type IN ('admin', 'worker', 'driver');
```

---

## 🎯 Summary

| Step | Action | Status |
|------|--------|--------|
| 1 | Go to Supabase SQL Editor | ▶️ DO THIS |
| 2 | Run the GRANT permissions SQL | ▶️ DO THIS |
| 3 | Refresh application | ⏳ DO THIS |
| 4 | Test worker login | ✅ SHOULD WORK |

---

## 📞 Still Need Help?

Check:
1. Browser console for detailed error messages (F12 → Console)
2. Supabase logs (Dashboard → Database → Logs)
3. Your worker's username/password are correct
4. Worker record exists in the database with your credentials

