
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
  ArrowRight,
  ShieldCheck
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
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">
              C
            </div>
            <span className="text-xl font-headline font-bold text-slate-900">CivicPulse India</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Features</Link>
            <Link href="/map" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Impact Map</Link>
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
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold">
                <Globe size={12} /> Exclusively for India
              </div>
              <h1 className="text-5xl lg:text-6xl font-headline font-bold text-slate-900 leading-tight">
                Transforming India's <span className="text-blue-600">Civic Response.</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
                Report local issues across Jharkhand, Maharashtra, Delhi, and beyond. Empowering Indian citizens to improve their neighborhood infrastructure in real-time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button size="lg" className="rounded-md px-8 bg-blue-600 hover:bg-blue-700 shadow-md" asChild>
                  <Link href="/report">
                    <PlusCircle className="mr-2 h-5 w-5" /> Report Issue
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="rounded-md px-8" asChild>
                  <Link href="/map">
                    View Impact Map
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
              <div className="rounded-2xl overflow-hidden shadow-2xl border bg-white p-2">
                <Image 
                  src={heroImage?.imageUrl || "https://picsum.photos/seed/civic1/1200/600"} 
                  alt="Civic Pulse Dashboard" 
                  width={1200}
                  height={600}
                  className="rounded-xl w-full h-auto object-cover"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-headline font-bold text-slate-900">National Civic Intelligence</h2>
            <p className="text-slate-500">A professional platform designed for Indian municipal accountability and citizen engagement.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <FeatureCard 
              icon={<ShieldCheck className="h-6 w-6 text-blue-600" />}
              title="State-Level Tracking"
              description="Integrated support for Indian states and districts, ensuring reports reach the right municipal department."
            />
            <FeatureCard 
              icon={<MapPin className="h-6 w-6 text-blue-600" />}
              title="Regional Hotspots"
              description="Heatmaps focused on Indian urban centers to identify recurring infrastructure bottlenecks."
            />
            <FeatureCard 
              icon={<BarChart3 className="h-6 w-6 text-blue-600" />}
              title="Accountability"
              description="Track response times of local bodies with full transparency for every PIN code."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-slate-50">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="text-lg font-headline font-bold text-slate-900">CivicPulse India</span>
          </div>
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} CivicPulse. Serving Indian Municipalities.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-xl border border-slate-100 bg-white hover:border-blue-200 transition-all shadow-sm">
      <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2 text-slate-900">{title}</h3>
      <p className="text-slate-500 leading-relaxed text-sm">{description}</p>
    </div>
  );
}
