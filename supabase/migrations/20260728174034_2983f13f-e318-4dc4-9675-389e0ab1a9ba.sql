ALTER TABLE public.projects
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN is_public boolean NOT NULL DEFAULT false;

ALTER TABLE public.projects ALTER COLUMN user_id SET DEFAULT auth.uid();

UPDATE public.projects SET is_public = true WHERE name = 'wgenai3';

DROP POLICY IF EXISTS "Anyone can view projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can create projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can update projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can delete projects" ON public.projects;

CREATE POLICY "Owners and public projects are viewable" ON public.projects FOR SELECT TO anon, authenticated USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users can create their own projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = user_id);
