-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  related_id uuid DEFAULT NULL,
  read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  new_messages boolean DEFAULT true NOT NULL,
  new_proposals boolean DEFAULT true NOT NULL,
  new_offers boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  payer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  payee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10,2) NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  payment_method text DEFAULT 'stripe' NOT NULL,
  transaction_details text DEFAULT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create saved_jobs table
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(freelancer_id, job_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- System can insert notifications (will be done via backend/triggers)
CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for payments
CREATE POLICY "Users can view payments they're involved in"
  ON public.payments FOR SELECT
  USING (auth.uid() = payer_id OR auth.uid() = payee_id);

CREATE POLICY "Payers can create payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = payer_id);

CREATE POLICY "Users can update payments they're involved in"
  ON public.payments FOR UPDATE
  USING (auth.uid() = payer_id OR auth.uid() = payee_id);

-- RLS Policies for saved_jobs
CREATE POLICY "Freelancers can view their own saved jobs"
  ON public.saved_jobs FOR SELECT
  USING (auth.uid() = freelancer_id);

CREATE POLICY "Freelancers can save jobs"
  ON public.saved_jobs FOR INSERT
  WITH CHECK (auth.uid() = freelancer_id);

CREATE POLICY "Freelancers can remove saved jobs"
  ON public.saved_jobs FOR DELETE
  USING (auth.uid() = freelancer_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create notification preferences for new users
CREATE OR REPLACE FUNCTION public.create_notification_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Add trigger to create notification preferences on profile creation
CREATE TRIGGER create_notification_preferences_on_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_notification_preferences();
