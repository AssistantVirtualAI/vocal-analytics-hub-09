
-- This migration updates the invitation token refresh mechanism

-- Make sure we have the right trigger setup for refreshing tokens
DROP TRIGGER IF EXISTS refresh_invitation_token_trigger ON organization_invitations;

-- Create or replace function to refresh invitation tokens when status changes to 'pending'
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

-- Create the trigger on organization_invitations
CREATE TRIGGER refresh_invitation_token_trigger
BEFORE INSERT OR UPDATE ON organization_invitations
FOR EACH ROW
EXECUTE FUNCTION refresh_invitation_token();

-- Make sure existing invitations have tokens
UPDATE organization_invitations
SET 
  token = gen_random_uuid(),
  expires_at = NOW() + interval '48 hours'
WHERE token IS NULL AND status = 'pending';
