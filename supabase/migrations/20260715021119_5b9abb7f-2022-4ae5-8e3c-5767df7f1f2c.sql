
-- 1. Add profile columns for admin management
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS disabled_at timestamptz;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_status_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check CHECK (status IN ('active','disabled'));
  END IF;
END $$;

-- 2. Ensure the auth user -> profile/role trigger exists (idempotent)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill: create profile/role rows for any existing auth users missing them
INSERT INTO public.profiles (id, full_name, email, phone)
SELECT u.id,
       COALESCE(u.raw_user_meta_data->>'full_name', u.email),
       u.email,
       u.raw_user_meta_data->>'phone'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'client'::app_role
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Profiles: trainers can see and update ALL clients (drop assigned-only policies)
DROP POLICY IF EXISTS "Trainers can update assigned client profiles" ON public.profiles;
DROP POLICY IF EXISTS profiles_trainer_select ON public.profiles;
DROP POLICY IF EXISTS "Trainers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Trainers can insert profiles" ON public.profiles;

CREATE POLICY profiles_trainer_select_all ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'trainer'));

CREATE POLICY profiles_trainer_update_all ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'trainer'))
  WITH CHECK (public.has_role(auth.uid(), 'trainer'));

-- 5. user_roles: trainers can read all roles (to filter clients by role)
DROP POLICY IF EXISTS "Trainers can view all roles" ON public.user_roles;
CREATE POLICY user_roles_trainer_select_all ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'trainer'));

-- 6. physical_profiles: trainers can read/update ALL
DROP POLICY IF EXISTS pp_trainer_select ON public.physical_profiles;
CREATE POLICY pp_trainer_select_all ON public.physical_profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'trainer'));
CREATE POLICY pp_trainer_update_all ON public.physical_profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'trainer'))
  WITH CHECK (public.has_role(auth.uid(), 'trainer'));

-- 7. measurements: trainers can read ALL
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='measurements' AND policyname='m_trainer_select') THEN
    DROP POLICY m_trainer_select ON public.measurements;
  END IF;
END $$;
CREATE POLICY m_trainer_select_all ON public.measurements
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'trainer'));

-- 8. recommendations: trainers can read/create/update/delete for any client
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recommendations' AND policyname='r_trainer_select') THEN
    DROP POLICY r_trainer_select ON public.recommendations;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recommendations' AND policyname='r_trainer_insert') THEN
    DROP POLICY r_trainer_insert ON public.recommendations;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recommendations' AND policyname='r_trainer_update') THEN
    DROP POLICY r_trainer_update ON public.recommendations;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recommendations' AND policyname='r_trainer_delete') THEN
    DROP POLICY r_trainer_delete ON public.recommendations;
  END IF;
END $$;

CREATE POLICY r_trainer_select_all ON public.recommendations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'trainer'));
CREATE POLICY r_trainer_insert_all ON public.recommendations
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'trainer') AND admin_id = auth.uid());
CREATE POLICY r_trainer_update_all ON public.recommendations
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'trainer') AND admin_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'trainer') AND admin_id = auth.uid());
CREATE POLICY r_trainer_delete_all ON public.recommendations
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'trainer') AND admin_id = auth.uid());
