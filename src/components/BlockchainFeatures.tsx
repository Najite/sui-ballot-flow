import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Shield, 
  Eye, 
  Zap, 
  Globe, 
  Lock, 
  Users,
  BarChart3,
  Smartphone
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Cryptographic Security",
    description: "Every vote is secured using advanced cryptographic algorithms, ensuring complete data integrity and preventing tampering.",
    color: "text-primary"
  },
  {
    icon: Eye,
    title: "Full Transparency",
    description: "All voting processes are transparent and auditable. Anyone can verify the results using blockchain technology.",
    color: "text-accent"
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Real-time vote counting with immediate result updates as soon as the voting period ends.",
    color: "text-warning" 
  },
  {
    icon: Globe,
    title: "Global Accessibility",
    description: "Vote from anywhere in the world with just an internet connection. No need to visit physical polling stations.",
    color: "text-success"
  },
  {
    icon: Lock,
    title: "Anonymous Voting",
    description: "Your vote remains completely anonymous while still being verifiable on the blockchain.",
    color: "text-primary"
  },
  {
    icon: Users,
    title: "Voter Verification",
    description: "Advanced identity verification ensures only eligible voters can participate in each election.",
    color: "text-accent"
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Live voting statistics and trends powered by blockchain data analysis.",
    color: "text-warning"
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description: "Vote securely from any device - desktop, tablet, or smartphone with our responsive interface.",
    color: "text-success"
  }
];

const BlockchainFeatures = () => {
  return (
    <section className="py-16 px-6 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Why Choose Blockchain Voting?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience the next generation of democratic participation with features that ensure 
            security, transparency, and accessibility for all voters.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="vote-card border-0 h-full">
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-background flex items-center justify-center shadow-md`}>
                    <IconComponent className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-center text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stats section */}
        <div className="mt-16 grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
            <div className="text-muted-foreground">Security Rating</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-accent mb-2">24/7</div>
            <div className="text-muted-foreground">System Availability</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-success mb-2">50K+</div>
            <div className="text-muted-foreground">Votes Cast Securely</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-warning mb-2">0</div>
            <div className="text-muted-foreground">Security Breaches</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlockchainFeatures;