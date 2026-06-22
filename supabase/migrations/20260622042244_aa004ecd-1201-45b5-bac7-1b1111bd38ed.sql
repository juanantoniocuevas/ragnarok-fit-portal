
-- ============= 1. CLEAN OLD =============
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.evaluations CASCADE;
DROP TABLE IF EXISTS public.recommendations CASCADE;

-- ============= 2. PHYSICAL PROFILES =============
CREATE TABLE public.physical_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  age INT CHECK (age > 0 AND age < 130),
  sex TEXT CHECK (sex IN ('male','female')),
  height_cm NUMERIC(5,2) CHECK (height_cm > 0 AND height_cm < 300),
  goal TEXT CHECK (goal IN ('lose_fat','gain_muscle','maintain','performance','other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.physical_profiles TO authenticated;
GRANT ALL ON public.physical_profiles TO service_role;
ALTER TABLE public.physical_profiles ENABLE ROW LEVEL SECURITY;

-- ============= 3. TRAINER CLIENTS =============
CREATE TABLE public.trainer_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trainer_id, client_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainer_clients TO authenticated;
GRANT ALL ON public.trainer_clients TO service_role;
ALTER TABLE public.trainer_clients ENABLE ROW LEVEL SECURITY;

-- Helper: is the given trainer assigned to the given client?
CREATE OR REPLACE FUNCTION public.is_trainer_of(_trainer UUID, _client UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.trainer_clients WHERE trainer_id = _trainer AND client_id = _client)
$$;

-- ============= 4. MEASUREMENTS =============
CREATE TABLE public.measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- raw inputs (editable by user only at creation; never modified afterwards)
  weight_kg NUMERIC(6,2) NOT NULL CHECK (weight_kg > 0),
  waist_cm NUMERIC(5,2) NOT NULL CHECK (waist_cm > 0),
  neck_cm NUMERIC(5,2) NOT NULL CHECK (neck_cm > 0),
  hip_cm NUMERIC(5,2),
  activity_level TEXT NOT NULL CHECK (activity_level IN ('sedentary','light','moderate','high','very_high')),
  -- auto-calculated (locked, computed by trigger)
  imc NUMERIC(6,2),
  healthy_weight_kg NUMERIC(6,2),
  bmr NUMERIC(7,2),
  daily_calories NUMERIC(7,2),
  body_fat_pct NUMERIC(5,2),
  fat_mass_kg NUMERIC(6,2),
  lean_mass_kg NUMERIC(6,2),
  water_pct NUMERIC(5,2),
  muscle_mass_kg NUMERIC(6,2),
  visceral_fat NUMERIC(5,2),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX measurements_user_created_idx ON public.measurements (user_id, created_at DESC) WHERE deleted_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.measurements TO authenticated;
GRANT ALL ON public.measurements TO service_role;
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

-- ============= 5. RECOMMENDATIONS =============
CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 5000),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX recommendations_client_idx ON public.recommendations (client_id, created_at DESC) WHERE deleted_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendations TO authenticated;
GRANT ALL ON public.recommendations TO service_role;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- ============= 6. AUTO-CALC TRIGGER =============
CREATE OR REPLACE FUNCTION public.calculate_measurement_metrics()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p RECORD;
  h_m NUMERIC; h_cm NUMERIC; act NUMERIC; bf NUMERIC; lean NUMERIC; fat NUMERIC;
BEGIN
  SELECT age, sex, height_cm INTO p FROM public.physical_profiles WHERE user_id = NEW.user_id;
  IF p IS NULL OR p.height_cm IS NULL OR p.age IS NULL OR p.sex IS NULL THEN
    -- profile incomplete, leave metrics null; only IMC needs height
    RETURN NEW;
  END IF;

  h_cm := p.height_cm;
  h_m  := h_cm / 100.0;

  -- IMC
  NEW.imc := ROUND(NEW.weight_kg / (h_m * h_m), 2);
  -- Healthy weight (BMI 22)
  NEW.healthy_weight_kg := ROUND(22 * h_m * h_m, 2);

  -- BMR (Mifflin-St Jeor)
  IF p.sex = 'male' THEN
    NEW.bmr := ROUND(10 * NEW.weight_kg + 6.25 * h_cm - 5 * p.age + 5, 2);
  ELSE
    NEW.bmr := ROUND(10 * NEW.weight_kg + 6.25 * h_cm - 5 * p.age - 161, 2);
  END IF;

  act := CASE NEW.activity_level
    WHEN 'sedentary' THEN 1.2
    WHEN 'light' THEN 1.375
    WHEN 'moderate' THEN 1.55
    WHEN 'high' THEN 1.725
    WHEN 'very_high' THEN 1.9
  END;
  NEW.daily_calories := ROUND(NEW.bmr * act, 2);

  -- Body fat % (US Navy)
  BEGIN
    IF p.sex = 'male' THEN
      bf := 86.010 * log(10, NEW.waist_cm - NEW.neck_cm) - 70.041 * log(10, h_cm) + 36.76;
    ELSE
      IF NEW.hip_cm IS NULL THEN
        bf := NULL;
      ELSE
        bf := 163.205 * log(10, NEW.waist_cm + NEW.hip_cm - NEW.neck_cm) - 97.684 * log(10, h_cm) - 78.387;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN bf := NULL;
  END;

  IF bf IS NOT NULL AND bf > 2 AND bf < 70 THEN
    NEW.body_fat_pct := ROUND(bf, 2);
    fat := NEW.weight_kg * bf / 100.0;
    lean := NEW.weight_kg - fat;
    NEW.fat_mass_kg := ROUND(fat, 2);
    NEW.lean_mass_kg := ROUND(lean, 2);
    -- Water % approx: lean * 0.732 / weight * 100
    NEW.water_pct := ROUND((lean * 0.732 / NEW.weight_kg) * 100, 2);
    -- Muscle mass approx: ~ 50% of lean mass (skeletal muscle)
    NEW.muscle_mass_kg := ROUND(lean * 0.5, 2);
  END IF;

  -- Visceral fat estimate (rough): scales with waist/height ratio and age
  NEW.visceral_fat := ROUND(
    GREATEST(1, LEAST(30,
      ( (NEW.waist_cm / h_cm) * 20 ) + (p.age * 0.05) - 8
    )), 1);

  RETURN NEW;
END;
$$;

CREATE TRIGGER measurements_calc_before_insert
  BEFORE INSERT ON public.measurements
  FOR EACH ROW EXECUTE FUNCTION public.calculate_measurement_metrics();

-- Block UPDATE of raw inputs and calculated fields on measurements (only deleted_at and updated_at can change)
CREATE OR REPLACE FUNCTION public.measurements_lock_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.weight_kg IS DISTINCT FROM OLD.weight_kg
     OR NEW.waist_cm IS DISTINCT FROM OLD.waist_cm
     OR NEW.neck_cm IS DISTINCT FROM OLD.neck_cm
     OR NEW.hip_cm IS DISTINCT FROM OLD.hip_cm
     OR NEW.activity_level IS DISTINCT FROM OLD.activity_level
     OR NEW.imc IS DISTINCT FROM OLD.imc
     OR NEW.bmr IS DISTINCT FROM OLD.bmr
     OR NEW.body_fat_pct IS DISTINCT FROM OLD.body_fat_pct
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Las mediciones registradas no pueden editarse';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER measurements_lock_update_trigger
  BEFORE UPDATE ON public.measurements
  FOR EACH ROW EXECUTE FUNCTION public.measurements_lock_update();

-- updated_at maintainers
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;
CREATE TRIGGER physical_profiles_touch BEFORE UPDATE ON public.physical_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER recommendations_touch BEFORE UPDATE ON public.recommendations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============= 7. RLS POLICIES =============

-- physical_profiles
CREATE POLICY pp_owner_select ON public.physical_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY pp_trainer_select ON public.physical_profiles FOR SELECT TO authenticated USING (public.is_trainer_of(auth.uid(), user_id));
CREATE POLICY pp_owner_insert ON public.physical_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY pp_owner_update ON public.physical_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- trainer_clients
CREATE POLICY tc_trainer_select ON public.trainer_clients FOR SELECT TO authenticated USING (auth.uid() = trainer_id);
CREATE POLICY tc_client_select ON public.trainer_clients FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY tc_trainer_insert ON public.trainer_clients FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = trainer_id AND public.has_role(auth.uid(), 'trainer'));
CREATE POLICY tc_trainer_delete ON public.trainer_clients FOR DELETE TO authenticated USING (auth.uid() = trainer_id);

