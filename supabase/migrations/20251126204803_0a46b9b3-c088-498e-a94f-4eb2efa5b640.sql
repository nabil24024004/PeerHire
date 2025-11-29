-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function that handles profiles, roles, and freelancer profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Extract role from metadata, default to 'hirer' if not specified
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'hirer')::app_role;
  
  -- Insert profile
  INSERT INTO public.profiles (id, full_name, email, department)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'department', 'Unknown')
  );
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  -- If freelancer, create freelancer profile
  IF user_role = 'freelancer' THEN
    INSERT INTO public.freelancer_profiles (user_id, status, skills, hourly_rate)
    VALUES (NEW.id, 'available', ARRAY[]::text[], 0);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();