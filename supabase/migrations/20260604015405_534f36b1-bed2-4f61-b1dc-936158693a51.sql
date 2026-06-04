
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('trainer', 'client');

-- profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- user_roles table (separate to avoid privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- evaluations
CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight NUMERIC(5,2),
  body_fat NUMERIC(5,2),
  muscle_mass NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- attendance
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- recommendations
CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluations TO authenticated;
GRANT ALL ON public.evaluations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendations TO authenticated;
GRANT ALL ON public.recommendations TO service_role;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Security definer role checker
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Trainers can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'trainer'));
CREATE POLICY "Trainers can insert profiles" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'trainer'));
CREATE POLICY "Trainers can update profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'trainer'));
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- user_roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Trainers can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'trainer'));

-- evaluations policies
CREATE POLICY "Clients view own evaluations" ON public.evaluations
  FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "Trainers view all evaluations" ON public.evaluations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'trainer'));
CREATE POLICY "Trainers insert evaluations" ON public.evaluations
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'trainer'));
CREATE POLICY "Trainers update evaluations" ON public.evaluations
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'trainer'));
CREATE POLICY "Trainers delete evaluations" ON public.evaluations
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'trainer'));

-- attendance policies
CREATE POLICY "Clients view own attendance" ON public.attendance
  FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "Trainers view all attendance" ON public.attendance
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'trainer'));
CREATE POLICY "Trainers insert attendance" ON public.attendance
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'trainer'));
CREATE POLICY "Trainers delete attendance" ON public.attendance
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'trainer'));

-- recommendations policies
CREATE POLICY "Clients view own recommendations" ON public.recommendations
  FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "Trainers view all recommendations" ON public.recommendations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'trainer'));
CREATE POLICY "Trainers insert recommendations" ON public.recommendations
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'trainer'));
CREATE POLICY "Trainers delete recommendations" ON public.recommendations
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'trainer'));

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
