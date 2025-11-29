-- Create payments table for tracking transactions
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'messenger' CHECK (payment_method IN ('messenger', 'bkash')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  transaction_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Payments are viewable by payer or payee
CREATE POLICY "Users can view their own payments"
ON public.payments FOR SELECT
USING (auth.uid() = payer_id OR auth.uid() = payee_id);

-- Users can create payments they're involved in
CREATE POLICY "Users can create their payments"
ON public.payments FOR INSERT
WITH CHECK (auth.uid() = payer_id);

-- Add trigger for updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  new_messages BOOLEAN NOT NULL DEFAULT true,
  new_offers BOOLEAN NOT NULL DEFAULT true,
  new_proposals BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own preferences
CREATE POLICY "Users can view their own notification preferences"
ON public.notification_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
ON public.notification_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
ON public.notification_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add UPDATE policy for job_applications so hirers can accept/reject
CREATE POLICY "Hirers can update applications for their jobs"
ON public.job_applications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = job_applications.job_id
    AND jobs.hirer_id = auth.uid()
  )
);

-- Add DELETE policy for job_applications so freelancers can withdraw
CREATE POLICY "Freelancers can delete their own applications"
ON public.job_applications FOR DELETE
USING (auth.uid() = freelancer_id);