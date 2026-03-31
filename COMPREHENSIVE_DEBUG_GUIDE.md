# Comprehensive Debugging Guide for Auth Issues

## Overview

The app now includes **deep diagnostic logging** that tracks every step of the authentication flow, session management, and API calls. This guide explains how to use these tools to diagnose the 429 rate limit errors and session persistence issues.

## What Was Added

### 1. **Error Interceptor** (`src/utils/errorInterceptor.ts`)
- Intercepts all `fetch` requests and responses
- Logs all HTTP errors with full details
- Specifically tracks 429 "Too Many Requests" errors with rate limit headers
- Logs the call stack when 429 occurs to identify the source

### 2. **Enhanced Logging in App.tsx**
- Session restoration logs every step with timestamps
- Detailed localStorage state inspection
- Validates session data from Supabase

### 3. **Enhanced Logging in Login.tsx**
- Logs when login attempt starts
- Tracks which auth method is used (email vs username)
- Logs session token details after successful login
- Shows localStorage state immediately after login

### 4. **Storage Interceptor in supabase.ts**
- Logs all localStorage get/set/remove operations
- Shows token lengths and previews
- Tracks when storage changes occur

### 5. **Debug Utility** (`src/utils/debugAuth.ts`)
- Available as `window.__DEBUG__` in browser console
- Provides multiple diagnostic functions
- Works with Supabase client at `window.__supabase__`

## How to Use the Debug Tools

### Opening Browser Console

1. Press **F12** or **Ctrl+Shift+I** (Windows) / **Cmd+Option+I** (Mac)
2. Click the **Console** tab
3. You'll see logs starting with `[Auth]`, `[Debug]`, `[Storage]`, `[Fetch]`

### Console Commands Available

#### 1. **Full Diagnostic Report**
```javascript
window.__DEBUG__.fullDiagnostic(window.__supabase__)
```

**Shows:**
- All localStorage contents
- Current session from Supabase
- Current authenticated user
- Summary showing if everything is consistent

**When to use:** After login or if session seems broken

#### 2. **Check Storage Only**
```javascript
window.__DEBUG__.checkStorage()
```

**Shows:**
- All keys in localStorage
- Token size and preview
- Whether token is valid JSON

**When to use:** To see what's persisted locally

#### 3. **Check Current Session**
```javascript
window.__DEBUG__.checkSession(window.__supabase__)
```

**Shows:**
- Is a session active?
- User email from session
- Token expiry time
- Refresh token existence
- Any errors from getSession()

**When to use:** When you want to know if Supabase thinks you're logged in

#### 4. **Check Current User**
```javascript
window.__DEBUG__.checkUser(window.__supabase__)
```

**Shows:**
- Is a user authenticated?
- User email and ID
- User metadata (role, username)
- App metadata
- Last signin time

**When to use:** When you want to know if the auth user exists

#### 5. **Clear All Auth Data**
```javascript
window.__DEBUG__.clearAuth()
```

**Does:**
- Removes all auth tokens from localStorage
- Clears session storage
- Logs confirmation message

**When to use:** To test a fresh login, or to clear corrupt session data

## Key Log Patterns to Look For

### Successful Login Flow
```
[Auth] ======= LOGIN/SIGNUP ATTEMPT STARTED at 14:30:45
[Login] === EMAIL LOGIN ===
[Storage] setItem(supabase.auth.token): length 1200
[Login] === EMAIL AUTH SUCCESSFUL ===
[Auth] ======= LOGIN HANDLER STARTED =======
```

### Session Restoration on Page Refresh
```
[Auth] ======= SESSION RESTORATION STARTED =======
[Auth] === STEP 1: Check localStorage ===
[Auth] Has supabase.auth.token: true
[Auth] === STEP 2: Found session in localStorage, calling getSession() ===
[Auth] === STEP 4: Session is valid, restoring user ===
[Auth] === SESSION RESTORATION SUCCESSFUL ===
```

### The 429 Error (What We're Debugging)
```
[Fetch] POST https://tjyqmxiqeegcnvopibyb.supabase.co/auth/v1/token?grant_type=refresh_token
[Fetch] ⚠️ 429 TOO MANY REQUESTS on POST /auth/v1/token
[Fetch] Response headers: {
  'retry-after': '60',
  'x-ratelimit-remaining': '0'
}
[Fetch] Call stack: ...  <- THIS SHOWS WHERE 429 IS TRIGGERED FROM
```