-- measurements
CREATE POLICY m_owner_select ON public.measurements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY m_trainer_select ON public.measurements FOR SELECT TO authenticated USING (public.is_trainer_of(auth.uid(), user_id));
CREATE POLICY m_owner_insert ON public.measurements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY m_owner_softdelete ON public.measurements FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- profiles: allow trainers to read assigned clients' base profile
CREATE POLICY profiles_trainer_select ON public.profiles FOR SELECT TO authenticated USING (public.is_trainer_of(auth.uid(), id));

-- recommendations
CREATE POLICY rec_client_select ON public.recommendations FOR SELECT TO authenticated
  USING (auth.uid() = client_id AND deleted_at IS NULL);
CREATE POLICY rec_admin_select ON public.recommendations FOR SELECT TO authenticated
  USING (auth.uid() = admin_id);
CREATE POLICY rec_admin_insert ON public.recommendations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = admin_id AND public.is_trainer_of(auth.uid(), client_id));
CREATE POLICY rec_admin_update ON public.recommendations FOR UPDATE TO authenticated
  USING (auth.uid() = admin_id) WITH CHECK (auth.uid() = admin_id);
CREATE POLICY rec_admin_delete ON public.recommendations FOR DELETE TO authenticated
  USING (auth.uid() = admin_id);
