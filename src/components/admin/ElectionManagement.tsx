import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Plus, Edit, Trash2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Dialog as ViewDialog, DialogContent as ViewDialogContent, DialogDescription as ViewDialogDescription, DialogHeader as ViewDialogHeader, DialogTitle as ViewDialogTitle } from '@/components/ui/dialog';

interface Election {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  totalVotes?: number;
  candidates?: any[];
}

export const ElectionManagement = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingElection, setEditingElection] = useState<Election | null>(null);
  const [viewingElection, setViewingElection] = useState<Election | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch additional data for each election
      const electionsWithData = await Promise.all(
        (data || []).map(async (election) => {
          // Get total votes for this election
          const { data: votesData, error: votesError } = await supabase
            .from('votes')
            .select('id')
            .eq('election_id', election.id);

          // Get candidates for this election
          const { data: candidatesData, error: candidatesError } = await supabase
            .from('candidates')
            .select('*')
            .eq('election_id', election.id);

          return {
            ...election,
            totalVotes: votesData?.length || 0,
            candidates: candidatesData || []
          };
        })
      );

      setElections(electionsWithData);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;

    try {
      const electionData = {
        title,
        description,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        created_by: user?.id || ''
      };

      if (editingElection) {
        // Don't update created_by for existing elections
        const { created_by, ...updateData } = electionData;
        const { error } = await supabase
          .from('elections')
          .update(updateData)
          .eq('id', editingElection.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Election updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('elections')
          .insert(electionData);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Election created successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingElection(null);
      fetchElections();
    } catch (error) {
      console.error('Error saving election:', error);
      toast({
        title: "Error",
        description: "Failed to save election",
        variant: "destructive",
      });
    }
  };

  const deleteElection = async (electionId: string) => {
    if (!confirm('Are you sure you want to delete this election?')) return;

    try {
      const { error } = await supabase
        .from('elections')
        .delete()
        .eq('id', electionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Election deleted successfully",
      });

      fetchElections();
    } catch (error) {
      console.error('Error deleting election:', error);
      toast({
        title: "Error",
        description: "Failed to delete election",
        variant: "destructive",
      });
    }
  };

  const viewElectionDetails = async (election: Election) => {
    try {
      // Fetch detailed election data including candidates and votes
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select(`
          *,
          positions(title)
        `)
        .eq('election_id', election.id)
        .order('vote_count', { ascending: false });

      if (candidatesError) throw candidatesError;

      setViewingElection({
        ...election,
        candidates: candidatesData || []
      });
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error('Error fetching election details:', error);
      toast({
        title: "Error",
        description: "Failed to load election details",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (election: Election) => {
    const now = new Date();
    const startTime = new Date(election.start_time);
    const endTime = new Date(election.end_time);

    if (now < startTime) {
      return <Badge variant="secondary">Upcoming</Badge>;
    } else if (now >= startTime && now <= endTime) {
      return <Badge variant="default">Active</Badge>;
    } else {
      return <Badge variant="outline">Ended</Badge>;
    }
  };

  const getTimeRemaining = (election: Election) => {
    const now = new Date();
    const startTime = new Date(election.start_time);
    const endTime = new Date(election.end_time);

    if (now < startTime) {
      const diff = startTime.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return `Starts in ${days}d ${hours}h`;
    } else if (now >= startTime && now <= endTime) {
      const diff = endTime.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return `Ends in ${days}d ${hours}h`;
    } else {
      return 'Election ended';
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Election Management
            </CardTitle>
            <CardDescription>
              Create and manage elections with start/end times
            </CardDescription>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingElection(null)}>
                <Plus className="w-4 h-4 mr-2" />
                New Election
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingElection ? 'Edit Election' : 'Create New Election'}
                </DialogTitle>
                <DialogDescription>
                  Set up the election details and timing
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Election Title</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Presidential Election 2024"
                      defaultValue={editingElection?.title || ''}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Election description..."
                      defaultValue={editingElection?.description || ''}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      name="startTime"
                      type="datetime-local"
                      defaultValue={editingElection ? 
                        new Date(editingElection.start_time).toISOString().slice(0, 16) : ''
                      }
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      name="endTime"
                      type="datetime-local"
                      defaultValue={editingElection ? 
                        new Date(editingElection.end_time).toISOString().slice(0, 16) : ''
                      }
                      required
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit">
                    {editingElection ? 'Update Election' : 'Create Election'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Timing</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {elections.map((election) => (
              <TableRow key={election.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{election.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {election.description}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {election.totalVotes} votes • {election.candidates?.length || 0} candidates
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(election)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{getTimeRemaining(election)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(election.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewElectionDetails(election)}
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingElection(election);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteElection(election.id)}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {elections.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No elections found. Create your first election to get started.
          </div>
        )}
      </CardContent>

      {/* View Election Details Dialog */}
      <ViewDialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <ViewDialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <ViewDialogHeader>
            <ViewDialogTitle>{viewingElection?.title}</ViewDialogTitle>
            <ViewDialogDescription>
              Election details and current results
            </ViewDialogDescription>
          </ViewDialogHeader>
          
          {viewingElection && (
            <div className="space-y-6">
              {/* Election Info */}
              <div className="space-y-2">
                <h4 className="font-semibold">Description</h4>
                <p className="text-sm text-muted-foreground">{viewingElection.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Start Time:</span>
                  <p className="text-muted-foreground">
                    {new Date(viewingElection.start_time).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium">End Time:</span>
                  <p className="text-muted-foreground">
                    {new Date(viewingElection.end_time).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Total Votes:</span>
                  <p className="text-muted-foreground">{viewingElection.totalVotes}</p>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <div className="mt-1">{getStatusBadge(viewingElection)}</div>
                </div>
              </div>
              {/* Candidates Results */}
              <div className="space-y-4">
                <h4 className="font-semibold">Candidates & Results</h4>
                {viewingElection.candidates && viewingElection.candidates.length > 0 ? (
                  <div className="space-y-3">
                    {viewingElection.candidates.map((candidate, index) => {
                      const totalVotes = viewingElection.totalVotes || 0;
                      const percentage = totalVotes > 0 ? Math.round((candidate.vote_count / totalVotes) * 100) : 0;
                      
                      return (
                        <div key={candidate.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium">{candidate.name}</div>
                              <div className="text-sm text-muted-foreground">{candidate.party}</div>
                              {candidate.positions && (
                                <div className="text-xs text-muted-foreground">{candidate.positions.title}</div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{candidate.vote_count} votes</div>
                              <div className="text-sm text-muted-foreground">{percentage}%</div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No candidates registered for this election.</p>
                )}
              </div>
            </div>
          )}
        </ViewDialogContent>
      </ViewDialog>
    </Card>
  );
};