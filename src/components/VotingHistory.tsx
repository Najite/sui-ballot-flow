import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Vote, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface VoteRecord {
  id: string;
  created_at: string;
  election_id: string;
  candidate_id: string;
  elections: {
    title: string;
    description: string;
    end_time: string;
  };
  candidates: {
    name: string;
    party: string;
    image_url: string | null;
  };
}

export const VotingHistory = () => {
  const [voteHistory, setVoteHistory] = useState<VoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchVotingHistory();
    }
  }, [user]);

  const fetchVotingHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('votes')
        .select(`
          id,
          created_at,
          election_id,
          candidate_id,
          elections!inner(
            title,
            description,
            end_time
          ),
          candidates!inner(
            name,
            party,
            image_url
          )
        `)
        .eq('voter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVoteHistory(data || []);
    } catch (error) {
      console.error('Error fetching voting history:', error);
      toast({
        title: "Error",
        description: "Failed to load voting history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getElectionStatus = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    
    if (now > end) {
      return { label: 'Completed', variant: 'secondary' as const };
    } else {
      return { label: 'Active', variant: 'default' as const };
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Your Voting History
        </CardTitle>
        <CardDescription>
          A complete record of all your votes across elections
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {voteHistory.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {voteHistory.map((vote) => (
                <div key={vote.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-lg">{vote.elections.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {vote.elections.description}
                      </p>
                    </div>
                    <Badge {...getElectionStatus(vote.elections.end_time)}>
                      {getElectionStatus(vote.elections.end_time).label}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={vote.candidates.image_url || ''} alt={vote.candidates.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {vote.candidates.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Vote className="w-4 h-4 text-primary" />
                        <span className="font-medium">You voted for:</span>
                      </div>
                      <h5 className="font-semibold text-primary">{vote.candidates.name}</h5>
                      <p className="text-sm text-muted-foreground">{vote.candidates.party || 'Independent'}</p>
                    </div>
                    
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(vote.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs">
                        {new Date(vote.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No voting history yet</p>
            <p className="text-sm">
              Once you participate in elections, your voting record will appear here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};