## Diagnosis Workflow

### If You're Getting 429 Errors:

1. **Open console (F12) and look for the 429 logs**
   - Find the line with `⚠️ 429 TOO MANY REQUESTS`
   - Note the URL and timestamp

2. **Trace where it came from**
   - Look at the call stack printed after the 429
   - This shows which component/code triggered the token refresh

3. **Run diagnostic**
   ```javascript
   window.__DEBUG__.fullDiagnostic(window.__supabase__)
   ```
   - Check if the results show "all_consistent: true"
   - If not, something is out of sync

4. **Check specific areas**
   ```javascript
   // Is token in storage?
   window.__DEBUG__.checkStorage()
   
   // Does Supabase have the session?
   window.__DEBUG__.checkSession(window.__supabase__)
   
   // Are there two different users?
   window.__DEBUG__.checkUser(window.__supabase__)
   ```

### If Session Isn't Persisting After Refresh:

1. **Log in successfully** - wait for dashboard to load
2. **Check console logs** - should see `SESSION RESTORATION SUCCESSFUL`
3. **Refresh the page (F5)**
4. **Check console again** - should restore without login screen

If it doesn't:
- Look for errors in "Session restoration" logs
- Run `window.__DEBUG__.checkStorage()` - should show token exists
- The token might be corrupted - try `window.__DEBUG__.clearAuth()` and login again

### If You're Unsure What's Happening:

1. **Take a screenshot of console**
2. **Copy the logs** (all lines with `[Auth]`, `[Debug]`, `[Fetch]`, `[Storage]`)
3. **Look for patterns:**
   - `ERROR` - Something failed
   - `429` - Rate limit hit
   - `⚠️` - Warning that might explain the issue

## Console Log Prefixes

| Prefix | Meaning | Example |
|--------|---------|---------|
| `[Auth]` | Authentication flow events | Login, session restore, logout |
| `[Login]` | Login component specific | Email detected, auth attempt |
| `[Debug]` | Debug utility output | Diagnostic results |
| `[Storage]` | LocalStorage operations | Token saved/loaded |
| `[Fetch]` | API requests | All HTTP calls |
| `[Supabase]` | Supabase client init | Configuration logs |

## Important Notes

### ⚠️ Security Considerations
- Do NOT share full logs with auth tokens visible
- Token previews show only first 50 characters
- Use `window.__DEBUG__.clearAuth()` to clear tokens before sharing logs

### 🔍 What These Tools Capture
- ✅ When login happens
- ✅ When tokens are stored/retrieved
- ✅ When session is checked
- ✅ When 429 errors occur
- ✅ Which code called token refresh
- ✅ Exact timestamps of all events
- ✅ localStorage state at each step

### ❌ What These Tools Do NOT Change
- These are read-only diagnostic tools
- They don't fix the issue, only show what's happening
- They don't modify app behavior (except error interception)
- Safe to leave enabled in production for troubleshooting

## Expected Behavior After Login

1. **Immediate (0-500ms):**
   - `[Login] === EMAIL AUTH SUCCESSFUL ===` logs show
   - Token is stored in localStorage
   - Dashboard starts loading

2. **Session Restoration (within 5s):**
   - No page refresh needed
   - Session persists in background
   - All queries use cached session

3. **On Page Refresh:**
   - Session is immediately restored from localStorage
   - No login screen appears
   - Dashboard loads without needing to log in again

4. **No 429 Errors:**
   - Token refresh should be disabled (autoRefreshToken: false)
   - Only manual getSession() calls should happen
   - No automatic API calls after login succeeds

## Next Steps for Diagnosis

1. **Do a fresh login and immediately check logs**
   ```javascript
   window.__DEBUG__.fullDiagnostic(window.__supabase__)
   ```

2. **Look for any 429 errors** by searching console for "429"

3. **Refresh the page and check if session restores**

4. **Share the console logs** if the issue persists

The enhanced logging will give us full visibility into:
- ✅ When exactly the 429 happens
- ✅ What code triggers it
- ✅ What's in localStorage at that moment
- ✅ What Supabase thinks the session is
- ✅ Whether session persists on refresh
