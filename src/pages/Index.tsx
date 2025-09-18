import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Users, Settings } from 'lucide-react';
import VotingHero from "@/components/VotingHero";
import VotingDashboard from "@/components/VotingDashboard";
import BlockchainFeatures from "@/components/BlockchainFeatures";
import { useAuth } from '@/hooks/useAuth';
import { UserDashboard } from '@/components/UserDashboard';
import { LogOut } from 'lucide-react';

const Index = () => {
  const { user, isAdmin, signOut } = useAuth();

  // If user is logged in and not admin, show user dashboard
  if (user && !isAdmin) {
    return <UserDashboard />;
  }

  return (
    <main>
      {/* Navigation Header */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Blockchain Voting
          </h1>
          
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  Welcome, {user.email}
                </span>
                {isAdmin && (
                  <Button asChild variant="default" size="sm">
                    <Link to="/admin">
                      <Settings className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </Link>
                  </Button>
                )}
                <Button 
                  onClick={signOut}
                  variant="outline" 
                  size="sm"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button asChild variant="outline" size="sm">
                  <Link to="/auth">
                    <Users className="w-4 h-4 mr-2" />
                    Sign In
                  </Link>
                </Button>
                <Button asChild variant="default" size="sm">
                  <Link to="/admin">
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Access
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <VotingHero />
      <VotingDashboard />
      <BlockchainFeatures />
    </main>
  );
};

export default Index;