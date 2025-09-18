-- Create positions table
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  max_candidates INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on positions table
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for positions
CREATE POLICY "Everyone can view positions"
ON public.positions
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage positions"
ON public.positions
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- Add position_id to candidates table if it doesn't exist
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL;

-- Add position_id to votes table if it doesn't exist  
ALTER TABLE public.votes
ADD COLUMN IF NOT EXISTS position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE;

-- Create trigger for positions updated_at
CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON public.positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();