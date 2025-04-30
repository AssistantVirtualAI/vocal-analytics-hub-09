
-- This migration updates the invitation system to work with Supabase's auth email templates

-- 1. Ensure we have the right columns and indexes on organization_invitations table
DO $$
BEGIN
    -- Check if token column exists and create it if not
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'organization_invitations' AND column_name = 'token'
    ) THEN
        ALTER TABLE organization_invitations ADD COLUMN token UUID DEFAULT gen_random_uuid();
    END IF;

    -- Check if expires_at column exists and create it if not
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'organization_invitations' AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE organization_invitations ADD COLUMN expires_at TIMESTAMPTZ DEFAULT (now() + interval '48 hours');
    END IF;

    -- Ensure indexes exist for performance
    CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON organization_invitations(email);
    CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON organization_invitations(token);
    CREATE INDEX IF NOT EXISTS idx_org_invitations_status ON organization_invitations(status);
END$$;

-- 2. Create or replace function to update invitation tokens when status changes to 'pending'
CREATE OR REPLACE FUNCTION refresh_invitation_token()
RETURNS TRIGGER AS $$
BEGIN
    -- Only refresh token if the status is being set to 'pending'
    IF NEW.status = 'pending' THEN
        NEW.token = gen_random_uuid();
        NEW.expires_at = NOW() + interval '48 hours';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create or replace the trigger on organization_invitations
DROP TRIGGER IF EXISTS refresh_invitation_token_trigger ON organization_invitations;

CREATE TRIGGER refresh_invitation_token_trigger
BEFORE UPDATE ON organization_invitations
FOR EACH ROW
EXECUTE FUNCTION refresh_invitation_token();

-- Add a comment explaining the purpose of this migration
COMMENT ON TABLE organization_invitations IS 
'Stores organization invitations with tokens that will be used with Supabase Auth email templates';
