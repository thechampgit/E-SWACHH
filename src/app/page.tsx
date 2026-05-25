'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  MapPin, 
  BarChart3, 
  PlusCircle, 
  LogOut,
  LayoutDashboard,
  Globe,
  ArrowRight
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
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-[100] w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold">
              C
            </div>
            <span className="text-xl font-headline font-bold text-slate-900">CivicPulse</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Features</Link>
            <Link href="/map" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Impact Map</Link>
            <div className="flex items-center gap-4 ml-4">
              {user ? (
                <>
                  <Button variant="ghost" asChild className="text-slate-600">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild className="text-slate-600">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 bg-slate-50 border-b">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-5xl lg:text-6xl font-headline font-bold text-slate-900 leading-[1.1]">
                Better cities through <span className="text-primary">citizen collaboration.</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
                Report, track, and resolve community infrastructure issues in real-time. Join thousands of citizens making their neighborhoods safer and cleaner.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button size="lg" className="rounded-md px-8" asChild>
                  <Link href="/report">
                    <PlusCircle className="mr-2 h-5 w-5" /> Report an Issue
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="rounded-md px-8" asChild>
                  <Link href="/map">
                    View Local Impact
                  </Link>
                </Button>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              <div className="rounded-xl overflow-hidden shadow-2xl border bg-white p-2">
                <Image 
                  src={heroImage?.imageUrl || "https://picsum.photos/seed/civic1/1200/600"} 
                  alt="Civic Pulse Dashboard" 
                  width={1200}
                  height={600}
                  className="rounded-lg w-full h-auto object-cover"
                  priority
                  data-ai-hint="smart city"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-headline font-bold text-slate-900 mb-4">A complete civic platform.</h2>
            <p className="text-slate-600">Designed to bridge the gap between residents and municipal departments through transparency and action.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<AlertCircle className="h-6 w-6 text-primary" />}
              title="Real-time Reporting"
              description="Quickly log issues like potholes or broken streetlights with photos and GPS locations."
            />
            <FeatureCard 
              icon={<MapPin className="h-6 w-6 text-primary" />}
              title="Impact Mapping"
              description="Visualize community needs through interactive heatmaps and status trackers."
            />
            <FeatureCard 
              icon={<BarChart3 className="h-6 w-6 text-primary" />}
              title="Accountability"
              description="Track response times and resolution progress with full transparency for every report."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-slate-50">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="text-lg font-headline font-bold text-slate-900">CivicPulse</span>
          </div>
          <div className="flex gap-8 text-sm text-slate-500">
            <Link href="/transparency" className="hover:text-primary transition-colors">Transparency</Link>
            <Link href="/map" className="hover:text-primary transition-colors">Map</Link>
            <Link href="/login" className="hover:text-primary transition-colors">Login</Link>
          </div>
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} CivicPulse. Municipal Services.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-slate-600 leading-relaxed text-sm">{description}</p>
    </div>
  );
}
