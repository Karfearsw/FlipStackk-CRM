CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id BIGINT,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  row_id BIGINT,
  new_row JSONB,
  old_row JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE OR REPLACE FUNCTION audit_log() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs(actor_user_id, action, table_name, row_id, new_row)
    VALUES(NULL, 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs(actor_user_id, action, table_name, row_id, new_row, old_row)
    VALUES(NULL, 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(NEW), to_jsonb(OLD));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs(actor_user_id, action, table_name, row_id, old_row)
    VALUES(NULL, 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'audit_users'
  ) THEN
    CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION audit_log();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'audit_leads'
  ) THEN
    CREATE TRIGGER audit_leads AFTER INSERT OR UPDATE OR DELETE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION audit_log();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'audit_deals'
  ) THEN
    CREATE TRIGGER audit_deals AFTER INSERT OR UPDATE OR DELETE ON public.deals
    FOR EACH ROW EXECUTE FUNCTION audit_log();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'audit_channels'
  ) THEN
    CREATE TRIGGER audit_channels AFTER INSERT OR UPDATE OR DELETE ON public.channels
    FOR EACH ROW EXECUTE FUNCTION audit_log();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'audit_messages'
  ) THEN
    CREATE TRIGGER audit_messages AFTER INSERT OR UPDATE OR DELETE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION audit_log();
  END IF;
END $$;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_all ON public.users;
CREATE POLICY users_select_all ON public.users FOR SELECT USING (true);
DROP POLICY IF EXISTS leads_select_all ON public.leads;
CREATE POLICY leads_select_all ON public.leads FOR SELECT USING (true);
DROP POLICY IF EXISTS deals_select_all ON public.deals;
CREATE POLICY deals_select_all ON public.deals FOR SELECT USING (true);
DROP POLICY IF EXISTS channels_select_all ON public.channels;
CREATE POLICY channels_select_all ON public.channels FOR SELECT USING (true);
DROP POLICY IF EXISTS messages_select_all ON public.messages;
CREATE POLICY messages_select_all ON public.messages FOR SELECT USING (true);