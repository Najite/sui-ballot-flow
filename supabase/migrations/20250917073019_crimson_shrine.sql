/*
  # Add voting constraints and position management

  1. New Tables
    - `positions` - Define voting positions/offices
      - `id` (uuid, primary key)
      - `title` (text, unique)
      - `description` (text)
      - `election_id` (uuid, foreign key)
      - `max_candidates` (integer, default 10)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes
    - Add `position_id` to candidates table
    - Update vote constraints to ensure one vote per position per user
    - Add RLS policies for positions

  3. Security
    - Enable RLS on positions table
    - Add policies for admins to manage positions
    - Add policies for users to view positions
    - Update voting constraints
*/

-- Create positions table
CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text UNIQUE NOT NULL,
  description text,
  election_id uuid NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  max_candidates integer DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add position_id to candidates table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'position_id'
  ) THEN
    ALTER TABLE candidates ADD COLUMN position_id uuid REFERENCES positions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS on positions
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

-- RLS policies for positions
CREATE POLICY "Admins can manage positions"
  ON positions
  FOR ALL
  TO public
  USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Everyone can view positions"
  ON positions
  FOR SELECT
  TO public
  USING (true);

-- Update votes table constraint to be per position instead of per election
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'votes_election_id_voter_id_key'
    AND table_name = 'votes'
  ) THEN
    ALTER TABLE votes DROP CONSTRAINT votes_election_id_voter_id_key;
  END IF;
  
  -- Add new constraint for one vote per position per voter
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'votes_position_voter_unique'
    AND table_name = 'votes'
  ) THEN
    -- First, we need to add position_id to votes table
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'votes' AND column_name = 'position_id'
    ) THEN
      ALTER TABLE votes ADD COLUMN position_id uuid;
      
      -- Update existing votes to get position_id from candidates
      UPDATE votes 
      SET position_id = candidates.position_id 
      FROM candidates 
      WHERE votes.candidate_id = candidates.id;
      
      -- Make position_id NOT NULL after updating existing data
      ALTER TABLE votes ALTER COLUMN position_id SET NOT NULL;
      
      -- Add foreign key constraint
      ALTER TABLE votes ADD CONSTRAINT votes_position_id_fkey 
        FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE;
    END IF;
    
    -- Add unique constraint for one vote per position per voter
    ALTER TABLE votes ADD CONSTRAINT votes_position_voter_unique 
      UNIQUE (position_id, voter_id);
  END IF;
END $$;

-- Create trigger for updated_at on positions
CREATE OR REPLACE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update candidate vote count function to work with positions
CREATE OR REPLACE FUNCTION update_candidate_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE candidates 
    SET vote_count = vote_count + 1 
    WHERE id = NEW.candidate_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE candidates 
    SET vote_count = vote_count - 1 
    WHERE id = OLD.candidate_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;