import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Vote, Clock, Users, Trophy, Calendar, MapPin, CheckCircle, LogOut, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Election {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface Candidate {
  id: string;
  name: string;
  party: string;
  description: string;
  image_url: string | null;
  vote_count: number;
  election_id: string;
}

interface Vote {
  id: string;
  candidate_id: string;
  election_id: string;
  voter_id: string;
}

export const UserDashboard = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>('');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      fetchElections();
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (selectedElectionId) {
      fetchElectionData();
    }
  }, [selectedElectionId]);

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setElections(data || []);
      
      // Auto-select the first active election
      const activeElection = data?.find(e => {
        const now = new Date();
        const startTime = new Date(e.start_time);
        const endTime = new Date(e.end_time);
        return now >= startTime && now <= endTime;
      });
      
      if (activeElection) {
        setSelectedElectionId(activeElection.id);
      } else if (data && data.length > 0) {
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

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchElectionData = async () => {
    if (!selectedElectionId || !user) return;

    try {
      // Fetch candidates for the selected election
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .eq('election_id', selectedElectionId)
        .order('name');

      if (candidatesError) throw candidatesError;

      // Fetch user's votes for this election
      const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select('*')
        .eq('voter_id', user.id)
        .eq('election_id', selectedElectionId);

      if (votesError) throw votesError;

      setCandidates(candidatesData || []);
      setUserVotes(votesData || []);

      // Set selected candidate if user already voted
      if (votesData && votesData.length > 0) {
        setSelectedCandidateId(votesData[0].candidate_id);
      } else {
        setSelectedCandidateId('');
      }

    } catch (error) {
      console.error('Error fetching election data:', error);
      toast({
        title: "Error",
        description: "Failed to load election data",
        variant: "destructive",
      });
    }
  };

  const submitVote = async () => {
    if (!user || !selectedElectionId || !selectedCandidateId) return;

    setSubmitting(true);
    try {
      // Get the selected election to check if voting is allowed
      const selectedElection = elections.find(e => e.id === selectedElectionId);
      if (!selectedElection) {
        throw new Error('Election not found');
      }

      const now = new Date();
      const startTime = new Date(selectedElection.start_time);
      const endTime = new Date(selectedElection.end_time);

      if (now < startTime) {
        throw new Error('Voting has not started yet');
      }

      if (now > endTime) {
        throw new Error('Voting has ended');
      }

      // Check if user already voted for this election
      const existingVote = userVotes.find(v => v.election_id === selectedElectionId);

      if (existingVote) {
        // Update existing vote
        if (existingVote.candidate_id !== selectedCandidateId) {
          const { error } = await supabase
            .from('votes')
            .update({ 
              candidate_id: selectedCandidateId 
            })
            .eq('id', existingVote.id);

          if (error) throw error;
        }
      } else {
        // Get the position_id from the selected candidate
        const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);
        if (!selectedCandidate || !selectedCandidate.position_id) {
          throw new Error('Selected candidate does not have a valid position');
        }

        // Insert new vote
        const { error } = await supabase
          .from('votes')
          .insert({
            election_id: selectedElectionId,
            candidate_id: selectedCandidateId,
            voter_id: user.id,
            position_id: selectedCandidate.position_id
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Your vote has been submitted successfully!",
      });

      // Refresh the data to show updated votes
      fetchElectionData();

    } catch (error) {
      console.error('Error submitting vote:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit vote",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getElectionStatus = (election: Election) => {
    const now = new Date();
    const startTime = new Date(election.start_time);
    const endTime = new Date(election.end_time);

    if (now < startTime) {
      return { label: 'Upcoming', variant: 'secondary' as const, canVote: false };
    } else if (now >= startTime && now <= endTime) {
      return { label: 'Active', variant: 'default' as const, canVote: true };
    } else {
      return { label: 'Ended', variant: 'outline' as const, canVote: false };
    }
  };

  const hasUserVoted = () => {
    return userVotes.some(vote => vote.election_id === selectedElectionId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedElection = elections.find(e => e.id === selectedElectionId);
  const electionStatus = selectedElection ? getElectionStatus(selectedElection) : null;
  const canVote = userProfile?.role === 'voter' && userProfile?.approved_at && electionStatus?.canVote;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Voting Dashboard
              </h1>
              <Badge variant="secondary">{userProfile?.role || 'Pending'}</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user?.email}
              </span>
              <Button 
                onClick={signOut}
                variant="outline" 
                size="sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* User Status Alert */}
        {userProfile && userProfile.role === 'pending' && (
          <Alert className="mb-6 border-warning bg-warning/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your account is pending approval. Only approved voters can cast votes in elections. 
              Please wait for an administrator to approve your account.
            </AlertDescription>
          </Alert>
        )}

        {userProfile && userProfile.role === 'voter' && !userProfile.approved_at && (
          <Alert className="mb-6 border-warning bg-warning/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your voter account needs final approval. Please wait for an administrator to approve your voting privileges.
            </AlertDescription>
          </Alert>
        )}

        {/* Election Selector */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="w-5 h-5" />
              Select Election
            </CardTitle>
            <CardDescription>
              Choose an election to view candidates and cast your vote
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {elections.map((election) => {
                const status = getElectionStatus(election);
                return (
                  <Card 
                    key={election.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedElectionId === election.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedElectionId(election.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{election.title}</h3>
                        <Badge variant={status.variant}>
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {election.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(election.start_time).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(election.end_time).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Voting Interface */}
        {selectedElection && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedElection.title}</CardTitle>
                    <CardDescription>{selectedElection.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    {electionStatus && (
                      <Badge variant={electionStatus.variant}>
                        {electionStatus.label}
                      </Badge>
                    )}
                    {canVote && (
                      <Button 
                        onClick={submitVote}
                        disabled={submitting || !selectedCandidateId}
                        className="vote-button"
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Vote className="w-4 h-4 mr-2" />
                            Submit Vote
                          </>
                        )}
                      </Button>
                    )}
                    {electionStatus?.canVote && !canVote && (
                      <div className="text-sm text-muted-foreground">
                        Only approved voters can cast votes
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Candidates */}
            <Card className="vote-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Candidates
                      {hasUserVoted() && (
                        <CheckCircle className="w-5 h-5 text-success" />
                      )}
                    </CardTitle>
                    <CardDescription>Select your preferred candidate</CardDescription>
                  </div>
                  {hasUserVoted() && (
                    <Badge className="bg-success text-success-foreground">
                      Voted
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {candidates.length > 0 ? (
                  <RadioGroup
                    value={selectedCandidateId}
                    onValueChange={setSelectedCandidateId}
                    disabled={!canVote}
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      {candidates.map((candidate) => (
                        <div key={candidate.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value={candidate.id} id={candidate.id} />
                          <div className="flex items-center space-x-3 flex-1">
                            <Avatar>
                              <AvatarImage src={candidate.image_url || ''} alt={candidate.name} />
                              <AvatarFallback>
                                {candidate.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <Label htmlFor={candidate.id} className="cursor-pointer">
                                <div className="font-medium">{candidate.name}</div>
                                <div className="text-sm text-muted-foreground">{candidate.party}</div>
                                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {candidate.description}
                                </div>
                              </Label>
                            </div>
                            <div className="text-sm font-medium">
                              {candidate.vote_count} votes
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No candidates available for this election
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {elections.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No elections available at this time
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};