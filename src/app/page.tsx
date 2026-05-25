
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
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
  PlusCircle,
  Search,
  LogOut,
  LayoutDashboard,
  Zap,
  Globe
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const { user } = useUser();
  const auth = useAuth();
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero');

  const handleLogout = async () => {
    if (auth) await signOut(auth);
  };

  return (
    <div className="flex flex-col min-h-screen selection:bg-primary selection:text-primary-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 z-[100] w-full border-b border-white/5 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-cyan-400 flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-[0_0_20px_rgba(6,182,212,0.5)]"
            >
              C
            </motion.div>
            <span className="text-2xl font-headline font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">CivicPulse</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-white/60 hover:text-primary transition-colors">Features</Link>
            <Link href="/map" className="text-sm font-medium text-white/60 hover:text-primary transition-colors">Impact Map</Link>
            <div className="flex items-center gap-4 ml-4">
              {user ? (
                <>
                  <Button variant="ghost" asChild className="text-white/80 hover:bg-white/5 rounded-full">
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                    </Link>
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleLogout} className="rounded-full border-white/10 hover:bg-white/5">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild className="text-white/80 hover:bg-white/5 rounded-full">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild className="rounded-full bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 blur-[120px] rounded-full opacity-30 pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-md">
                <Zap className="mr-2 h-4 w-4 fill-primary" /> AI-Driven Urban Excellence
              </div>
              <h1 className="text-6xl lg:text-8xl font-headline font-black tracking-tight leading-[0.9]">
                Pulsing the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">Future</span> of our Cities.
              </h1>
              <p className="text-xl text-white/60 max-w-lg leading-relaxed font-medium">
                The elite platform for smart-city governance. Report, track, and resolve community challenges with surgical precision and AI-backed intelligence.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 pt-4">
                <Button size="lg" className="h-16 px-10 text-lg font-bold rounded-2xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20" asChild>
                  <Link href="/report">
                    <PlusCircle className="mr-2 h-6 w-6" /> Raise a Pulsar
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-16 px-10 text-lg font-bold rounded-2xl border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10" asChild>
                  <Link href="/map">
                    <Globe className="mr-2 h-6 w-6" /> Explore Impact
                  </Link>
                </Button>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-10 bg-primary/10 rounded-[3rem] blur-3xl transform -rotate-6" />
              <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] p-2 bg-white/5 backdrop-blur-3xl">
                <Image 
                  src={heroImage?.imageUrl || "https://picsum.photos/seed/civic1/1200/600"} 
                  alt="Civic Pulse Platform" 
                  width={1200}
                  height={600}
                  className="rounded-[2rem] w-full h-auto object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
                  priority
                  data-ai-hint="smart city"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
            <h2 className="text-4xl lg:text-6xl font-headline font-bold">Engineered for Transparency.</h2>
            <p className="text-lg text-white/50 leading-relaxed font-medium">Built with the highest standards of civic accountability and technological sophistication.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<AlertCircle className="h-8 w-8 text-primary" />}
              title="Neural Triage"
              description="Gemini-powered analysis automatically prioritizes and routes issues based on visual and textual data."
            />
            <FeatureCard 
              icon={<MapPin className="h-8 w-8 text-primary" />}
              title="Geospatial Insight"
              description="Real-time heatmap visualization and spatial monitoring for proactive infrastructure management."
            />
            <FeatureCard 
              icon={<BarChart3 className="h-8 w-8 text-primary" />}
              title="SLA Accountability"
              description="Transparent tracking of service-level agreements to ensure every citizen report is handled with urgency."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 bg-black/40 backdrop-blur-3xl">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-4 text-center md:text-left">
            <Link href="/" className="flex items-center justify-center md:justify-start gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">C</div>
              <span className="text-xl font-headline font-bold">CivicPulse</span>
            </Link>
            <p className="text-sm text-white/40 max-w-xs uppercase tracking-widest font-bold">Global Smart-City Infrastructure</p>
          </div>
          <p className="text-sm text-white/30 font-medium">© {new Date().getFullYear()} CivicPulse OS. All systems operational.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div
      whileHover={{ y: -10, scale: 1.02 }}
      className="p-10 rounded-[2.5rem] glass-card space-y-6"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.2)]">
        {icon}
      </div>
      <h3 className="text-2xl font-bold">{title}</h3>
      <p className="text-white/50 leading-relaxed font-medium">{description}</p>
    </motion.div>
  );
}
