-- Add missing SELECT policy to allow all users to view hirer profiles
-- This is consistent with how freelancer_profiles work
CREATE POLICY "Hirer profiles are viewable by everyone"
  ON public.hirer_profiles FOR SELECT
  USING (true);
