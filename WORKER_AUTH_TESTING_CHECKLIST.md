# 🧪 WORKER AUTH SYSTEM - TESTING CHECKLIST

## Pre-Testing Setup

- [ ] Application running locally
- [ ] Supabase project accessible
- [ ] Browser DevTools available (F12)
- [ ] Logged in as admin

---

## Test Suite

### TEST 1: Create New Worker

**Objective:** Verify worker can be created with Supabase Auth

**Steps:**
1. Navigate to **Configuration → Équipe (Team)**
2. Click **"Ajouter" (Add)** button
3. Fill in the form:
   ```
   Full Name:        Test Worker 1
   Email:            testworker1@luxdrive.dz
   Phone:            +213 5 1234 5678
   Date of Birth:    1990-01-15
   Address:          Algiers, Algeria
   Type:             worker
   Payment Type:     monthly
   Base Salary:      4000
   Username:         test.worker1
   Password:         TestPass123
   ```
4. Click **"Save"**

**Expected Result:**
- ✅ Success message appears
- ✅ Worker appears in the list
- ✅ Browser console shows:
  ```
  [DatabaseService] Creating Supabase Auth user for worker: testworker1@luxdrive.dz
  [DatabaseService] Auth user created successfully: [user-id]
  [DatabaseService] Worker record created successfully
  ```

**Failure Modes to Check:**
- ❌ "Email already exists" → Use different email
- ❌ "Password too short" → Use 6+ characters
- ❌ "Invalid email format" → Check email format

---

### TEST 2: Worker Login - Valid Credentials

**Objective:** Verify worker can login with email and password

**Steps:**
1. Click **Logout** (if needed)
2. Navigate to **Login page**
3. In the login form enter:
   ```
   Email:    testworker1@luxdrive.dz
   Password: TestPass123
   ```
4. Click **"Login"**
5. Open **DevTools Console** (F12) to watch logs

**Expected Result:**
- ✅ Form submits
- ✅ Brief loading animation
- ✅ Redirected to dashboard
- ✅ User info displays in header
- ✅ Browser console shows:
  ```
  [Login] === AUTHENTICATION ATTEMPT ===
  [Login] Email authentication for: testworker1@luxdrive.dz
  [Login] === AUTHENTICATION SUCCESSFUL ===
  [Login] User authenticated: {name, email, role}
  ```

**Failure Modes to Check:**
- ❌ Error message → Check credentials
- ❌ Page doesn't redirect → Check browser console for errors
- ❌ No console logs → Check DevTools is open

---

### TEST 3: Worker Login - Invalid Password

**Objective:** Verify system rejects wrong password

**Steps:**
1. Click **Logout**
2. Go to **Login page**
3. Enter:
   ```
   Email:    testworker1@luxdrive.dz
   Password: WrongPassword
   ```
4. Click **"Login"**

**Expected Result:**
- ✅ Error message: **"Email ou mot de passe incorrect."** (French)
- ✅ Or: **"البريد الإلكتروني أو كلمة المرور غير صحيحة."** (Arabic)
- ✅ User stays on login page
- ✅ Browser console shows:
  ```
  [Login] Auth failed: Invalid credentials Status: 400
  ```

---

### TEST 4: Worker Login - Non-existent Email

**Objective:** Verify system rejects non-existent email

**Steps:**
1. Go to **Login page**
2. Enter:
   ```
   Email:    nonexistent@luxdrive.dz
   Password: AnyPassword123
   ```
3. Click **"Login"**

**Expected Result:**
- ✅ Error message: **"Email ou mot de passe incorrect."**
- ✅ Same error as wrong password (security)
- ✅ User stays on login page

---

### TEST 5: Worker Login - Username Not Allowed

**Objective:** Verify system requires email, not username

**Steps:**
1. Go to **Login page**
2. Enter:
   ```
   Email:    test.worker1
   Password: TestPass123
   ```
3. Click **"Login"**

**Expected Result:**
- ✅ Error message: **"Veuillez utiliser votre email pour vous connecter."** (French)
- ✅ Or: **"يرجى استخدام بريدك الإلكتروني للدخول."** (Arabic)
- ✅ User stays on login page
- ✅ Browser console shows:
  ```
  [Login] Username-based login no longer supported. Please use email.
  ```

---

### TEST 6: Session Persistence

**Objective:** Verify session persists on page refresh

**Steps:**
1. Login as worker (Test 2)
2. Verify on dashboard
3. Refresh page (F5 or Ctrl+R)
4. Wait for page to load

**Expected Result:**
- ✅ Page loads without redirect to login
- ✅ Still logged in as worker
- ✅ User info still shows in header
- ✅ All dashboard features work

---

### TEST 7: Duplicate Email Prevention

**Objective:** Verify system prevents duplicate worker emails

