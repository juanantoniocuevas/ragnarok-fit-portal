
-- Drop auto-calc trigger; we no longer store derived metrics
DROP TRIGGER IF EXISTS measurements_calc_before_insert ON public.measurements;

-- Add new anthropometric columns
ALTER TABLE public.measurements
  ADD COLUMN IF NOT EXISTS height_cm numeric,
  ADD COLUMN IF NOT EXISTS arm_relaxed_cm numeric,
  ADD COLUMN IF NOT EXISTS arm_flexed_cm numeric,
  ADD COLUMN IF NOT EXISTS calf_cm numeric,
  ADD COLUMN IF NOT EXISTS mid_thigh_cm numeric;

-- Relax legacy NOT NULLs so old fields become optional
ALTER TABLE public.measurements ALTER COLUMN waist_cm DROP NOT NULL;
ALTER TABLE public.measurements ALTER COLUMN neck_cm DROP NOT NULL;
ALTER TABLE public.measurements ALTER COLUMN activity_level DROP NOT NULL;

-- Replace lock function so it doesn't reference retired workflow fields but still keeps history immutable
CREATE OR REPLACE FUNCTION public.measurements_lock_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.weight_kg IS DISTINCT FROM OLD.weight_kg
     OR NEW.height_cm IS DISTINCT FROM OLD.height_cm
     OR NEW.arm_relaxed_cm IS DISTINCT FROM OLD.arm_relaxed_cm
     OR NEW.arm_flexed_cm IS DISTINCT FROM OLD.arm_flexed_cm
     OR NEW.calf_cm IS DISTINCT FROM OLD.calf_cm
     OR NEW.mid_thigh_cm IS DISTINCT FROM OLD.mid_thigh_cm
     OR NEW.waist_cm IS DISTINCT FROM OLD.waist_cm
     OR NEW.hip_cm IS DISTINCT FROM OLD.hip_cm THEN
    RAISE EXCEPTION 'Las evaluaciones registradas no pueden editarse';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;
