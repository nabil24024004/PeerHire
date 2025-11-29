-- Create saved_jobs table for bookmarking
CREATE TABLE public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(freelancer_id, job_id)
);

-- Enable RLS
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Freelancers can view their saved jobs"
  ON public.saved_jobs
  FOR SELECT
  USING (auth.uid() = freelancer_id);

CREATE POLICY "Freelancers can save jobs"
  ON public.saved_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = freelancer_id);

CREATE POLICY "Freelancers can unsave jobs"
  ON public.saved_jobs
  FOR DELETE
  USING (auth.uid() = freelancer_id);

-- Create index for performance
CREATE INDEX idx_saved_jobs_freelancer_id ON public.saved_jobs(freelancer_id);
CREATE INDEX idx_saved_jobs_job_id ON public.saved_jobs(job_id);

-- Enable realtime for saved jobs
ALTER PUBLICATION supabase_realtime ADD TABLE public.saved_jobs;