-- Ensure the vote count trigger is properly set up
DROP TRIGGER IF EXISTS update_candidate_vote_count_trigger ON votes;

CREATE TRIGGER update_candidate_vote_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_candidate_vote_count();

-- Also ensure realtime is enabled for candidates table
ALTER TABLE candidates REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE candidates;