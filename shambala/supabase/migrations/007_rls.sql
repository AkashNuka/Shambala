-- 007_rls.sql
-- The anon key ships in the browser bundle, so RLS is the ONLY thing
-- preventing public read/write of all financial data.

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    -- RLS on with no policy = deny everything. Safe default.
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS authenticated_full_access ON public.%I;', t);
    EXECUTE format($f$
      CREATE POLICY authenticated_full_access ON public.%I
        FOR ALL TO authenticated USING (true) WITH CHECK (true);
    $f$, t);
  END LOOP;
END $$;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
