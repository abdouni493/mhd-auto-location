-- Fix Worker Login Function
-- This script ensures worker login works for both authenticated and anonymous users

-- 1. Drop existing function if it exists
DROP FUNCTION IF EXISTS public.login_worker(TEXT, TEXT);

-- 2. Recreate function with proper security settings
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

-- 3. Grant execute permission to anon role (for unauthenticated users)
GRANT EXECUTE ON FUNCTION public.login_worker(TEXT, TEXT) TO anon;

-- 4. Grant execute permission to authenticated role
GRANT EXECUTE ON FUNCTION public.login_worker(TEXT, TEXT) TO authenticated;

-- 5. Verify workers table structure (optional but helpful for debugging)
-- This creates an index for faster lookups during login
CREATE INDEX IF NOT EXISTS idx_workers_username_password 
ON public.workers(username) 
WHERE type IN ('admin', 'worker', 'driver');

CREATE INDEX IF NOT EXISTS idx_workers_email_password 
ON public.workers(email) 
WHERE type IN ('admin', 'worker', 'driver');

-- Done! Worker login should now work for both authenticated and unauthenticated users
