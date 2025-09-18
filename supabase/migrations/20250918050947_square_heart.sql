/*
  # Fix vote count trigger and ensure proper vote counting

  1. Database Functions
    - Create or replace the vote count update function
    - Ensure trigger is properly set up

  2. Security
    - Maintain existing RLS policies
*/

-- Create or replace the function to update candidate vote counts
CREATE OR REPLACE FUNCTION update_candidate_vote_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_vote_count_trigger ON votes;

-- Create the trigger
CREATE TRIGGER update_vote_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_candidate_vote_count();

-- Update all existing vote counts to ensure they're accurate
UPDATE candidates 
SET vote_count = (
  SELECT COUNT(*) 
  FROM votes 
  WHERE votes.candidate_id = candidates.id
);