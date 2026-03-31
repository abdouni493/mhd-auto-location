# Deep Debugging Implementation Summary

## What Changed

This implementation adds **comprehensive diagnostic logging** to the app without fixing the underlying issues yet. This gives you complete visibility into what's happening during authentication and API calls.

## Files Modified

### 1. **src/App.tsx**
**Changes:**
- Added import for `setupErrorInterceptor` and `DebugAuth`
- Initialized global error interceptor on app startup
- Made Supabase client available as `window.__supabase__` for console access
- Enhanced `handleLogin()` with detailed logging showing:
  - Login handler timing
  - Current localStorage state after login
  - User details and role
- Enhanced session restoration with step-by-step logging:
  - Step 1: Check localStorage contents
  - Step 2: Call getSession()
  - Step 3: Check getSession() response
  - Step 4: Restore user or report failure
  - Timestamps for each step

**Why:** Shows exactly what happens during login and session restoration

### 2. **src/supabase.ts**
**Changes:**
- Enhanced custom storage handlers with logging
- `getItem()` logs when tokens are retrieved
- `setItem()` logs when tokens are saved (shows size and preview)
- `removeItem()` logs when tokens are cleared
- All operations include token length and preview data
- Error handling logs failures

**Why:** Reveals when and how tokens are being stored/retrieved

### 3. **src/components/Login.tsx**
**Changes:**
- Added timestamps to login attempts
- Enhanced logging for each authentication path:
  - **Signup path:** Shows signup success and user restoration
  - **Email login path:** Shows email auth success, token details, localStorage state
  - **Worker login path:** Shows RPC call success, worker details
- Logs error messages when login fails
- Logs localStorage state immediately after successful auth
- Added callback invocation logging

**Why:** Tracks what happens during login and identifies which auth path is used

### 4. **src/utils/debugAuth.ts** (Enhanced)
**Changes:**
- Rewrote all functions with detailed console output
- `checkStorage()`: Shows all localStorage keys, token details, JSON parsing status
- `checkSession()`: Calls getSession() and shows full results with token expiry
- `checkUser()`: Calls getUser() and shows user metadata
- `fullDiagnostic()`: Runs all checks and shows summary
- `clearAuth()`: Clears all auth data for fresh login testing
- Added comprehensive comments for each function
- Made debug utility available as `window.__DEBUG__`

**Why:** Provides on-demand diagnostic tools that can be run from browser console

### 5. **src/utils/errorInterceptor.ts** (New)
**Changes:**
- Intercepts all `fetch()` requests globally
- Logs every request with method and URL
- Detects HTTP errors (non-2xx status)
- Specifically tracks 429 errors with:
  - Full URL and method
  - Response headers (retry-after, rate limit info)
  - Call stack showing where request came from
- Safe error handling - doesn't break app functionality

**Why:** Captures all API calls and pinpoints when/where 429 errors occur

## What You Can Now Do

### From Browser Console:

**Full diagnostic:**
```javascript
window.__DEBUG__.fullDiagnostic(window.__supabase__)
```

**Check individual components:**
```javascript
window.__DEBUG__.checkStorage()
window.__DEBUG__.checkSession(window.__supabase__)
window.__DEBUG__.checkUser(window.__supabase__)
```

**Clear auth for fresh login:**
```javascript
window.__DEBUG__.clearAuth()
```

### In Console Logs:

You'll now see detailed output like:

```
[Auth] ======= LOGIN HANDLER STARTED =======
[Auth] User logged in: { name: "admin", role: "admin", email: "admin@test.com" }
[Auth] Current localStorage state: {
  has_token: true,
  token_preview: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ..."
}

[Storage] setItem(supabase.auth.token): {
  length: 1256,
  preview: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ..."
}

[Fetch] POST https://tjyqmxiqeegcnvopibyb.supabase.co/auth/v1/token?grant_type=refresh_token
[Fetch] ⚠️ 429 TOO MANY REQUESTS on POST /auth/v1/token
[Fetch] Call stack: [at specific function or line]
```

## Key Logging Patterns

