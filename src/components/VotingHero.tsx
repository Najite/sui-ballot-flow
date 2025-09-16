import { Button } from "@/components/ui/button";
import { Shield, Vote, Users, CheckCircle } from "lucide-react";
import heroImage from "@/assets/hero-voting.jpg";

const VotingHero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Hero background with overlay */}
      <div 
        className="absolute inset-0 hero-section opacity-90"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.8)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center text-white">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium">Powered by Sui Blockchain</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Secure Democracy
            <br />
            <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              On Blockchain
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Experience the future of voting with our transparent, tamper-proof election system 
            built on the Sui blockchain network.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button size="lg" className="vote-button text-lg px-8 py-4">
            <Vote className="w-5 h-5 mr-2" />
            Cast Your Vote
          </Button>
          <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-white/30 text-white hover:bg-white/10">
            View Elections
          </Button>
        </div>

        {/* Feature highlights */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure & Immutable</h3>
            <p className="text-blue-100">Every vote is cryptographically secured on the blockchain</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Transparent Process</h3>
            <p className="text-blue-100">Real-time vote counting with full transparency</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Verified Results</h3>
            <p className="text-blue-100">Instant verification with mathematical proof</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VotingHero;