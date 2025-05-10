
-- Function to get view definition
CREATE OR REPLACE FUNCTION public.get_view_definition(view_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  view_def text;
BEGIN
  SELECT pg_get_viewdef(view_name::regclass, true) INTO view_def;
  RETURN 'CREATE VIEW ' || view_name || ' AS ' || view_def;
END;
$$;

-- Function to execute SQL safely
CREATE OR REPLACE FUNCTION public.execute_sql(sql_statement text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE sql_statement;
END;
$$;
