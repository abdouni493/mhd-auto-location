# Debug Logs Visual Guide - What to Look For

## Console Log Examples

### ✅ SUCCESSFUL LOGIN FLOW

```
[Supabase] === CLIENT INITIALIZATION ===
[Supabase] URL: https://tjyqmxiqeegcnvopibyb.supabase.co...
[Supabase] Using custom storage handlers with logging
[Supabase] === CLIENT READY ===

[Login] ======= LOGIN/SIGNUP ATTEMPT STARTED at 14:30:45
[Login] === EMAIL LOGIN ===
[Login] Email detected - attempting Supabase auth only for: admin@example.com

[Storage] setItem(supabase.auth.token): { length: 1256, preview: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ..." }

[Login] === EMAIL AUTH SUCCESSFUL ===
[Login] Email login user: { name: "Admin User", email: "admin@example.com", role: "admin" }
[Login] Session token length: 1256
[Login] localStorage after login: {
  has_token: true,
  token_preview: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ..."
}
[Login] Calling onLogin callback...

[Auth] ======= LOGIN HANDLER STARTED =======
[Auth] User logged in: { name: "Admin User", role: "admin", email: "admin@example.com" }
[Auth] Current localStorage state: {
  has_token: true,
  token_preview: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ..."
}
[Auth] 500ms delay complete, setting isAuthLoading to false

(Dashboard loads successfully)
```

✅ **Indicators of Success:**
- ✓ "EMAIL AUTH SUCCESSFUL" appears
- ✓ "LOGIN HANDLER STARTED" appears
- ✓ Token is stored in localStorage
- ✓ No error messages
- ✓ Token length is > 1000 bytes

---

### ✅ SUCCESSFUL SESSION RESTORATION (Page Refresh)

```
[Auth] ======= SESSION RESTORATION STARTED =======
[Auth] Timestamp: 14:30:52
[Auth] === STEP 1: Check localStorage ===
[Auth] localStorage keys: ['supabase.auth.token']
[Auth] Has supabase.auth.token: true
[Auth] Token length: 1256
[Auth] Token preview: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...

[Auth] === STEP 2: Found session in localStorage, calling getSession() ===
[Auth] About to call supabase.auth.getSession()...

[Storage] getItem(supabase.auth.token): {
  has_value: true,
  length: 1256
}

[Auth] === STEP 3: getSession() returned ===
[Auth] Has session: true
[Auth] Has error: false
[Auth] Session user email: admin@example.com
[Auth] Session access token length: 1256
[Auth] Session expires at: 1705340452

[Auth] === STEP 4: Session is valid, restoring user ===
[Auth] Restored user: { name: "Admin User", email: "admin@example.com", role: "admin" }

[Auth] === SESSION RESTORATION SUCCESSFUL ===
```

✅ **Indicators of Success:**
- ✓ All 4 steps are logged
- ✓ Step 1: Token found in localStorage
- ✓ Step 2: getSession() called
- ✓ Step 3: getSession() returns session (not null)
- ✓ Step 4: Session is valid
- ✓ No errors reported
- ✓ User is restored

---

### ❌ PROBLEM: 429 TOO MANY REQUESTS

```
[Login] === EMAIL AUTH SUCCESSFUL ===
[Auth] ======= LOGIN HANDLER STARTED =======

[Fetch] GET https://tjyqmxiqeegcnvopibyb.supabase.co/rest/v1/users?select=%2A
[Fetch] Status: 200

[Fetch] POST https://tjyqmxiqeegcnvopibyb.supabase.co/auth/v1/token?grant_type=refresh_token
[Fetch] ⚠️ 429 TOO MANY REQUESTS on POST /auth/v1/token
[Fetch] Response headers: {
  'content-type': 'application/json; charset=utf-8',
  'retry-after': '60',
  'x-ratelimit-limit': '600',
  'x-ratelimit-remaining': '0',
  'x-ratelimit-reset': '1705337460'
}
[Fetch] Call stack:
    at getUser (supabase.ts:234)
    at async getDashboardData (dashboardService.ts:42)
    at async useEffect (dashboard.tsx:18)
    ...
```

❌ **Problem Indicators:**
- ✗ "429 TOO MANY REQUESTS" appears
- ✗ Call stack shows what triggered it (getUser → dashboardService)
- ✗ x-ratelimit-remaining: 0 (quota exceeded)
- ✗ This happens AFTER successful login

**What it means:** Token refresh is being triggered automatically. The call stack shows `getUser` in `supabase.ts` is the trigger point.

---

### ❌ PROBLEM: Session Not Restored on Refresh

```
[Auth] ======= SESSION RESTORATION STARTED =======
[Auth] === STEP 1: Check localStorage ===
[Auth] localStorage keys: []
[Auth] Has supabase.auth.token: false

[Auth] === STEP 2: No session found in localStorage ===

[Auth] === NO VALID SESSION, USER IS LOGGED OUT ===
```

❌ **Problem Indicators:**
- ✗ localStorage is empty (no keys)
- ✗ Token not found
- ✗ "NO VALID SESSION" appears
- ✗ You're logged out after refresh

**What it means:** Token was never saved to localStorage, OR it was deleted/cleared.

