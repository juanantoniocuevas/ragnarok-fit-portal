
-- 1) Lock down SECURITY DEFINER functions: revoke broad EXECUTE, grant only where needed.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.calculate_measurement_metrics() FROM PUBLIC, anon, authenticated;
-- has_role and is_trainer_of are referenced by RLS policies; callers must retain EXECUTE.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
REVOKE ALL ON FUNCTION public.is_trainer_of(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_trainer_of(uuid, uuid) TO authenticated;

-- 2) trainer_clients: require explicit client consent before the relationship grants access.
ALTER TABLE public.trainer_clients
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS requested_by uuid NULL;

-- Trainer creates a pending invitation (accepted_at must be NULL, requested_by = trainer).
DROP POLICY IF EXISTS tc_trainer_insert ON public.trainer_clients;
CREATE POLICY tc_trainer_insert ON public.trainer_clients
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = trainer_id
    AND public.has_role(auth.uid(), 'trainer'::app_role)
    AND accepted_at IS NULL
    AND requested_by = auth.uid()
  );

-- Client can accept their own pending invitation (set accepted_at; cannot change trainer_id/client_id).
CREATE POLICY tc_client_accept ON public.trainer_clients
  FOR UPDATE TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id AND accepted_at IS NOT NULL);

-- Client can decline / revoke (delete) their own row.
CREATE POLICY tc_client_delete ON public.trainer_clients
  FOR DELETE TO authenticated
  USING (auth.uid() = client_id);

-- is_trainer_of must only return true for ACCEPTED relationships.
CREATE OR REPLACE FUNCTION public.is_trainer_of(_trainer uuid, _client uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trainer_clients
    WHERE trainer_id = _trainer
      AND client_id = _client
      AND accepted_at IS NOT NULL
  )
$$;
REVOKE ALL ON FUNCTION public.is_trainer_of(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_trainer_of(uuid, uuid) TO authenticated;

-- 3) user_roles: add explicit deny policies for INSERT/UPDATE/DELETE so role assignment
-- is impossible via the Data API. Role provisioning happens only through the
-- SECURITY DEFINER trigger handle_new_user(), which bypasses RLS.
CREATE POLICY user_roles_no_insert ON public.user_roles
  FOR INSERT TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY user_roles_no_update ON public.user_roles
  FOR UPDATE TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY user_roles_no_delete ON public.user_roles
  FOR DELETE TO authenticated, anon
  USING (false);
