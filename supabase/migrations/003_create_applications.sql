-- Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cover_letter TEXT NOT NULL,
  proposed_rate NUMERIC NOT NULL,
  estimated_duration TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, freelancer_id)
);

-- Enable Row Level Security
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for applications
CREATE POLICY "Freelancers can view own applications"
  ON public.applications FOR SELECT
  USING (freelancer_id = auth.uid() OR job_id IN (
    SELECT id FROM public.jobs WHERE hirer_id = auth.uid()
  ));

CREATE POLICY "Freelancers can create applications"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = freelancer_id);

CREATE POLICY "Hirers can update application status"
  ON public.applications FOR UPDATE
  USING (job_id IN (
    SELECT id FROM public.jobs WHERE hirer_id = auth.uid()
  ));

-- Create updated_at trigger
CREATE TRIGGER set_timestamp
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();
