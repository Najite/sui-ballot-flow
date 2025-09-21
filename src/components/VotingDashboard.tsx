import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Vote, Clock, Users, Trophy, Calendar, MapPin } from "lucide-react";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Election {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: string;
  totalVotes: number;
  yourVote: string | null;
  candidates: Candidate[];
}

interface Candidate {
  id: string;
  name: string;
  party: string;
  votes: number;
  percentage: number;
}

const VotingDashboard = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchElections();
    
    // Set up real-time subscription for vote updates
    const channel = supabase
      .channel('voting-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes'
        },
        () => {
          fetchElections();
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
          fetchElections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchElections = async () => {
    try {
      // Fetch elections
      const { data: electionsData, error: electionsError } = await supabase
        .from('elections')
        .select('*')
        .order('created_at', { ascending: false });

      if (electionsError) throw electionsError;

      // For each election, fetch candidates and vote data
      const electionsWithData = await Promise.all(
        (electionsData || []).map(async (election) => {
          // Fetch candidates for this election with real-time vote counts
          const { data: candidatesData, error: candidatesError } = await supabase
            .from('candidates')
            .select(`
              *,
              votes(id)
            `)
            .eq('election_id', election.id)
            .order('name');

          if (candidatesError) throw candidatesError;

          // Calculate actual vote counts and sort by votes
          const candidatesWithVotes = candidatesData?.map(candidate => ({
            ...candidate,
            vote_count: candidate.votes?.length || 0
          })).sort((a, b) => b.vote_count - a.vote_count) || [];

          // Calculate total votes
          const totalVotes = candidatesWithVotes.reduce((sum, candidate) => sum + candidate.vote_count, 0);

          // Get user's vote for this election if logged in
          let yourVote = null;
          if (user) {
            const { data: voteData } = await supabase
              .from('votes')
              .select(`
                candidate_id,
                candidates!inner(name)
              `)
              .eq('voter_id', user.id)
              .eq('election_id', election.id)
              .maybeSingle();

            if (voteData) {
              yourVote = voteData.candidates.name;
            }
          }

          // Format candidates data
          const candidates = candidatesWithVotes.map(candidate => ({
            id: candidate.id,
            name: candidate.name,
            party: candidate.party || 'Independent',
            votes: candidate.vote_count,
            percentage: totalVotes > 0 ? Math.round((candidate.vote_count / totalVotes) * 100) : 0
          }));

          // Determine status based on dates
          const now = new Date();
          const startTime = new Date(election.start_time);
          const endTime = new Date(election.end_time);
          
          let status = 'upcoming';
          if (now >= startTime && now <= endTime) {
            status = 'active';
          } else if (now > endTime) {
            status = 'ended';
          }

          return {
            id: election.id,
            title: election.title,
            description: election.description || '',
            start_time: election.start_time,
            end_time: election.end_time,
            status,
            totalVotes,
            yourVote,
            candidates
          };
        })
      );

      setElections(electionsWithData);
    } catch (error) {
      console.error('Error fetching elections:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Active Elections</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Loading elections...
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">Active Elections</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Participate in democratic processes with complete transparency and security
          </p>
        </div>

        {elections.length > 0 ? (
          <div className="grid gap-8">
            {elections.map((election) => (
            <Card key={election.id} className="vote-card">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-2xl">{election.title}</CardTitle>
                      <Badge 
                        variant={election.status === "active" ? "default" : election.status === "ended" ? "secondary" : "outline"}
                        className={election.status === "active" ? "bg-success text-success-foreground" : ""}
                      >
                        {election.status === "active" ? "Active" : "Ended"}
                      </Badge>
                    </div>
                    <CardDescription className="text-base mb-3">{election.description}</CardDescription>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Online Election
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Ends: {new Date(election.end_time).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {election.totalVotes.toLocaleString()} votes
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    {election.status === "active" && !election.yourVote && (
                      <Button className="vote-button">
                        <Vote className="w-4 h-4 mr-2" />
                        Vote Now
                      </Button>
                    )}
                    {election.yourVote && (
                      <div className="text-center">
                        <Badge variant="outline" className="mb-2">Your Vote</Badge>
                        <p className="text-sm font-medium">{election.yourVote}</p>
                      </div>
                    )}
                    <Button variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg mb-3">Current Results</h4>
                  {election.candidates.map((candidate, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{candidate.name}</span>
                          <Badge variant="outline" className="text-xs">{candidate.party}</Badge>
                          {candidate.name === election.yourVote && (
                            <Badge className="text-xs bg-success text-success-foreground">Your Choice</Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">{candidate.percentage}%</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({candidate.votes.toLocaleString()} votes)
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={candidate.percentage} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
                
                {election.status === "ended" && (
                  <div className="mt-6 p-4 bg-success/10 rounded-lg border border-success/20">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-success" />
                      <span className="font-semibold text-success">
                        Winner: {election.candidates.reduce((a, b) => a.votes > b.votes ? a : b).name}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">No elections available at this time.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default VotingDashboard;