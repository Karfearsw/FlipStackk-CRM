ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='users' AND policyname='users_insert_all') THEN
    CREATE POLICY users_insert_all ON public.users FOR INSERT WITH CHECK (true);
  END IF;
END $$;
