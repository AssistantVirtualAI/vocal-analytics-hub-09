
-- Add slug column to organizations table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN slug TEXT UNIQUE;
    
    -- Initialize slugs for existing organizations
    UPDATE public.organizations 
    SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '-', 'g'))
    WHERE slug IS NULL;
  END IF;
END $$;
