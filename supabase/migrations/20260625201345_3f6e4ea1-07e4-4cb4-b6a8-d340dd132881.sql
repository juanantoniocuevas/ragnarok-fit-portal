
DROP POLICY IF EXISTS "Trainers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Trainers can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Trainers can insert profiles" ON public.profiles;

CREATE POLICY "Trainers can update assigned client profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_trainer_of(auth.uid(), id))
WITH CHECK (public.is_trainer_of(auth.uid(), id));
