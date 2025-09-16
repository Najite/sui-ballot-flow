import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Vote, Clock, Users, Trophy, Calendar, MapPin } from "lucide-react";

const mockElections = [
  {
    id: 1,
    title: "2024 Presidential Election",
    description: "Choose the next President of the United States",
    status: "active",
    endDate: "2024-11-05",
    totalVotes: 15420,
    yourVote: null,
    location: "United States",
    candidates: [
      { name: "Sarah Johnson", party: "Democratic", votes: 7250, percentage: 47 },
      { name: "Michael Chen", party: "Republican", votes: 6890, percentage: 45 },
      { name: "Alex Rivera", party: "Independent", votes: 1280, percentage: 8 }
    ]
  },
  {
    id: 2,
    title: "City Mayor Election",
    description: "Select your local mayor for the next term",
    status: "active", 
    endDate: "2024-10-15",
    totalVotes: 3240,
    yourVote: "Emma Thompson",
    location: "San Francisco, CA",
    candidates: [
      { name: "Emma Thompson", party: "Progressive", votes: 1620, percentage: 50 },
      { name: "Robert Kim", party: "Conservative", votes: 1134, percentage: 35 },
      { name: "Lisa Martinez", party: "Moderate", votes: 486, percentage: 15 }
    ]
  },
  {
    id: 3,
    title: "School Board Elections",
    description: "Vote for school board representatives",
    status: "ended",
    endDate: "2024-09-20",
    totalVotes: 1890,
    yourVote: "David Wilson",
    location: "District 12",
    candidates: [
      { name: "David Wilson", party: "Education First", votes: 945, percentage: 50 },
      { name: "Maria Garcia", party: "Reform", votes: 756, percentage: 40 },
      { name: "John Adams", party: "Traditional", votes: 189, percentage: 10 }
    ]
  }
];

const VotingDashboard = () => {
  return (
    <section className="py-16 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">Active Elections</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Participate in democratic processes with complete transparency and security
          </p>
        </div>

        <div className="grid gap-8">
          {mockElections.map((election) => (
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
                        {election.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Ends: {election.endDate}
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
      </div>
    </section>
  );
};

export default VotingDashboard;