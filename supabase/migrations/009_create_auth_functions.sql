-- Function to verify @aaub.edu.bd email domain
CREATE OR REPLACE FUNCTION public.verify_aaub_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email NOT LIKE '%@aaub.edu.bd' THEN
    RAISE EXCEPTION 'Only @aaub.edu.bd email addresses are allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to verify email on profile insert
CREATE TRIGGER verify_email_domain
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.verify_aaub_email();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_hirer, is_freelancer)
  VALUES (NEW.id, NEW.email, true, true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile after auth signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
