
-- 1) Lock immutable columns and only allow accepted_at to transition from NULL -> non-NULL
CREATE OR REPLACE FUNCTION public.trainer_clients_lock_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.trainer_id IS DISTINCT FROM OLD.trainer_id
     OR NEW.client_id IS DISTINCT FROM OLD.client_id
     OR NEW.requested_by IS DISTINCT FROM OLD.requested_by
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Immutable columns on trainer_clients cannot be modified';
  END IF;
  IF OLD.accepted_at IS NOT NULL AND NEW.accepted_at IS DISTINCT FROM OLD.accepted_at THEN
    RAISE EXCEPTION 'accepted_at cannot be modified once set';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trainer_clients_lock_update ON public.trainer_clients;
CREATE TRIGGER trainer_clients_lock_update
BEFORE UPDATE ON public.trainer_clients
FOR EACH ROW EXECUTE FUNCTION public.trainer_clients_lock_update();

-- 2) Tighten client accept policy so it only applies when transitioning pending -> accepted
DROP POLICY IF EXISTS tc_client_accept ON public.trainer_clients;
CREATE POLICY tc_client_accept ON public.trainer_clients
FOR UPDATE TO authenticated
USING (auth.uid() = client_id AND accepted_at IS NULL)
WITH CHECK (auth.uid() = client_id AND accepted_at IS NOT NULL);

-- 3) Switch helper functions from SECURITY DEFINER to SECURITY INVOKER.
--    Underlying tables (user_roles, trainer_clients) already have RLS policies
--    that let the caller see their own rows, which is exactly what these
--    helpers need when invoked from RLS as auth.uid().
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_trainer_of(_trainer uuid, _client uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trainer_clients
    WHERE trainer_id = _trainer
      AND client_id = _client
      AND accepted_at IS NOT NULL
  )
$$;
