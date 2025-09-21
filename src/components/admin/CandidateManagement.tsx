import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCheck, Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Position {
  id: string;
  title: string;
  election_id: string;
}

interface Election {
  id: string;
  title: string;
}

interface Candidate {
  id: string;
  election_id: string;
  position_id: string;
  name: string;
  party: string;
  description: string;
  image_url: string | null;
  vote_count: number;
  elections: { title: string };
  positions: { title: string };
}

export const CandidateManagement = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscription for vote updates
    const votesSubscription = supabase
      .channel('candidate-votes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(votesSubscription);
    };
  }, []);

  const fetchData = async () => {
    try {
      // Fetch candidates with election details and real-time vote counts
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select(`
          *,
          elections!inner(title),
          positions!inner(title),
          votes(id)
        `)
        .order('name');

      if (candidatesError) throw candidatesError;

      // Calculate actual vote counts from votes table
      const candidatesWithVotes = candidatesData?.map(candidate => ({
        ...candidate,
        vote_count: candidate.votes?.length || 0
      })) || [];

      // Fetch elections for the dropdown
      const { data: electionsData, error: electionsError } = await supabase
        .from('elections')
        .select('id, title')
        .order('title');

      if (electionsError) throw electionsError;

      // Fetch positions for the dropdown
      const { data: positionsData, error: positionsError } = await supabase
        .from('positions')
        .select('id, title, election_id')
        .order('title');

      if (positionsError) throw positionsError;

      setCandidates(candidatesWithVotes);
      setElections(electionsData || []);
      setPositions(positionsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load candidates and elections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPositionsForElection = (electionId: string) => {
    return positions.filter(position => position.election_id === electionId);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const party = formData.get('party') as string;
    const description = formData.get('description') as string;
    const positionId = formData.get('positionId') as string;
    const imageUrl = formData.get('imageUrl') as string;

    try {
      // Get the election_id from the selected position
      const selectedPosition = positions.find(p => p.id === positionId);
      if (!selectedPosition) {
        throw new Error('Invalid position selected');
      }

      const candidateData = {
        name,
        party,
        description,
        election_id: selectedPosition.election_id,
        position_id: positionId,
        image_url: imageUrl || null,
      };

      if (editingCandidate) {
        const { error } = await supabase
          .from('candidates')
          .update(candidateData)
          .eq('id', editingCandidate.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Candidate updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('candidates')
          .insert([candidateData]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Candidate created successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingCandidate(null);
      fetchData();
    } catch (error) {
      console.error('Error saving candidate:', error);
      toast({
        title: "Error",
        description: "Failed to save candidate",
        variant: "destructive",
      });
    }
  };

  const deleteCandidate = async (candidateId: string) => {
    if (!confirm('Are you sure you want to delete this candidate?')) return;

    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Candidate deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting candidate:', error);
      toast({
        title: "Error",
        description: "Failed to delete candidate",
        variant: "destructive",
      });
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
              <UserCheck className="w-5 h-5" />
              Candidate Management
            </CardTitle>
            <CardDescription>
              Add and manage candidates for elections
            </CardDescription>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingCandidate(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Candidate
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingCandidate ? 'Edit Candidate' : 'Add New Candidate'}
                </DialogTitle>
                <DialogDescription>
                  Enter candidate details for the election
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="electionId">Election</Label>
                    <Select 
                      value={selectedElectionId || editingCandidate?.election_id || ''} 
                      onValueChange={setSelectedElectionId}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an election" />
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

                  <div className="space-y-2">
                    <Label htmlFor="positionId">Position</Label>
                    <Select name="positionId" defaultValue={editingCandidate?.position_id || ''} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a position" />
                      </SelectTrigger>
                      <SelectContent>
                        {getPositionsForElection(selectedElectionId || editingCandidate?.election_id || '').map((position) => (
                          <SelectItem key={position.id} value={position.id}>
                            {position.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Candidate Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      defaultValue={editingCandidate?.name || ''}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="party">Political Party</Label>
                    <Input
                      id="party"
                      name="party"
                      placeholder="Democratic Party"
                      defaultValue={editingCandidate?.party || ''}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Brief candidate description and platform..."
                      defaultValue={editingCandidate?.description || ''}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL (optional)</Label>
                    <Input
                      id="imageUrl"
                      name="imageUrl"
                      type="url"
                      placeholder="https://example.com/candidate-photo.jpg"
                      defaultValue={editingCandidate?.image_url || ''}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit">
                    {editingCandidate ? 'Update Candidate' : 'Add Candidate'}
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
              <TableHead>Candidate</TableHead>
              <TableHead>Party</TableHead>
              <TableHead>Election</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Votes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((candidate) => (
              <TableRow key={candidate.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={candidate.image_url || ''} alt={candidate.name} />
                      <AvatarFallback>
                        {candidate.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{candidate.name}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {candidate.description}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{candidate.party}</TableCell>
                <TableCell>{candidate.elections.title}</TableCell>
                <TableCell>{candidate.positions.title}</TableCell>
                <TableCell>
                  <div className="font-semibold">{candidate.vote_count}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingCandidate(candidate);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteCandidate(candidate.id)}
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
        
        {candidates.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No candidates found. Add candidates to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
};