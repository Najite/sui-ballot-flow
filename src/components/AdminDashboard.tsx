import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Vote, Calendar, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { UserManagement } from './admin/UserManagement';
import { ElectionManagement } from './admin/ElectionManagement';
import { CandidateManagement } from './admin/CandidateManagement';
import { PositionManagement } from './admin/PositionManagement';
import { VotingResults } from './admin/VotingResults';

export const AdminDashboard = () => {
  const { user, signOut, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    activeElections: 0,
    totalVotes: 0
  });

  useEffect(() => {
    fetchDashboardStats();
    
    // Set up real-time subscriptions for stats updates
    const profilesSubscription = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchDashboardStats();
      })
      .subscribe();

    const votesSubscription = supabase
      .channel('votes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
        fetchDashboardStats();
      })
      .subscribe();

    const electionsSubscription = supabase
      .channel('elections-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'elections' }, () => {
        fetchDashboardStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesSubscription);
      supabase.removeChannel(votesSubscription);
      supabase.removeChannel(electionsSubscription);
    };
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch total users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, role, approved_at');

      if (profilesError) throw profilesError;

      const totalUsers = profilesData?.length || 0;
      const pendingUsers = profilesData?.filter(profile => 
        profile.role === 'pending' || (profile.role === 'voter' && !profile.approved_at)
      ).length || 0;

      // Fetch active elections
      const now = new Date().toISOString();
      const { data: electionsData, error: electionsError } = await supabase
        .from('elections')
        .select('id, start_time, end_time')
        .lte('start_time', now)
        .gte('end_time', now);

      if (electionsError) throw electionsError;

      const activeElections = electionsData?.length || 0;

      // Fetch total votes
      const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select('id');

      if (votesError) throw votesError;

      const totalVotes = votesData?.length || 0;

      setStats({
        totalUsers,
        pendingUsers,
        activeElections,
        totalVotes
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You don't have admin privileges to access this dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <Badge variant="secondary">Administrator</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Registered voters
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingUsers}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Elections</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeElections}</div>
              <p className="text-xs text-muted-foreground">
                Currently running
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
              <Vote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVotes}</div>
              <p className="text-xs text-muted-foreground">
                Votes cast
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="elections">Elections</TabsTrigger>
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="elections" className="space-y-6">
            <ElectionManagement />
          </TabsContent>

          <TabsContent value="positions" className="space-y-6">
            <PositionManagement />
          </TabsContent>

          <TabsContent value="candidates" className="space-y-6">
            <CandidateManagement />
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <VotingResults />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};