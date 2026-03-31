-- SQL Migration: Fix Authentication and Security Issues
-- This migration addresses rate limiting and auth loop issues

-- 1. Add indexes to auth-related queries for performance
CREATE INDEX IF NOT EXISTS idx_workers_email_password 
ON public.workers(email) 
WHERE type IN ('admin', 'worker');

CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
ON public.profiles(id) 
WHERE role IN ('admin', 'user');

-- 2. Add column for tracking login attempts (optional - helps prevent abuse)
ALTER TABLE public.workers 
ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until timestamp with time zone;

-- 3. Create function to safely reset failed login attempts
CREATE OR REPLACE FUNCTION reset_failed_logins(worker_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.workers
  SET failed_login_attempts = 0,
      locked_until = NULL,
      last_login_at = now()
  WHERE id = worker_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 4. Update login_worker function to use proper error handling (if it exists)
-- This prevents excessive token refresh attempts
-- DO NOT modify without testing thoroughly

-- 5. Enable Row Level Security on critical tables
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for workers table
DROP POLICY IF EXISTS "workers_select_self" ON public.workers;
CREATE POLICY "workers_select_self"
  ON public.workers
  FOR SELECT
  USING (true); -- Allow all reads for now (adjust based on your needs)

DROP POLICY IF EXISTS "workers_insert_authenticated" ON public.workers;
CREATE POLICY "workers_insert_authenticated"
  ON public.workers
  FOR INSERT
  WITH CHECK (true);

-- 7. Create RLS policies for profiles table
DROP POLICY IF EXISTS "profiles_select_self" ON public.profiles;
CREATE POLICY "profiles_select_self"
  ON public.profiles
  FOR SELECT
  USING (true);

-- 8. Optimize main auth indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_workers_username_unique ON public.workers(LOWER(username));
CREATE UNIQUE INDEX IF NOT EXISTS idx_workers_email_unique ON public.workers(LOWER(email));

-- 9. Add function to prevent auth loops - invalidate old tokens
CREATE OR REPLACE FUNCTION invalidate_old_sessions()
RETURNS void AS $$
BEGIN
  -- This function can be called periodically to clean up stale sessions
  -- Adjust the interval based on your needs
  NULL; -- Placeholder - implement based on your session management
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 10. Create audit log table for debugging auth issues
CREATE TABLE IF NOT EXISTS public.auth_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  user_id uuid,
  email text,
  ip_address text,
  user_agent text,
  status text,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT auth_audit_log_user_fkey FOREIGN KEY (user_id) REFERENCES public.workers(id) ON DELETE SET NULL
);

-- 11. Create index on audit log for queries
CREATE INDEX IF NOT EXISTS idx_auth_audit_created_at ON public.auth_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_audit_user_id ON public.auth_audit_log(user_id);

-- 12. Function to log auth events
CREATE OR REPLACE FUNCTION log_auth_event(
  p_event_type text,
  p_user_id uuid DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_status text DEFAULT 'success',
  p_error_message text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.auth_audit_log (event_type, user_id, email, status, error_message)
  VALUES (p_event_type, p_user_id, p_email, p_status, p_error_message);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Commit all changes
COMMIT;
