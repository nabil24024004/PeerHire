-- Create disputes table
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  raised_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  against UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for disputes
CREATE POLICY "Users can view own disputes"
  ON public.disputes FOR SELECT
  USING (raised_by = auth.uid() OR against = auth.uid());

CREATE POLICY "Users can create disputes"
  ON public.disputes FOR INSERT
  WITH CHECK (auth.uid() = raised_by);

CREATE POLICY "Admin can update disputes"
  ON public.disputes FOR UPDATE
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER set_timestamp
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();
