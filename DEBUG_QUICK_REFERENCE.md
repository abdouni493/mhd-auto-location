# Quick Debug Reference - Console Commands

## Copy & Paste These Commands in Browser Console (F12)

### Full Diagnostic Check
```javascript
window.__DEBUG__.fullDiagnostic(window.__supabase__)
```
Shows everything: storage, session, user, and whether they're consistent.

### Check Storage Only
```javascript
window.__DEBUG__.checkStorage()
```
Shows what's in localStorage and if token exists.

### Check Current Session
```javascript
window.__DEBUG__.checkSession(window.__supabase__)
```
Asks Supabase if there's an active session and shows token expiry.

### Check Authenticated User
```javascript
window.__DEBUG__.checkUser(window.__supabase__)
```
Asks Supabase who is currently authenticated.

### Clear All Auth Data
```javascript
window.__DEBUG__.clearAuth()
```
Removes all tokens to test fresh login. **Then refresh page**.

### Search Console Logs
After running diagnostics, search (Ctrl+F in console) for:
- `429` - Rate limit errors
- `ERROR` - Any errors
- `[Auth]` - Auth flow logs
- `[Fetch]` - API call logs

## What Each Command Shows

### fullDiagnostic()
```
[Debug] === LOCALSTORAGE DEBUG ===
  Shows: Token exists? Size? Content type?

[Debug] === SESSION CHECK ===
  Shows: Is Supabase session active? Token valid? Expires when?

[Debug] === USER CHECK ===
  Shows: Is user authenticated? Email? Role? Metadata?

[Debug] === SUMMARY ===
  Shows: Are all three consistent? Both have same user email?
```

### checkStorage()
```
- All keys in localStorage
- Whether supabase.auth.token exists
- Token length (bytes)
- Token type (JSON or string)
- Token preview (first 100 chars safe to share)
```

### checkSession()
```
- Is session active in Supabase?
- User email
- Token length
- Expiry time
- Refresh token exists?
- Any errors?
```

### checkUser()
```
- Is user logged in?
- User email and ID
- User metadata (role, username)
- Last login time
- Any errors?
```

## Troubleshooting Quick Guide

### ❌ Getting 429 Errors
1. Look for `[Fetch] ⚠️ 429 TOO MANY REQUESTS`
2. Note the timestamp
3. Look for call stack below it (shows what triggered it)
4. Copy that code location to debug further

### ❌ Session Not Persisting After Refresh
1. Successful login should show: `[Auth] === LOGIN HANDLER STARTED ===`
2. Page refresh should show: `[Auth] === SESSION RESTORATION STARTED ===`
3. If restoration doesn't happen:
   - Run `window.__DEBUG__.checkStorage()` - is token saved?
   - Token might be corrupted - try `window.__DEBUG__.clearAuth()`
   - Then login again

### ❌ Dashboard Not Loading After Login
1. Check for `[Login] === EMAIL AUTH SUCCESSFUL ===`
2. Check for `[Auth] ======= LOGIN HANDLER STARTED =======`
3. If neither appears, login failed - check for error messages
4. If both appear but dashboard still blank, check browser console for errors

### ✅ How It Should Look (Success)
```
[Login] ======= LOGIN/SIGNUP ATTEMPT STARTED
[Login] === EMAIL LOGIN ===
[Login] === EMAIL AUTH SUCCESSFUL ===
[Auth] ======= LOGIN HANDLER STARTED =======
[Auth] User logged in: { name: "admin", role: "admin" }
[Storage] setItem(supabase.auth.token)
```

Then on page refresh:
```
[Auth] ======= SESSION RESTORATION STARTED =======
[Auth] === STEP 1: Check localStorage ===
[Auth] Has supabase.auth.token: true
[Auth] === STEP 2: Found session, calling getSession() ===
[Auth] === STEP 4: Session is valid, restoring user ===
[Auth] === SESSION RESTORATION SUCCESSFUL ===
```

And NO `[Fetch] 429` errors anywhere.

## Copy Debug Results to Share

When sharing console logs:
1. Right-click in console → "Save as..."
2. OR select all (Ctrl+A) → copy → paste in text editor
3. OR take screenshot of console

Important: Don't include full token values, just previews are fine.

## Where to Find Console Output

| Source | What It Shows |
|--------|---------------|
| `[Auth]` logs | Login flow, session restoration, user changes |
| `[Login]` logs | Email/password auth attempts, success/failure |
| `[Storage]` logs | When tokens are saved/loaded/removed |
| `[Fetch]` logs | All API requests, especially 429 errors |
| `[Debug]` logs | Results from debug utility commands |
| `[Supabase]` logs | Client initialization info |

## Real Example Output

### After Successful Login
```
[Auth] ======= LOGIN HANDLER STARTED =======
[Auth] User logged in: { name: "Admin User", role: "admin", email: "admin@example.com" }
[Auth] Current localStorage state: {
  has_token: true,
  token_preview: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ..."
}
```

### After Clicking fullDiagnostic()
```
========== FULL AUTH DIAGNOSTIC ==========
[Debug] Timestamp: 1/15/2025, 2:30:45 PM

[Debug] === LOCALSTORAGE DEBUG ===
[Debug] Total keys in localStorage: 3
[Debug] [supabase.auth.token]: "eyJhbGciOiJIUzI1NiIsInR5cCI6..."

[Debug] === SESSION CHECK ===
[Debug] getSession result: {
  hasSession: true,
  userEmail: "admin@example.com",
  tokenLength: 1256
}

[Debug] === USER CHECK ===
[Debug] getUser result: {
  hasUser: true,
  userEmail: "admin@example.com"
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

## Tips

- 🔍 Use browser console's built-in search (Ctrl+F) to find specific logs
- 📋 Paste commands exactly as shown (copy-paste entire lines)
- ⏱️ Timestamps help track when things happen - compare with when you saw the issue
- 🔄 After `clearAuth()`, manually refresh page to see fresh login flow
- 📸 Screenshots of console are helpful for sharing issues

## Notes

- All debug tools are read-only
- Nothing changes in the app, only logging added
- Safe to run multiple times
- Console auto-clears with page refresh
- Use "Clear console" button to start fresh
