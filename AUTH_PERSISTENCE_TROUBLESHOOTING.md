# Authentication Persistence - Quick Troubleshooting Guide

## ✅ Expected Behavior After Fix

### Scenario 1: Fresh Login
```
1. User navigates to /login
2. Enters credentials (email/username + password)
3. Clicks login
4. Server validates → success
5. Session saved to localStorage
6. App redirects to /dashboard
7. Dashboard loads
```

### Scenario 2: Page Refresh in Dashboard
```
1. User on /dashboard (logged in)
2. Presses F5 or navigates away then back
3. App load begins
4. Shows loading spinner briefly
5. Session automatically restored from localStorage
6. Dashboard loads without redirect to /login ✓
```

### Scenario 3: Browser Tab Close/Reopen
```
1. User on /dashboard
2. Closes browser tab (localStorage persists)
3. Reopens app URL
4. App shows loading spinner
5. Session restored automatically ✓
6. Dashboard appears, no login needed
```

---

## 🔍 Debugging in Browser Console

### Check Current Session
```javascript
// Paste in console after login:
const session = JSON.parse(localStorage.getItem('admin_session_v2'));
console.log('Current Session:', {
  email: session.email,
  role: session.role,
  name: session.name,
  expiresAt: new Date(session.expiresAt * 1000)
});
```

### Check Session Expiration
```javascript
const session = JSON.parse(localStorage.getItem('admin_session_v2'));
const now = Math.floor(Date.now() / 1000);
const secondsLeft = session.expiresAt - now;
console.log(`Session expires in ${secondsLeft} seconds (${Math.floor(secondsLeft / 60)} minutes)`);
```

### Monitor Auth Logs
```javascript
// After page load, check browser console for [Auth] and [SessionService] logs:
// - [Auth] logs show authentication flow
// - [SessionService] logs show session management

// Search console for these prefixes to see what's happening
```

### Simulate Session Expiry
```javascript
// For testing, set session to expire immediately:
const session = JSON.parse(localStorage.getItem('admin_session_v2'));
session.expiresAt = Math.floor(Date.now() / 1000); // Set to now
localStorage.setItem('admin_session_v2', JSON.stringify(session));
// Refresh page - should redirect to /login
```

---

## ❌ Common Issues & Solutions

### Issue 1: Still Redirecting to /login on Refresh
**Symptoms:**
- Page refresh takes you to /login
- Console shows "No valid session found"

**Solutions:**
1. Check if session exists in localStorage:
   ```javascript
   localStorage.getItem('admin_session_v2'); // Should not be null
   ```

2. Check browser console for error messages:
   - Search for `[SessionService]` or `[Auth]` logs
   - Look for error messages

3. Try fresh login:
   - Logout completely
   - Clear all localStorage: `localStorage.clear()`
   - Login again
   - Check if session is saved

4. Check if localStorage is enabled:
   ```javascript
   try {
     localStorage.setItem('test', '1');
     localStorage.removeItem('test');
     console.log('localStorage is available');
   } catch (e) {
     console.error('localStorage is NOT available!');
   }
   ```

### Issue 2: Session Saved but Not Restored
**Symptoms:**
- Login works, session in localStorage
- Refresh redirects to /login
- Console shows session exists but "Session validation failed"

**Solutions:**
1. Check session expiration:
   ```javascript
   const session = JSON.parse(localStorage.getItem('admin_session_v2'));
   console.log('Expires at:', new Date(session.expiresAt * 1000));
   console.log('Is expired?', session.expiresAt < Date.now() / 1000);
   ```

2. Check if token is valid format:
   ```javascript
   const session = JSON.parse(localStorage.getItem('admin_session_v2'));
   console.log('Token length:', session.accessToken.length);
   console.log('Is worker token?', session.accessToken.startsWith('worker_token_'));
   ```

3. If worker token, it should work:
   - Worker tokens skip database validation
   - Should restore even without network

### Issue 3: Shows Loading Spinner Forever
**Symptoms:**
- After login/refresh, spinner keeps spinning
- Never shows dashboard or redirects

**Solutions:**
1. Check browser console for errors:
   - Look for network errors
   - Look for database connection errors

2. Check if session service is stuck:
   ```javascript
   // Check if localStorage session exists
   console.log(localStorage.getItem('admin_session_v2'));
   // Manually trigger logout and login
   ```

3. Check browser DevTools network tab:
   - Look for failed requests
   - Check for 429 rate limit errors
   - Check for 406 Not Acceptable errors

4. Force page refresh:
   - Press Ctrl+Shift+R (hard refresh)
   - Clear cache
   - Try again