### During Login (Success Case)
```
[Login] ======= LOGIN/SIGNUP ATTEMPT STARTED
[Login] === EMAIL LOGIN ===
[Storage] setItem(supabase.auth.token)
[Login] === EMAIL AUTH SUCCESSFUL ===
[Auth] ======= LOGIN HANDLER STARTED =======
```

### During Session Restoration (On Page Refresh)
```
[Auth] ======= SESSION RESTORATION STARTED =======
[Auth] === STEP 1: Check localStorage ===
[Auth] Has supabase.auth.token: true
[Auth] === STEP 2: Found session in localStorage, calling getSession() ===
[Auth] === STEP 4: Session is valid, restoring user ===
[Auth] === SESSION RESTORATION SUCCESSFUL ===
```

### When 429 Error Occurs
```
[Fetch] ⚠️ 429 TOO MANY REQUESTS on POST /auth/v1/token
[Fetch] Response headers: {
  'x-ratelimit-remaining': '0',
  'retry-after': '60'
}
[Fetch] Call stack: ... <- SHOWS WHERE IT CAME FROM
```

## No Behavior Changes

⚠️ **Important:** These changes are DIAGNOSTIC ONLY:
- App behavior is identical
- Same auth flow as before
- No fixes applied yet
- Only logging and error interception added
- All settings remain the same (autoRefreshToken: false, etc.)

## How to Use This for Diagnosis

### Scenario 1: Getting 429 Errors
1. Open DevTools (F12)
2. Search for "429" in console
3. Note the timestamp and URL
4. Look at call stack to see what triggered it
5. Note the rate limit headers
6. Run `window.__DEBUG__.fullDiagnostic(window.__supabase__)`

### Scenario 2: Session Not Persisting on Refresh
1. Login successfully
2. Refresh page (F5)
3. Look for session restoration logs
4. If they don't appear, check:
   - `window.__DEBUG__.checkStorage()` - is token there?
   - `window.__DEBUG__.checkSession(window.__supabase__)` - does Supabase have it?
5. Try clearing and logging in again: `window.__DEBUG__.clearAuth()`

### Scenario 3: Need to Share Debugging Info
1. Right-click in console
2. Select "Save as..." to save console output
3. Or copy logs while being careful not to include full tokens
4. Token previews only show first 50 characters (safe to share)

## Files for Reference

- 📖 [COMPREHENSIVE_DEBUG_GUIDE.md](./COMPREHENSIVE_DEBUG_GUIDE.md) - Complete guide for using debug tools
- 🔧 [src/utils/debugAuth.ts](./src/utils/debugAuth.ts) - Debug utility source
- 🚨 [src/utils/errorInterceptor.ts](./src/utils/errorInterceptor.ts) - Error interception source

## Next Steps

1. **Test the implementation:**
   - Login and check console for `[Auth]` logs
   - Refresh page and check for session restoration logs
   - Run `window.__DEBUG__.fullDiagnostic(window.__supabase__)` to get full state

2. **When 429 occurs:**
   - Note the timestamp
   - Copy the call stack from the 429 error
   - This will tell us what's triggering the token refresh

3. **Document findings:**
   - What exact steps trigger the 429?
   - Does session persist on refresh?
   - Are there any error logs?
   - What does the diagnostic show?

4. **Once we understand the root cause:**
   - We can implement targeted fixes
   - Without this logging, we're just guessing
   - With this logging, we can be precise

## Technical Details

### Storage Interceptor
- Wrapped localStorage in custom object
- Logs all get/set/remove operations
- Shows token metadata without exposing full tokens
- Error-safe (catches exceptions)

### Error Interception
- Monkey-patches window.fetch
- Logs all requests and responses
- Specifically watches for 429 status
- Captures call stack on errors

### Log Levels
- `[Auth]` - Authentication events
- `[Login]` - Login component events
- `[Debug]` - Debug utility output
- `[Storage]` - Storage operations
- `[Fetch]` - Network requests
- `[Supabase]` - Client initialization

## Security Notes

- ✅ Token previews truncated to first 50 chars
- ✅ Storage operations are read-only (just logging)
- ✅ No sensitive data logged in full
- ✅ Console output only (not sent anywhere)
- ✅ Safe to enable in production for debugging
- ⚠️ Don't share full token values if copying logs
