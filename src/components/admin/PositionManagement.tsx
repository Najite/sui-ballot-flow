import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Election {
  id: string;
  title: string;
}

interface Position {
  id: string;
  title: string;
  description: string;
  election_id: string;
  max_candidates: number;
  elections: { title: string };
  candidate_count?: number;
}

export const PositionManagement = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch positions with election details and candidate counts
      const { data: positionsData, error: positionsError } = await supabase
        .from('positions')
        .select(`
          *,
          elections!inner(title),
          candidates(id)
        `)
        .order('title');

      if (positionsError) throw positionsError;

      // Process positions to include candidate count
      const processedPositions = positionsData?.map(position => ({
        ...position,
        candidate_count: position.candidates?.length || 0
      })) || [];

      // Fetch elections for the dropdown
      const { data: electionsData, error: electionsError } = await supabase
        .from('elections')
        .select('id, title')
        .order('title');

      if (electionsError) throw electionsError;

      setPositions(processedPositions);
      setElections(electionsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load positions and elections",
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
    const electionId = formData.get('electionId') as string;
    const maxCandidates = parseInt(formData.get('maxCandidates') as string);

    try {
      const positionData = {
        title,
        description,
        election_id: electionId,
        max_candidates: maxCandidates,
      };

      if (editingPosition) {
        const { error } = await supabase
          .from('positions')
          .update(positionData)
          .eq('id', editingPosition.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Position updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('positions')
          .insert([positionData]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Position created successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingPosition(null);
      fetchData();
    } catch (error) {
      console.error('Error saving position:', error);
      toast({
        title: "Error",
        description: "Failed to save position",
        variant: "destructive",
      });
    }
  };

  const deletePosition = async (positionId: string) => {
    if (!confirm('Are you sure you want to delete this position? This will also delete all associated candidates.')) return;

    try {
      const { error } = await supabase
        .from('positions')
        .delete()
        .eq('id', positionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Position deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting position:', error);
      toast({
        title: "Error",
        description: "Failed to delete position",
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
              <MapPin className="w-5 h-5" />
              Position Management
            </CardTitle>
            <CardDescription>
              Create and manage voting positions for elections
            </CardDescription>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingPosition(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Position
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingPosition ? 'Edit Position' : 'Add New Position'}
                </DialogTitle>
                <DialogDescription>
                  Define a voting position for an election
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="electionId">Election</Label>
                    <Select name="electionId" defaultValue={editingPosition?.election_id || ''} required>
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
                    <Label htmlFor="title">Position Title</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="President, Mayor, Senator, etc."
                      defaultValue={editingPosition?.title || ''}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Brief description of the position..."
                      defaultValue={editingPosition?.description || ''}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxCandidates">Maximum Candidates</Label>
                    <Input
                      id="maxCandidates"
                      name="maxCandidates"
                      type="number"
                      min="1"
                      max="50"
                      placeholder="10"
                      defaultValue={editingPosition?.max_candidates || 10}
                      required
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit">
                    {editingPosition ? 'Update Position' : 'Add Position'}
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
              <TableHead>Position</TableHead>
              <TableHead>Election</TableHead>
              <TableHead>Candidates</TableHead>
              <TableHead>Max Candidates</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((position) => (
              <TableRow key={position.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{position.title}</div>
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {position.description}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{position.elections.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {position.candidate_count} / {position.max_candidates}
                  </Badge>
                </TableCell>
                <TableCell>{position.max_candidates}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingPosition(position);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deletePosition(position.id)}
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
        
        {positions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No positions found. Add positions to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
};