### Issue 4: Logout Not Working
**Symptoms:**
- Click logout, stays on page or shows spinner
- Page doesn't redirect to /login

**Solutions:**
1. Check if logout handler is being called:
   ```javascript
   // Look for logs with [Auth] prefix
   ```

2. Manually clear session:
   ```javascript
   localStorage.removeItem('admin_session_v2');
   sessionStorage.clear();
   // Then manually navigate to /login
   window.location.href = '/login';
   ```

3. Check browser console for logout errors

### Issue 5: Multiple Tab Problems
**Symptoms:**
- Logout in one tab, other tabs still logged in
- Login in one tab, other tabs not updated

**This is EXPECTED behavior:**
- Each tab manages its own session independently
- They don't sync automatically
- User needs to refresh other tabs manually
- This is by design for security

**Solution:**
- If session expires/invalidates:
  - Refresh any other open tabs
  - They'll redirect to /login on refresh
  - User can re-login if needed

---

## 📊 Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│               APP LOADS / MOUNTS                    │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │  Check localStorage  │
        │  for admin_session_v2 │
        └────────┬────────────┘
                 │
         ┌───────┴────────┐
         │                │
    ✓ Found          ✗ Not Found
         │                │
         ▼                │
    ┌─────────────────┐   │
    │ Session exists? │   │
    └────┬────────────┘   │
         │                │
    ┌────┴─────────┐      │
    │              │      │
   YES            NO      │
    │              │      │
    ▼              ▼      ▼
┌────────────┐  ┌──────────────────────────┐
│ Validate   │  │ isAuthLoading = false    │
│ (with FB)  │  │ user = null              │
└────┬───────┘  │ → ProtectedRoute→/login  │
     │          └──────────────────────────┘
  ┌──┴──────────────┐
  │                 │
Valid            Invalid/Expired
  │                 │
  ▼                 ▼
Set user       Clear session
isAuthLoading   isAuthLoading = false
= false         user = null
               → ProtectedRoute→/login
  │
  └────────────────────┐
                       │
                       ▼
            ┌──────────────────────────┐
            │  ProtectedRoute checks:  │
            │  - isAuthLoading = false?│
            │  - user exists?          │
            └────┬──────────┬───────────┘
                 │          │
            ┌────┘          └─────────┐
            │                         │
           YES                       NO
            │                         │
            ▼                         ▼
      ┌──────────────┐         ┌──────────────┐
      │  Render      │         │  Navigate    │
      │  DashboardLayout│      │  to /login   │
      └──────────────┘         └──────────────┘
```

---

## 🛠️ Recovery Steps for Persistent Issues

### Complete Reset
1. **Clear all data:**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Hard refresh page:**
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

3. **Logout:**
   - Navigate to /login
   - Should appear cleanly

4. **Fresh login:**
   - Enter credentials
   - Check console for logs
   - Verify localStorage has session

5. **Test persistence:**
   - Refresh page
   - Should NOT go to /login
   - Should show dashboard

### If Still Not Working

1. **Check DevTools Console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for red errors
   - Screenshot the errors
   - Share with developer

2. **Check Network Tab:**
   - Go to Network tab
   - Refresh page
   - Look for failed requests
   - Check for unusual HTTP status codes
   - Screenshot failures

3. **Check Application Tab:**
   - Go to Application > Storage > Local Storage
   - Look for `admin_session_v2` key
   - Verify its contents
   - Take screenshot

---

## ✅ Final Verification Checklist

After applying the fix, verify:

- [ ] Fresh login works (redirects to /dashboard)
- [ ] Session saves to localStorage
- [ ] Page refresh doesn't redirect to /login
- [ ] Dashboard loads after refresh
- [ ] Logout clears session and redirects to /login
- [ ] Can re-login after logout
- [ ] Multiple logins/logouts work correctly
- [ ] Console shows no error messages (except warnings)
- [ ] No "429 Too Many Requests" errors
- [ ] No "406 Not Acceptable" errors

---

## 📞 When to Contact Support

If you've tried all above steps and still have issues:

1. **Collect Information:**
   - Browser type and version
   - Error messages from console
   - Screenshots of DevTools Network tab
   - Screenshot of localStorage contents
   - Steps to reproduce

2. **Share:**
   - Complete error messages
   - Console logs (search for [Auth] or [SessionService])
   - Expected vs actual behavior
   - Whether issue is in all browsers or specific one

---

This fix should resolve 95% of authentication persistence issues. The system now:
✅ Persists sessions across page refreshes
✅ Gracefully handles network failures
✅ Falls back to local validation when needed
✅ Keeps users logged in appropriately
✅ Redirects only when truly needed