**Next step:**
1. Check if login saved the token (look for "setItem" logs during login)
2. If token should be there but isn't, it was deleted somehow
3. Clear and try login again: `window.__DEBUG__.clearAuth()`

---

### ❌ PROBLEM: Session in Storage But getSession() Fails

```
[Auth] === STEP 1: Check localStorage ===
[Auth] Has supabase.auth.token: true
[Auth] Token length: 1256

[Auth] === STEP 2: Found session in localStorage, calling getSession() ===

[Auth] === STEP 3: getSession() returned ===
[Auth] Has session: false
[Auth] Has error: true
[Auth] Error: Invalid JWT
[Auth] Error status: 401

[Auth] === NO VALID SESSION, USER IS LOGGED OUT ===
```

❌ **Problem Indicators:**
- ✗ Token exists in localStorage
- ✗ But getSession() returns "Invalid JWT" error
- ✗ HTTP status 401 (Unauthorized)
- ✗ Session is invalid

**What it means:** Token in storage is corrupted or expired.

**Solution:**
```javascript
window.__DEBUG__.clearAuth()  // Clear it
// Then refresh and login again
```

---

### Running the Diagnostic

```javascript
window.__DEBUG__.fullDiagnostic(window.__supabase__)
```

**Output would look like:**

```
========== FULL AUTH DIAGNOSTIC ==========

[Debug] Timestamp: 1/15/2025, 2:30:52 PM

[Debug] === LOCALSTORAGE DEBUG ===
[Debug] Total keys in localStorage: 1
[Debug] [supabase.auth.token]: "eyJhbGciOiJIUzI1NiIsInR5cCI6..."

[Debug] === SESSION CHECK ===
[Debug] Calling supabase.auth.getSession()...
[Debug] getSession result: {
  hasSession: true,
  userEmail: "admin@example.com",
  tokenLength: 1256,
  tokenExpiry: Wed Jan 15 2025 04:00:52 GMT-0500
}

[Debug] === USER CHECK ===
[Debug] Calling supabase.auth.getUser()...
[Debug] getUser result: {
  hasUser: true,
  userEmail: "admin@example.com",
  userId: "abc123def456"
}

[Debug] === SUMMARY ===
{
  localStorage_has_token: true,
  session_exists: true,
  user_exists: true,
  session_user_email: "admin@example.com",
  auth_user_email: "admin@example.com",
  all_consistent: true
}

========== END DIAGNOSTIC ==========
```

✅ **All Good if:**
- localStorage_has_token: **true**
- session_exists: **true**
- user_exists: **true**
- all_consistent: **true** (both have same email)

❌ **Problem if:**
- localStorage_has_token: **false** (token not saved)
- session_exists: **false** (Supabase lost session)
- user_exists: **false** (User not authenticated)
- all_consistent: **false** (different emails = mismatch)

---

## Quick Problem Identification

### Problem: "I get 429 errors"
1. Search console for "429"
2. Look at the URL and timestamp
3. Look at the Call Stack below it
4. That shows which function is causing the token refresh

### Problem: "Session doesn't persist after refresh"
1. After login, check: `window.__DEBUG__.checkStorage()`
2. Should show: `has_token: true`
3. If false, token never saved (check login logs)
4. Then refresh page
5. Check again: should still show `has_token: true`
6. If it becomes false, something is clearing it

### Problem: "I'm not sure what's happening"
1. Run this: `window.__DEBUG__.fullDiagnostic(window.__supabase__)`
2. Screenshot the output
3. Look at SUMMARY section
4. If all_consistent: true, auth is working fine
5. If anything is false, that's where the problem is

---

## Color-Coded Severity

### 🟢 Good (Expected)
```
[Auth] === LOGIN HANDLER STARTED ===
[Auth] === SESSION RESTORATION SUCCESSFUL ===
[Storage] setItem(supabase.auth.token)
[Storage] getItem(supabase.auth.token): { has_value: true }
```

### 🟡 Warning (Might be OK)
```
[Auth] === STEP 2: No session found in localStorage ===
(This is OK if first time loading)
```

### 🔴 Error (Problem)
```
[Fetch] ⚠️ 429 TOO MANY REQUESTS
[Auth] === NO VALID SESSION ===
[Auth] Error getting session: Invalid JWT
```

---

## Checklist for Testing

- [ ] Open DevTools (F12)
- [ ] Clear console (button with circle/slash)
- [ ] Attempt login
- [ ] See "EMAIL AUTH SUCCESSFUL"?
- [ ] See "LOGIN HANDLER STARTED"?
- [ ] See any "429" errors?
- [ ] Dashboard loads?
- [ ] Refresh page (F5)
- [ ] See "SESSION RESTORATION SUCCESSFUL"?
- [ ] Still logged in (no login screen)?
- [ ] Run: `window.__DEBUG__.fullDiagnostic(window.__supabase__)`
- [ ] Is all_consistent: true?

---

## Share This Info When Reporting Issues

1. Screenshot of console during login
2. Screenshot of console after refresh
3. Output of: `window.__DEBUG__.fullDiagnostic(window.__supabase__)`
4. Presence or absence of 429 errors
5. Whether session persists after refresh

This gives complete picture of what's happening.
