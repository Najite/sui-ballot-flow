-- First drop the existing trigger if it exists
DROP TRIGGER IF EXISTS update_candidate_vote_count_trigger ON votes;

-- Create the trigger to update vote counts
CREATE TRIGGER update_candidate_vote_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_candidate_vote_count();

-- Update all existing vote counts to match actual votes
UPDATE candidates 
SET vote_count = (
    SELECT COUNT(*) 
    FROM votes 
    WHERE candidate_id = candidates.id
);