**Steps:**
1. Login as admin
2. Go to **Équipe (Team)**
3. Try to create worker with same email as existing:
   ```
   Email: testworker1@luxdrive.dz  (already exists)
   ```
4. Click **"Save"**

**Expected Result:**
- ✅ Error message appears
- ✅ Modal stays open (not saved)
- ✅ Browser console shows auth error:
  ```
  [DatabaseService] Auth user creation failed: [error message]
  ```

---

### TEST 8: Worker Logout & Re-Login

**Objective:** Verify logout clears session and worker can login again

**Steps:**
1. Logout from worker account
2. Verify back on login page
3. Try to access dashboard directly (browser back button)
4. Go to login page again
5. Login with same worker credentials
6. Verify successful

**Expected Result:**
- ✅ Logout clears session
- ✅ Direct dashboard access redirects to login
- ✅ Re-login works normally
- ✅ Can access dashboard again

---

### TEST 9: Multiple Workers

**Objective:** Verify multiple workers can be created and each can login

**Steps:**
1. Create Worker 2:
   ```
   Email:    testworker2@luxdrive.dz
   Password: Worker2Pass123
   ```
2. Create Worker 3:
   ```
   Email:    testworker3@luxdrive.dz
   Password: Worker3Pass123
   ```
3. Logout as admin
4. Login as Worker 2
5. Verify dashboard
6. Logout and login as Worker 3
7. Verify dashboard

**Expected Result:**
- ✅ All workers created successfully
- ✅ Each can login with their own credentials
- ✅ Each gets their own session
- ✅ User info shows correctly for each

---

### TEST 10: Admin Still Works

**Objective:** Verify admin login still works with unified system

**Steps:**
1. Logout
2. Login as admin (use email format):
   ```
   Email:    admin@luxdrive.dz
   Password: AdminPassword
   ```
3. Verify dashboard access

**Expected Result:**
- ✅ Admin can login normally
- ✅ Has access to all admin features
- ✅ Équipe (Team) page accessible
- ✅ Can create/edit/delete workers

---

## Browser Console Testing

### Test: Check Auth Logs

**Steps:**
1. Open DevTools (F12)
2. Go to Console tab
3. Filter: type `[Login]` in console filter
4. Login as worker
5. Look for these messages:
   ```
   ✅ [Login] === AUTHENTICATION ATTEMPT ===
   ✅ [Login] Email authentication for: testworker@luxdrive.dz
   ✅ [Login] === AUTHENTICATION SUCCESSFUL ===
   ✅ [Login] User authenticated: {name: "...", email: "...", role: "worker"}
   ```

---

## Debugging Checklist

If something fails:

- [ ] Check browser console (F12 → Console tab)
- [ ] Look for `[Login]` or `[DatabaseService]` messages
- [ ] Check error messages for clues
- [ ] Verify email format (must have @)
- [ ] Verify password (min 6 characters)
- [ ] Check Supabase dashboard for auth user
- [ ] Verify worker record exists in database

---

## Performance Expectations

### Timeline Expectations

| Operation | Expected Time |
|-----------|----------------|
| Create worker | 1-3 seconds |
| Worker login | 2-5 seconds |
| Session load on refresh | <1 second |
| Error response | <1 second |

### Network Expectations

- [ ] Supabase auth endpoint accessible
- [ ] Database queries successful
- [ ] No 500 errors in browser console
- [ ] No network errors in DevTools Network tab

---

## Rollback Procedure (If Needed)

If issues occur:

1. **Revert Database Changes:**
   ```sql
   -- In Supabase SQL Editor
   -- Delete auth users and worker records
   DELETE FROM public.workers WHERE email LIKE '%test%';
   ```

2. **Revert Code Changes:**
   - Checkout previous version from git
   - Redeploy application

3. **Contact Support:**
   - Check documentation
   - Review error messages
   - Check browser console logs

---

## Sign-Off Checklist

- [ ] TEST 1: Create Worker ✅
- [ ] TEST 2: Worker Login Valid ✅
- [ ] TEST 3: Worker Login Invalid ✅
- [ ] TEST 4: Non-existent Email ✅
- [ ] TEST 5: Username Not Allowed ✅
- [ ] TEST 6: Session Persistence ✅
- [ ] TEST 7: Duplicate Email ✅
- [ ] TEST 8: Logout & Re-login ✅
- [ ] TEST 9: Multiple Workers ✅
- [ ] TEST 10: Admin Still Works ✅

**Status:** When all tests pass, system is ready for production ✅

---

## Quick Reference

### Worker Creation
- Email required, must be valid format
- Password min 6 characters
- Supabase Auth account created automatically
- Email auto-confirmed

### Worker Login
- Use EMAIL (not username)
- Password must match exactly
- Case-sensitive
- Error messages generic for security

### Session
- 24-hour expiry
- Persists on page refresh
- Clears on logout
- Stored in database, not localStorage

