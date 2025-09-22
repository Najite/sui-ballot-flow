-- Fix the function security issue by setting search_path
CREATE OR REPLACE FUNCTION public.update_candidate_vote_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    UPDATE candidates 
    SET vote_count = (
      SELECT COUNT(*) 
      FROM votes 
      WHERE candidate_id = NEW.candidate_id
    )
    WHERE id = NEW.candidate_id;
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    UPDATE candidates 
    SET vote_count = (
      SELECT COUNT(*) 
      FROM votes 
      WHERE candidate_id = OLD.candidate_id
    )
    WHERE id = OLD.candidate_id;
    RETURN OLD;
  END IF;

  -- Handle UPDATE (when vote is changed to different candidate)
  IF TG_OP = 'UPDATE' THEN
    -- Update count for old candidate
    UPDATE candidates 
    SET vote_count = (
      SELECT COUNT(*) 
      FROM votes 
      WHERE candidate_id = OLD.candidate_id
    )
    WHERE id = OLD.candidate_id;
    
    -- Update count for new candidate
    UPDATE candidates 
    SET vote_count = (
      SELECT COUNT(*) 
      FROM votes 
      WHERE candidate_id = NEW.candidate_id
    )
    WHERE id = NEW.candidate_id;
    
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$function$;