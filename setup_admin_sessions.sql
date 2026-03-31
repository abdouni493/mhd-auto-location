-- ============================================
-- ADMIN SESSIONS TABLE - DATABASE-BACKED SOLUTION
-- ============================================

-- Create admin sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  is_valid BOOLEAN DEFAULT true,
  UNIQUE(admin_id, is_valid)  -- Only one active session per admin
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS admin_sessions_admin_id_idx ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS admin_sessions_access_token_idx ON admin_sessions(access_token);
CREATE INDEX IF NOT EXISTS admin_sessions_expires_at_idx ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS admin_sessions_is_valid_idx ON admin_sessions(is_valid);

-- Enable RLS
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON admin_sessions
  FOR SELECT USING (admin_id = auth.uid());

CREATE POLICY "Users can create own sessions" ON admin_sessions
  FOR INSERT WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Users can update own sessions" ON admin_sessions
  FOR UPDATE USING (admin_id = auth.uid());

CREATE POLICY "Users can delete own sessions" ON admin_sessions
  FOR DELETE USING (admin_id = auth.uid());

-- ============================================
-- RPC FUNCTIONS FOR SESSION MANAGEMENT
-- ============================================

-- Function to create a new session
CREATE OR REPLACE FUNCTION create_admin_session(
  p_access_token TEXT,
  p_refresh_token TEXT,
  p_expires_at BIGINT,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
) RETURNS TABLE (
  session_id UUID,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Invalidate old sessions for this user
  UPDATE admin_sessions 
  SET is_valid = false, updated_at = NOW()
  WHERE admin_id = auth.uid() AND is_valid = true;

  -- Insert new session
  INSERT INTO admin_sessions (
    admin_id,
    access_token,
    refresh_token,
    expires_at,
    user_agent,
    ip_address,
    is_valid
  ) VALUES (
    auth.uid(),
    p_access_token,
    p_refresh_token,
    p_expires_at,
    p_user_agent,
    p_ip_address,
    true
  )
  RETURNING id INTO v_session_id;

  -- Return the result using SELECT
  RETURN QUERY SELECT 
    v_session_id as session_id,
    true as success,
    'Session created successfully'::TEXT as message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and get current session
CREATE OR REPLACE FUNCTION validate_session(
  p_token TEXT
) RETURNS TABLE (
  session_id UUID,
  admin_id UUID,
  is_valid BOOLEAN,
  is_expired BOOLEAN,
  seconds_until_expiry BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.admin_id,
    s.is_valid,
    (s.expires_at < EXTRACT(EPOCH FROM NOW())::BIGINT) as is_expired,
    (s.expires_at - EXTRACT(EPOCH FROM NOW())::BIGINT) as seconds_until_expiry
  FROM admin_sessions s
  WHERE s.access_token = p_token
  AND s.is_valid = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to invalidate session
CREATE OR REPLACE FUNCTION invalidate_session(
  p_token TEXT
) RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_rows_updated INT;
BEGIN
  UPDATE admin_sessions
  SET is_valid = false, updated_at = NOW()
  WHERE access_token = p_token;
  
  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  
  RETURN QUERY SELECT 
    (v_rows_updated > 0) as success,
    CASE 
      WHEN v_rows_updated > 0 THEN 'Session invalidated successfully'
      ELSE 'Session not found'
    END as message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current admin's active session
CREATE OR REPLACE FUNCTION get_current_session()
RETURNS TABLE (
  session_id UUID,
  access_token TEXT,
  refresh_token TEXT,
  expires_at BIGINT,
  is_expired BOOLEAN,
  seconds_until_expiry BIGINT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.access_token,
    s.refresh_token,
    s.expires_at,
    (s.expires_at < EXTRACT(EPOCH FROM NOW())::BIGINT) as is_expired,
    (s.expires_at - EXTRACT(EPOCH FROM NOW())::BIGINT) as seconds_until_expiry,
    s.created_at
  FROM admin_sessions s
  WHERE s.admin_id = auth.uid()
  AND s.is_valid = true
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired sessions (call periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS TABLE (
  cleaned_count INT,
  message TEXT
) AS $$
DECLARE
  v_cleaned INT;
BEGIN
  DELETE FROM admin_sessions
  WHERE expires_at < EXTRACT(EPOCH FROM NOW())::BIGINT
  OR (is_valid = false AND created_at < NOW() - INTERVAL '7 days');
  
  GET DIAGNOSTICS v_cleaned = ROW_COUNT;
  
  RETURN QUERY SELECT 
    v_cleaned as cleaned_count,
    'Cleaned ' || v_cleaned::TEXT || ' expired sessions' as message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANTS
-- ============================================

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION create_admin_session(TEXT, TEXT, BIGINT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_session(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION invalidate_session(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_session() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions() TO authenticated;

-- Grant table access
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_sessions TO authenticated;

-- ============================================
-- TEST QUERIES (Optional - remove in production)
-- ============================================

-- Test: View all sessions table
-- SELECT * FROM admin_sessions;

-- Test: Cleanup expired sessions
-- SELECT * FROM cleanup_expired_sessions();
