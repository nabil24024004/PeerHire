-- Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hirer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  budget NUMERIC NOT NULL,
  deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  required_skills TEXT[],
  attachment_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jobs (simplified - will be updated after applications table exists)
CREATE POLICY "Anyone can view open jobs"
  ON public.jobs FOR SELECT
  USING (status = 'open' OR hirer_id = auth.uid());

CREATE POLICY "Hirers can create jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (auth.uid() = hirer_id);

CREATE POLICY "Hirers can update own jobs"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = hirer_id);

CREATE POLICY "Hirers can delete own jobs"
  ON public.jobs FOR DELETE
  USING (auth.uid() = hirer_id);

-- Create updated_at trigger
CREATE TRIGGER set_timestamp
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();
