
ALTER FUNCTION public.touch_updated_at() SET search_path = public;
ALTER FUNCTION public.measurements_lock_update() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.is_trainer_of(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.calculate_measurement_metrics() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
