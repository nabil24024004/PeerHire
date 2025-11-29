-- Drop the unique constraint on user_roles to allow multiple roles per user
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- Add active_role column to profiles to track current selected role
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_role text DEFAULT NULL;

-- Create hirer_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.hirer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  default_budget numeric DEFAULT 0,
  preferred_subjects text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on hirer_profiles
ALTER TABLE public.hirer_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for hirer_profiles
CREATE POLICY "Hirers can view their own profile"
  ON public.hirer_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Hirers can insert their own profile"
  ON public.hirer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Hirers can update their own profile"
  ON public.hirer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Update the handle_new_user function to support dual roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
  role_array text[];
BEGIN
  -- Extract role from metadata
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'hirer');
  
  -- Insert profile
  INSERT INTO public.profiles (id, full_name, email, department, active_role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'department', 'Unknown'),
    user_role
  );
  
  -- Handle multiple roles (comma-separated or 'both')
  IF user_role = 'both' THEN
    role_array := ARRAY['hirer', 'freelancer'];
  ELSE
    role_array := string_to_array(user_role, ',');
  END IF;
  
  -- Insert user roles
  FOREACH user_role IN ARRAY role_array
  LOOP
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role::app_role)
    ON CONFLICT DO NOTHING;
    
    -- Create role-specific profiles
    IF user_role = 'freelancer' THEN
      INSERT INTO public.freelancer_profiles (user_id, status, skills, hourly_rate)
      VALUES (NEW.id, 'available', ARRAY[]::text[], 0)
      ON CONFLICT (user_id) DO NOTHING;
    ELSIF user_role = 'hirer' THEN
      INSERT INTO public.hirer_profiles (user_id, default_budget, preferred_subjects)
      VALUES (NEW.id, 0, ARRAY[]::text[])
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Add trigger for updated_at on hirer_profiles
CREATE TRIGGER update_hirer_profiles_updated_at
  BEFORE UPDATE ON public.hirer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();