-- Create trigger to notify users when they receive a new message
-- Only create if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_new_message_created'
  ) THEN
    CREATE TRIGGER on_new_message_created
      AFTER INSERT ON public.messages
      FOR EACH ROW
      EXECUTE FUNCTION public.notify_new_message();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_new_application_created'
  ) THEN
    CREATE TRIGGER on_new_application_created
      AFTER INSERT ON public.job_applications
      FOR EACH ROW
      EXECUTE FUNCTION public.notify_new_application();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_application_status_changed'
  ) THEN
    CREATE TRIGGER on_application_status_changed
      AFTER UPDATE ON public.job_applications
      FOR EACH ROW
      EXECUTE FUNCTION public.notify_application_status_change();
  END IF;
END $$;