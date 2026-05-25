import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertCircle, 
  CheckCircle2, 
  MapPin, 
  BarChart3, 
  ShieldCheck, 
  ArrowRight,
  Menu,
  X,
  PlusCircle,
  Search
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
              C
            </div>
            <span className="text-xl font-headline font-bold text-primary">CivicPulse</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</Link>
            <Link href="#about" className="text-sm font-medium hover:text-primary transition-colors">About</Link>
            <Link href="/track" className="text-sm font-medium hover:text-primary transition-colors">Track Issue</Link>
            <div className="flex items-center gap-2 ml-4">
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-slate-50">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <span className="mr-2">✨</span> Transforming Cities through AI
              </div>
              <h1 className="text-5xl lg:text-7xl font-headline font-extrabold tracking-tight text-slate-900">
                Better Cities Start with <span className="text-primary">Better Care.</span>
              </h1>
              <p className="text-xl text-slate-600 max-w-lg leading-relaxed">
                Empowering citizens to report, track, and resolve civic issues using intelligent AI analysis and real-time community engagement.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="h-14 px-8 text-lg" asChild>
                  <Link href="/report">
                    <PlusCircle className="mr-2 h-5 w-5" /> Report an Issue
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg" asChild>
                  <Link href="/track">
                    <Search className="mr-2 h-5 w-5" /> Track Complaint
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl transform rotate-3"></div>
              <div className="relative rounded-2xl overflow-hidden border-8 border-white shadow-2xl">
                <Image 
                  src={heroImage?.imageUrl || "https://picsum.photos/seed/civic1/1200/600"} 
                  alt="Civic Pulse Platform" 
                  width={1200}
                  height={600}
                  className="w-full h-auto object-cover"
                  priority
                  data-ai-hint="smart city"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center space-y-2">
              <h3 className="text-4xl font-headline font-bold text-primary">12k+</h3>
              <p className="text-muted-foreground font-medium">Reports Filed</p>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-4xl font-headline font-bold text-accent">94%</h3>
              <p className="text-muted-foreground font-medium">Resolution Rate</p>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-4xl font-headline font-bold text-primary">45</h3>
              <p className="text-muted-foreground font-medium">Partner Cities</p>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-4xl font-headline font-bold text-accent">24h</h3>
              <p className="text-muted-foreground font-medium">Avg. Response</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-headline font-bold text-slate-900">Empowering Smart Governance</h2>
            <p className="text-muted-foreground">Everything you need to improve your community, built with modern technology and accessibility at its core.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<AlertCircle className="h-6 w-6 text-primary" />}
              title="AI Severity Analysis"
              description="Our AI automatically categorizes and prioritizes issues based on your descriptions and photos."
            />
            <FeatureCard 
              icon={<MapPin className="h-6 w-6 text-primary" />}
              title="Live Impact Map"
              description="Visualize reported issues in your area and track real-time resolution progress on an interactive map."
            />
            <FeatureCard 
              icon={<BarChart3 className="h-6 w-6 text-primary" />}
              title="Status Timeline"
              description="Stay updated with a detailed timeline of your report from submission to final resolution."
            />
            <FeatureCard 
              icon={<ShieldCheck className="h-6 w-6 text-primary" />}
              title="Verified Resolutions"
              description="Resolution evidence is required to close reports, ensuring quality work is done every time."
            />
            <FeatureCard 
              icon={<PlusCircle className="h-6 w-6 text-primary" />}
              title="Instant Reporting"
              description="Submit reports in seconds with our mobile-optimized form and automatic geo-tagging."
            />
            <FeatureCard 
              icon={<CheckCircle2 className="h-6 w-6 text-primary" />}
              title="Community Feed"
              description="See what issues are being resolved in your neighborhood and support community growth."
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-headline font-bold">What Citizens Say</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TestimonialCard 
              quote="CivicPulse made it so easy to get the broken streetlight on our street fixed. It took only 3 days!"
              author="Sarah Johnson"
              role="Downtown Resident"
            />
            <TestimonialCard 
              quote="The map view is incredible. I can see exactly what's happening in my neighborhood and stay informed."
              author="Michael Chen"
              role="Community Leader"
            />
            <TestimonialCard 
              quote="I love the AI categorization. It saves so much time not having to figure out which department to call."
              author="Elena Rodriguez"
              role="Citizen Journalist"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-4xl font-headline font-bold">Ready to make a difference?</h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">Join thousands of citizens working together to build cleaner, safer, and smarter cities for everyone.</p>
          <div className="flex justify-center gap-4">
            <Button size="lg" variant="secondary" className="h-14 px-8 text-lg" asChild>
              <Link href="/signup">Create Free Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-slate-400 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2 space-y-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                  C
                </div>
                <span className="text-xl font-headline font-bold text-white">CivicPulse</span>
              </Link>
              <p className="max-w-xs">Leading the way in digital civic infrastructure and citizen engagement technology.</p>
            </div>
            <div className="space-y-4">
              <h4 className="text-white font-bold">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/report" className="hover:text-primary transition-colors">Report Issue</Link></li>
                <li><Link href="/track" className="hover:text-primary transition-colors">Track Status</Link></li>
                <li><Link href="/map" className="hover:text-primary transition-colors">Impact Map</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-white font-bold">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-center text-sm">
            <p>© {new Date().getFullYear()} CivicPulse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="border-none shadow-md hover:shadow-xl transition-shadow bg-white">
      <CardContent className="pt-8 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

function TestimonialCard({ quote, author, role }: { quote: string, author: string, role: string }) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="pt-8 space-y-6">
        <p className="text-lg italic text-slate-700">"{quote}"</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {author[0]}
          </div>
          <div>
            <h4 className="font-bold text-slate-900">{author}</h4>
            <p className="text-xs text-muted-foreground">{role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}