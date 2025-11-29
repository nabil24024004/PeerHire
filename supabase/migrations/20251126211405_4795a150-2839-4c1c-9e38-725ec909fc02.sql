-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'message', 'application', 'job_update', 'payment'
  related_id UUID, -- ID of related job, message, or application
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Add trigger to create notifications when new messages are sent
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name TEXT;
BEGIN
  -- Get sender's name
  SELECT full_name INTO sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;

  -- Create notification for receiver
  INSERT INTO public.notifications (user_id, title, message, type, related_id)
  VALUES (
    NEW.receiver_id,
    'New Message',
    sender_name || ' sent you a message',
    'message',
    NEW.conversation_id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();

-- Add trigger to notify hirer when freelancer applies
CREATE OR REPLACE FUNCTION public.notify_new_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hirer_id UUID;
  job_title TEXT;
  freelancer_name TEXT;
BEGIN
  -- Get hirer_id and job title
  SELECT j.hirer_id, j.title INTO hirer_id, job_title
  FROM public.jobs j
  WHERE j.id = NEW.job_id;

  -- Get freelancer name
  SELECT full_name INTO freelancer_name
  FROM public.profiles
  WHERE id = NEW.freelancer_id;

  -- Create notification for hirer
  INSERT INTO public.notifications (user_id, title, message, type, related_id)
  VALUES (
    hirer_id,
    'New Application',
    freelancer_name || ' applied to "' || job_title || '"',
    'application',
    NEW.job_id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_application
  AFTER INSERT ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_application();

-- Add trigger to notify freelancer when application status changes
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  job_title TEXT;
BEGIN
  -- Only notify if status changed to accepted or rejected
  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected') THEN
    -- Get job title
    SELECT title INTO job_title
    FROM public.jobs
    WHERE id = NEW.job_id;

    -- Create notification for freelancer
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.freelancer_id,
      'Application ' || CASE WHEN NEW.status = 'accepted' THEN 'Accepted' ELSE 'Rejected' END,
      'Your application for "' || job_title || '" was ' || NEW.status,
      'application',
      NEW.job_id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_application_status_change
  AFTER UPDATE ON public.job_applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_application_status_change();

-- Add trigger to notify freelancer when job is assigned
CREATE OR REPLACE FUNCTION public.notify_job_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify if job was just assigned
  IF OLD.status = 'open' AND NEW.status = 'assigned' AND NEW.freelancer_id IS NOT NULL THEN
    -- Create notification for freelancer
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.freelancer_id,
      'Job Assigned',
      'You have been assigned to "' || NEW.title || '"',
      'job_update',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_job_assigned
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_job_assigned();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;