
-- Add token and expiration fields to organization_invitations table
ALTER TABLE public.organization_invitations
ADD COLUMN token UUID,
ADD COLUMN expires_at TIMESTAMPTZ;

-- Update existing rows with random tokens and 24 hour expiration
UPDATE public.organization_invitations
SET 
  token = gen_random_uuid(),
  expires_at = NOW() + INTERVAL '24 hours'
WHERE status = 'pending';

-- Add function to automatically update expires_at when status changes to pending
CREATE OR REPLACE FUNCTION public.update_invitation_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' AND (OLD.status IS NULL OR OLD.status <> 'pending') THEN
    NEW.token = gen_random_uuid();
    NEW.expires_at = NOW() + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to handle automatic token/expiration updates
CREATE TRIGGER set_invitation_expiration
BEFORE INSERT OR UPDATE OF status ON public.organization_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_invitation_expiration();
