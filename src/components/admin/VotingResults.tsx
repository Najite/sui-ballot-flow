import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BarChart3, Trophy, Users, Vote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Election {
  id: string;
  title: string;
  status: string;
  start_time: string;
  end_time: string;
}

interface CandidateResult {
  id: string;
  name: string;
  party: string;
  description: string;
  image_url: string | null;
  vote_count: number;
  percentage: number;
}

interface ElectionResults {
  election: Election;
  candidates: CandidateResult[];
  totalVotes: number;
  winner: CandidateResult | null;
}

export const VotingResults = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>('');
  const [results, setResults] = useState<ElectionResults | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchElections();

    // Set up real-time subscription for vote updates
    const channel = supabase
      .channel('voting-results')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes'
        },
        () => {
          if (selectedElectionId) {
            fetchElectionResults(selectedElectionId);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'candidates'
        },
        () => {
          if (selectedElectionId) {
            fetchElectionResults(selectedElectionId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedElectionId]);

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('id, title, status, start_time, end_time')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setElections(data || []);
      
      // Auto-select the first election if available
      if (data && data.length > 0 && !selectedElectionId) {
        setSelectedElectionId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching elections:', error);
      toast({
        title: "Error",
        description: "Failed to load elections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchElectionResults = async (electionId: string) => {
    try {
      // Fetch election details
      const { data: electionData, error: electionError } = await supabase
        .from('elections')
        .select('*')
        .eq('id', electionId)
        .single();

      if (electionError) throw electionError;

      // Fetch candidates with their vote counts
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .eq('election_id', electionId)
        .order('vote_count', { ascending: false });

      if (candidatesError) throw candidatesError;

      // Calculate total votes and percentages
      const totalVotes = candidatesData.reduce((sum, candidate) => sum + candidate.vote_count, 0);
      
      const candidatesWithPercentage = candidatesData.map(candidate => ({
        ...candidate,
        percentage: totalVotes > 0 ? (candidate.vote_count / totalVotes) * 100 : 0
      }));

      const winner = candidatesWithPercentage.length > 0 ? candidatesWithPercentage[0] : null;

      setResults({
        election: electionData,
        candidates: candidatesWithPercentage,
        totalVotes,
        winner: winner && winner.vote_count > 0 ? winner : null
      });
    } catch (error) {
      console.error('Error fetching election results:', error);
      toast({
        title: "Error",
        description: "Failed to load election results",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (selectedElectionId) {
      fetchElectionResults(selectedElectionId);
    }
  }, [selectedElectionId]);

  const getElectionStatus = (election: Election) => {
    const now = new Date();
    const startTime = new Date(election.start_time);
    const endTime = new Date(election.end_time);

    if (now < startTime) {
      return { label: 'Upcoming', variant: 'secondary' as const };
    } else if (now >= startTime && now <= endTime) {
      return { label: 'Active', variant: 'default' as const };
    } else {
      return { label: 'Ended', variant: 'outline' as const };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Election Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Voting Results
          </CardTitle>
          <CardDescription>
            View real-time voting results and analytics
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Election</label>
              <Select value={selectedElectionId} onValueChange={setSelectedElectionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an election to view results" />
                </SelectTrigger>
                <SelectContent>
                  {elections.map((election) => (
                    <SelectItem key={election.id} value={election.id}>
                      {election.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {results && (
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <Badge {...getElectionStatus(results.election)}>
                  {getElectionStatus(results.election).label}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Total Votes: {results.totalVotes}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Vote className="w-4 h-4" />
                  <span>Candidates: {results.candidates.length}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Display */}
      {results && (
        <>
          {/* Winner Card */}
          {results.winner && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Leading Candidate
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={results.winner.image_url || ''} alt={results.winner.name} />
                    <AvatarFallback className="text-lg">
                      {results.winner.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{results.winner.name}</h3>
                    <p className="text-muted-foreground">{results.winner.party}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-2xl font-bold text-primary">
                        {results.winner.vote_count} votes
                      </span>
                      <Badge variant="default">
                        {results.winner.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Candidates Results */}
          <Card>
            <CardHeader>
              <CardTitle>All Candidates</CardTitle>
              <CardDescription>
                Complete voting results for {results.election.title}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {results.candidates.map((candidate, index) => (
                <div key={candidate.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                      <Avatar>
                        <AvatarImage src={candidate.image_url || ''} alt={candidate.name} />
                        <AvatarFallback>
                          {candidate.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold">{candidate.name}</h4>
                        <p className="text-sm text-muted-foreground">{candidate.party}</p>
                        
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold">{candidate.vote_count} votes</div>
                      <div className="text-sm text-muted-foreground">
                        {candidate.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <Progress value={candidate.percentage} className="h-2" />
                </div>
              ))}
              
              {results.candidates.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No candidates found for this election
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {elections.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No elections found. Create an election first to view results.
          </CardContent>
        </Card>
      )}
    </div>
  );
};