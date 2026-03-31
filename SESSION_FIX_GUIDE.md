# Session Management Fix - Setup Instructions

## What Changed

### 1. Supabase Configuration (supabase.ts)
- **persistSession: false** - Disables SDK session management
- **autoRefreshToken: false** - Prevents auto-refresh on queries
- **detectSessionInUrl: false** - Don't auto-detect sessions

**Result**: SDK no longer attempts auto-refresh, eliminating 429 errors.

### 2. Session Service (sessionService.ts)
- localStorage is PRIMARY storage (always works)
- Database saves are OPTIONAL/NON-BLOCKING
- Rate-limited token refresh (max 1x per minute)
- 5-minute validation interval

### 3. SQL Functions (setup_admin_sessions.sql)
- Fixed RPC function syntax (using proper SELECT/RETURNING pattern)
- Database-backed audit trail (optional, won't break if it fails)

## How It Works

```
LOGIN FLOW:
  1. User submits credentials
  2. SDK authenticates with Supabase
  3. sessionService.createSession() is called
  4. Session saved to localStorage IMMEDIATELY (synchronous)
  5. Session optionally saved to database (async, non-blocking)
  6. Dashboard loads
  
PAGE REFRESH:
  1. App loads
  2. sessionService.initializeSession() restores from localStorage
  3. User stays logged in
  4. NO auto-refresh calls trigger
  5. NO 429 errors

LOGOUT:
  1. sessionService.invalidateSession() clears localStorage
  2. SDK signOut() is called
  3. Session loop stops
```

## Implementation Steps

### Step 1: Run SQL in Supabase
Execute `setup_admin_sessions.sql` in your Supabase dashboard:
- Go to SQL Editor
- Create new query
- Paste entire SQL file
- Run

### Step 2: Verify
In Supabase SQL Editor, run:
```sql
-- Check table created
SELECT * FROM admin_sessions;

-- Check functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE 'create_%';
```

### Step 3: Test in Browser
1. **Clear localStorage**: Press F12 → Application → Local Storage → Clear All
2. **Login**: Use admin@admin.com
3. **Check Console**:
   - Should see `[SessionService] Session saved to localStorage`
   - Should NOT see multiple refresh requests
   - Should NOT see 429 errors
4. **Refresh Page**: Press F5
5. **Verify**: Should stay logged in, no login page

## Troubleshooting

### Still seeing 429 errors?
- Check console for `[Fetch] POST auth/v1/token?grant_type=refresh_token`
- These should NOT appear after initial login
- If they do, check that `persistSession: false` in supabase.ts

### Losing session on refresh?
- Check localStorage: Press F12 → Application → Local Storage → `admin_session_v2`
- Should contain token and user info
- If empty, session wasn't created properly

### RPC errors when saving to database?
- This is OK - session saves locally first
- Database save is optional, non-blocking
- App will work even if database is unreachable
- Check Supabase SQL Editor for table/function existence

## Key Differences from Before

| Before | Now |
|--------|-----|
| autoRefreshToken: true | autoRefreshToken: false |
| persistSession: true | persistSession: false |
| SDK manages sessions | We manage sessions |
| 429 errors on every query | No 429 errors |
| Lost sessions on refresh | Sessions persist |
| Token in SDK memory | Token in localStorage |

## Files Modified

1. `src/supabase.ts` - Updated auth config
2. `src/utils/sessionService.ts` - Simplified to use localStorage first
3. `src/App.tsx` - Uses sessionService for restoration
4. `src/components/Login.tsx` - Uses sessionService to save sessions
5. `setup_admin_sessions.sql` - Fixed RPC function syntax

## Emergency Rollback

If something breaks completely, revert to:
```typescript
// src/supabase.ts
auth: {
  persistSession: true,
  autoRefreshToken: false,
  detectSessionInUrl: true,
  flowType: 'pkce'
}
```

This uses the SDK's default behavior (still disables auto-refresh to prevent 429s).
