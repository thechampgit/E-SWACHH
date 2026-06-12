'use client';

import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { Linkedin, Instagram, Github, Mail, CopyCheckIcon, MapPinCheckInsideIcon, TreesIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useUser, useAuth } from '@/firebase';
import { useLogoutConfirm } from '@/context/LogoutConfirmContext';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  MapPin, 
  BarChart3, 
  PlusCircle, 
  LogOut,
  Globe,
  ArrowRight,
  ShieldCheck,
  Trash2,
  Droplet,
  Hammer,
  Zap,
  Waves,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  ArrowUpRight,
  AlertTriangle,
  Computer,
  HandPlatter,
  Recycle,
  RecycleIcon,
  HandPlatterIcon,
  TimerIcon,
  ComputerIcon,
  BuildingIcon,
  HandshakeIcon,
  EarthLockIcon,
  LeafIcon,
  GlassesIcon,
  GlassWaterIcon,
  InstagramIcon
} from 'lucide-react';

const slides = [
  {
    title: "Smart Digital India",
    subtitle: "Pioneering futuristic municipal frameworks integrated with smart IoT grids and GIS mapping to accelerate modern urban administrative execution.",
    image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=60&w=1200&auto=format&fit=crop&fm=webp",
    tag: "Digital India Initiative"
  },
  {
    title: "Cleaner Cities Through Technology",
    subtitle: "Synchronizing ward boundaries, automated AI dispatch routing, and real-time SLA metrics tracking to establish transparent city maintenance standards.",
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=60&w=1200&auto=format&fit=crop&fm=webp",
    tag: "Municipal AI Automation"
  },
  {
    title: "Citizen-Powered Civic Reporting",
    subtitle: "Fostering strong citizen collaboration with local local zone commissioners through geo-spatial grievance filing and gamified community points.",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=60&w=1200&auto=format&fit=crop&fm=webp",
    tag: "Democratic Neighborhood Watch"
  }
];

const categories = [
  { name: "Garbage Collection Delays", icon: <Clock className="h-6 w-6" />, desc: "Report missed garbage collection services or schedule delays in your block." },
  { name: "Overflowing Dustbins", icon: <Trash2 className="h-6 w-6" />, desc: "Log public dumpsters, waste bins, or containers exceeding sanitary limits." },
  { name: "Illegal Dumping of Waste", icon: <ShieldCheck className="h-6 w-6" />, desc: "Report illegal disposal of commercial, toxic, or resident rubbish in non-designated zones." },
  { name: "Poor Street Cleaning", icon: <Sparkles className="h-6 w-6" />, desc: "Log requests for sweeping, litter clearing, or municipal maintenance of local roads." },
  { name: "Lack of Public Toilets", icon: <BookOpen className="h-6 w-6" />, desc: "Report demand, sanitary failures, or active shortages of public sanitation facilities." },
  { name: "Open Drains & Unhygienic Areas", icon: <Droplet className="h-6 w-6" />, desc: "Report unhygienic stagnant water, exposed open sewage channels, or health hazards." },
  { name: "Potholes & Damaged Roads", icon: <Hammer className="h-6 w-6" />, desc: "Report structural damage, dangerous potholes, cracks, or public road decay." },
  { name: "Broken Footpaths", icon: <MapPin className="h-6 w-6" />, desc: "Report fractured concrete pathways, high curbs, or sidewalk obstructions for pedestrians." },
  { name: "Waterlogging During Rain", icon: <Waves className="h-6 w-6" />, desc: "Report neighborhood flooding, high road water logging, or poor wet-weather drainage." },
  { name: "Poor Drainage Systems", icon: <Activity className="h-6 w-6" />, desc: "Report blocked underground pipelines, backflows, or general drainage maintenance issues." },
  { name: "Unsafe Bridges & Crossings", icon: <AlertTriangle className="h-6 w-6" />, desc: "Log dangerous pedestrian footbridges, loose structures, or active crossing safety hazards." },
  { name: "Encroachment on Public Roads", icon: <Globe className="h-6 w-6" />, desc: "Report unauthorized vendors, illegal constructions, or parking blocking municipal streets." }
];

function FaqItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-slate-200/80 bg-white transition-all duration-300 hover:border-slate-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-start gap-4"
      >
        <span className="font-headline font-bold text-base text-slate-900 hover:text-cyan-600 transition-colors">
          {question}
        </span>
        <span className={`transform transition-transform duration-300 text-slate-400 shrink-0 ${isOpen ? 'rotate-180 text-cyan-600' : ''}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[300px] border-t border-slate-100' : 'max-h-0'}`}>
        <p className="p-6 text-slate-500 text-sm leading-relaxed bg-slate-50/40">
          {answer}
        </p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useUser();
  const auth = useAuth();
  
  const [showSplash, setShowSplash] = useState(false);

  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSender, setEmailSender] = useState('');

  useEffect(() => {
    if (user?.email) {
      setEmailSender(user.email);
    }
  }, [user]);

  const handleEmailClick = () => {
    setIsEmailDialogOpen(true);
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoLink = `mailto:champgmail@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoLink;
    toast({
      title: "Email Client Opened",
      description: "Redirecting to your email client to send the complaint to champgmail@gmail.com.",
    });
    setIsEmailDialogOpen(false);
    setEmailSubject('');
    setEmailBody('');
  };

  useEffect(() => {
    const hasShownSplash = sessionStorage.getItem('eswachh_splash_shown');
    if (!hasShownSplash) {
      setShowSplash(true);
      sessionStorage.setItem('eswachh_splash_shown', 'true');
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2000); // 2 seconds load
      return () => clearTimeout(timer);
    }
  }, []);
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const { confirmLogout } = useLogoutConfirm();

  const handleLogout = async () => {
    confirmLogout(async () => {
      if (auth) await signOut(auth);
    });
  };

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900 text-white cursor-pointer select-none"
            onClick={() => setShowSplash(false)}
            title="Click to skip"
          >
            {/* Background ambient light */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.08)_0%,transparent_70%)] pointer-events-none" />
            
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center px-6 relative z-10"
            >
              {/* Glowing ring around logo */}
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-cyan-500/25 blur-xl animate-pulse" />
                <motion.img 
                  src="/logo.png" 
                  alt="E-Swachh Logo" 
                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-2xl relative z-10 shadow-2xl border border-white/10"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2.0, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                />
              </div>

              {/* Title & Subtitle */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-3xl sm:text-4xl font-headline font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2"
              >
                E-Swachh
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="text-xs sm:text-sm uppercase tracking-widest text-slate-400 font-bold mb-8"
              >
                National Cleanliness Grid
              </motion.p>

              {/* Loading Indicator */}
              <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden relative mb-4">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ 
                    duration: 1.8, 
                    ease: "easeInOut" 
                  }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 absolute left-0 top-0 shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                />
              </div>

              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="text-[10px] text-slate-500 tracking-wider mt-4 hover:text-slate-400 transition-colors"
              >
                Click anywhere to skip
              </motion.span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* 1. STICKY GLASSMORPHIC NAVBAR */}
      <nav className={`fixed top-0 z-[100] w-full transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b py-3' 
          : 'bg-transparent py-5'
      }`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img 
              src="/logo.png" 
              alt="E-Swachh Logo" 
              className="w-9 h-9 object-contain rounded-md transition-transform duration-300 group-hover:scale-105 group-hover:rotate-6"
            />
            <span className={`text-xl font-headline font-extrabold tracking-wider transition-colors duration-300 ${
              isScrolled ? 'text-slate-900' : 'text-white'
            }`}>
              E-Swachh
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className={`text-sm font-semibold uppercase tracking-wider transition-colors duration-200 ${
              isScrolled ? 'text-slate-600 hover:text-cyan-600' : 'text-slate-200 hover:text-cyan-400'
            }`}>Features</Link>
            <Link href="#categories" className={`text-sm font-semibold uppercase tracking-wider transition-colors duration-200 ${
              isScrolled ? 'text-slate-600 hover:text-cyan-600' : 'text-slate-200 hover:text-cyan-400'
            }`}>Categories</Link>
            <Link href="#dashboard" className={`text-sm font-semibold uppercase tracking-wider transition-colors duration-200 ${
              isScrolled ? 'text-slate-600 hover:text-cyan-600' : 'text-slate-200 hover:text-cyan-400'
            }`}>Preview</Link>
            <Link href="#help" className={`text-sm font-semibold uppercase tracking-wider transition-colors duration-200 ${
              isScrolled ? 'text-slate-600 hover:text-cyan-600' : 'text-slate-200 hover:text-cyan-400'
            }`}>Help Center</Link>
            <Link href="/map" className={`text-sm font-semibold uppercase tracking-wider transition-colors duration-200 ${
              isScrolled ? 'text-slate-600 hover:text-cyan-600' : 'text-slate-200 hover:text-cyan-400'
            }`}>Impact Map</Link>
            
            <div className="flex items-center gap-4 ml-4">
              {user ? (
                <>
                  <Button variant="ghost" asChild className={`font-semibold uppercase tracking-wider text-xs ${
                    isScrolled ? 'text-slate-700 hover:text-cyan-600' : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}>
                    <Link href="/profile">Profile</Link>
                  </Button>
                  <Button variant="ghost" asChild className={`font-semibold uppercase tracking-wider text-xs ${
                    isScrolled ? 'text-slate-700 hover:text-cyan-600' : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}>
                    <Link href="/dashboard">Portal</Link>
                  </Button>
                  <Button size="sm" onClick={handleLogout} className="bg-[#0096c7] hover:bg-[#0077b6] text-white font-semibold uppercase tracking-wider text-xs px-4">
                    <LogOut className="mr-1.5 h-3.5 w-3.5" /> Logout
                  </Button>
                </>
              ) : (
                <Button asChild size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold uppercase tracking-wider text-xs px-4">
                  <Link href="/login">Login</Link>
                </Button>
              )}
            </div>

            {/* Mobile Navigation Menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`rounded-full hover:bg-black/5 dark:hover:bg-white/10 ${
                      isScrolled ? 'text-slate-900' : 'text-white'
                    }`}
                    aria-label="Toggle navigation menu"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] p-6 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">
                  <SheetHeader className="text-left mb-6">
                    <SheetTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-headline font-extrabold">
                      <img src="/logo.png" alt="" className="w-8 h-8 object-contain rounded-md" />
                      <span>E-Swachh</span>
                    </SheetTitle>
                    <SheetDescription className="text-xs text-slate-500 dark:text-slate-400">
                      National Cleanliness Grid
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="flex flex-col gap-5 mt-4">
                    {user ? (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-3 mb-2">
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest">Logged in as</p>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{user.displayName || user.email || 'Citizen'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button asChild size="sm" variant="outline" className="w-full text-xs font-bold uppercase tracking-wider h-9 border-slate-200 dark:border-slate-800">
                            <Link href="/profile">Profile</Link>
                          </Button>
                          <Button asChild size="sm" className="w-full text-xs font-bold uppercase tracking-wider h-9 bg-cyan-600 hover:bg-cyan-700 text-white border-none shadow-sm">
                            <Link href="/dashboard">Portal</Link>
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    <Link href="#features" className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors py-1.5 border-b border-slate-100 dark:border-slate-900">
                      Features
                    </Link>
                    <Link href="#categories" className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors py-1.5 border-b border-slate-100 dark:border-slate-900">
                      Categories
                    </Link>
                    <Link href="#dashboard" className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors py-1.5 border-b border-slate-100 dark:border-slate-900">
                      Preview
                    </Link>
                    <Link href="#help" className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors py-1.5 border-b border-slate-100 dark:border-slate-900">
                      Help Center
                    </Link>
                    <Link href="/map" className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors py-1.5 border-b border-slate-100 dark:border-slate-900 flex items-center gap-1.5">
                      <Globe size={14} className="text-cyan-600 animate-spin-slow" /> Impact Map
                    </Link>

                    <div className="pt-6 mt-auto">
                      {user ? (
                        <Button onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-wider text-xs py-5">
                          <LogOut className="mr-2 h-4 w-4" /> Logout
                        </Button>
                      ) : (
                        <Button asChild className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold uppercase tracking-wider text-xs py-5">
                          <Link href="/login">Login</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. FULLSCREEN HERO SLIDES WITH FRAME MOTION */}
      <section className="relative h-screen w-full overflow-hidden bg-slate-950">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `linear-gradient(rgba(10, 35, 40, 0.7), rgba(8, 20, 24, 0.85)), url('${slides[activeSlide].image}')` 
            }}
          />
        </AnimatePresence>

        {/* Slides Content */}
        <div className="absolute inset-0 z-10 flex items-center">
          <div className="container mx-auto px-6 text-start">
            <div className="max-w-3xl space-y-6">
              <motion.div 
                key={`tag-${activeSlide}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-bold uppercase tracking-widest"
              >
                <Globe size={13} className="animate-spin-slow" /> {slides[activeSlide].tag}
              </motion.div>
              
              <motion.h1 
                key={`title-${activeSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-4xl sm:text-5xl lg:text-7.5xl font-headline font-extrabold text-white leading-none tracking-tight font-sans"
                style={{ fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)" }}
              >
                {slides[activeSlide].title}
              </motion.h1>
              
              <motion.p 
                key={`sub-${activeSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed"
              >
                {slides[activeSlide].subtitle}
              </motion.p>
              
              <motion.div 
                key={`acts-${activeSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="flex flex-wrap gap-4 pt-4"
              >
                <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-none px-8 py-6 uppercase tracking-wider text-xs" asChild>
                  <Link href="/report">
                    <PlusCircle className="mr-2 h-4 w-4" /> Report Grievance
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="border-white/25 text-white hover:bg-white/10 rounded-none px-8 py-6 uppercase tracking-wider text-xs bg-transparent" asChild>
                  <Link href="/map">
                    Impact Dashboard
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Slide Controls */}
        <div className="absolute bottom-10 left-6 right-6 z-20 flex justify-between items-center max-w-7xl mx-auto">
          {/* Pagination Indicators */}
          <div className="flex gap-3">
            {slides.map((_, idx) => (
              <button 
                key={idx} 
                className={`h-1.5 transition-all duration-300 ${activeSlide === idx ? 'w-10 bg-cyan-500' : 'w-4 bg-white/20 hover:bg-white/45'}`}
                onClick={() => setActiveSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
          
          {/* Direction Buttons */}
          <div className="flex gap-2">
            <button 
              className="w-10 h-10 border border-white/20 rounded-none flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              onClick={prevSlide}
              aria-label="Previous Slide"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              className="w-10 h-10 border border-white/20 rounded-none flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              onClick={nextSlide}
              aria-label="Next Slide"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* 3. CORE INTEL SECTIONS (CLEAN CORPORATE) */}
      <main className="bg-white">
        
        {/* Features Section */}
        <section id="features" className="py-24 border-bottom bg-white relative">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-0 border-y border-x border-slate-100 shadow-sm rounded-none">
              
              <div className="p-10 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-between hover:bg-slate-50/50 transition-colors group">
                <div>
                  <div className="w-10 h-10 bg-cyan-50 text-cyan-600 flex items-center justify-center mb-8">
                    <Computer className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-headline font-bold mb-4 text-slate-900 tracking-tight">Verified Grievance Auditing</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">Simulated AI validation categorizes, prioritizing issues instantly before routing tickets directly to municipal zones.</p>
                </div>
                <Link href={user ? "/report?audit=true" : "/login"} className="inline-flex items-center gap-1 text-xs uppercase tracking-wider font-bold text-cyan-600 hover:text-cyan-700 mt-4 transition-colors">
                  Start Audit <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>

              <div className="p-10 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-between hover:bg-slate-50/50 transition-colors group">
                <div>
                  <div className="w-10 h-10 bg-cyan-50 text-cyan-600 flex items-center justify-center mb-8">
                    <Recycle className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-headline font-bold mb-4 text-slate-900 tracking-tight">Geo-Spatial Watch Tracking</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">Interactive Leaflet mapping lets citizens pins coordinates and sync live browser geolocations transparently.</p>
                </div>
                <Link href="/map" className="inline-flex items-center gap-1 text-xs uppercase tracking-wider font-bold text-cyan-600 hover:text-cyan-700 mt-4 transition-colors">
                  Explore Map <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>

              <div className="p-10 flex flex-col justify-between hover:bg-slate-50/50 transition-colors group">
                <div>
                  <div className="w-10 h-10 bg-cyan-50 text-cyan-600 flex items-center justify-center mb-8">
                    <HandPlatter className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-headline font-bold mb-4 text-slate-900 tracking-tight">Community Watch Upvoting</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">Promote neighbor issues inside the dashboard. Highly supported concerns gain a dynamic Trending status priority.</p>
                </div>
                <Link href={user ? "/dashboard?tab=community-watch" : "/login"} className="inline-flex items-center gap-1 text-xs uppercase tracking-wider font-bold text-cyan-600 hover:text-cyan-700 mt-4 transition-colors">
                  Join Watch <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>

               <div className="p-10 flex flex-col justify-between hover:bg-slate-50/50 transition-colors group">
                <div>
                  <div className="w-10 h-10 bg-cyan-50 text-cyan-600 flex items-center justify-center mb-8">
                    <CopyCheckIcon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-headline font-bold mb-4 text-slate-900 tracking-tight">Smart Issue Detection</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">AI-powered image analysis identifies waste types and urgency levels automatically.</p>
                </div>
                <Link href="/login" className="inline-flex items-center gap-1 text-xs uppercase tracking-wider font-bold text-cyan-600 hover:text-cyan-700 mt-4 transition-colors">
                  Analyze Report <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>

              <div className="p-10 flex flex-col justify-between hover:bg-slate-50/50 transition-colors group">
                <div>
                  <div className="w-10 h-10 bg-cyan-50 text-cyan-600 flex items-center justify-center mb-8">
                    <MapPinCheckInsideIcon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-headline font-bold mb-4 text-slate-900 tracking-tight">Nearby Dustbin Locator</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">Find nearby waste disposal and recycling centers using GPS.</p>
                </div>
                <Link href="/map" className="inline-flex items-center gap-1 text-xs uppercase tracking-wider font-bold text-cyan-600 hover:text-cyan-700 mt-4 transition-colors">
                  FIND LOCATIONS <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>


              <div className="p-10 flex flex-col justify-between hover:bg-slate-50/50 transition-colors group">
                <div>
                  <div className="w-10 h-10 bg-cyan-50 text-cyan-600 flex items-center justify-center mb-8">
                    <TreesIcon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-headline font-bold mb-4 text-slate-900 tracking-tight">Waste Segregation Guide</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">Interactive guides helping citizens separate biodegradable and non-biodegradable waste.</p>
                </div>
                <Link href="/segregation" className="inline-flex items-center gap-1 text-xs uppercase tracking-wider font-bold text-cyan-600 hover:text-cyan-700 mt-4 transition-colors">
                  learn more <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>


            </div>
          </div>
        </section>

        {/* 4. ISSUE CATEGORIES GRID */}
        <section id="categories" className="py-24 bg-slate-50/50 border-t border-slate-100">
          <div className="container mx-auto px-6 text-center">
            <div className="max-w-2xl mx-auto mb-16">
              <span className="text-cyan-600 text-xs font-bold uppercase tracking-widest d-block mb-2.5">Grievance Infrastructure</span>
              <h2 className="text-3xl lg:text-4xl font-headline font-bold text-slate-900 tracking-tight">Active Reporting Categories</h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto mt-3">Select the appropriate category matching your neighborhood issue to ensure optimized department dispatch routing.</p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-start">
              {categories.map((cat, idx) => (
                <div key={idx} className="p-8 bg-white border border-slate-200/60 hover:border-cyan-500/40 hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="w-11 h-11 bg-slate-50 text-cyan-600 flex items-center justify-center mb-6 border border-slate-100 transition-colors group-hover:bg-cyan-50">
                      {cat.icon}
                    </div>
                    <h4 className="text-lg font-headline font-bold mb-3 text-slate-900 group-hover:text-cyan-600 transition-colors">{cat.name}</h4>
                    <p className="text-slate-500 text-xs leading-relaxed mb-6">{cat.desc}</p>
                  </div>
                  <Link href="/report" className="inline-flex items-center gap-1.5 text-xxs uppercase tracking-wider font-bold text-slate-700 group-hover:text-cyan-600 transition-colors mt-auto">
                    Report Issue <ChevronRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. INTERACTIVE DASHBOARD PREVIEW & ANALYTICS */}
        <section id="dashboard" className="py-24 bg-white border-t border-slate-100">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              
              {/* Text Description */}
              <div className="lg:col-span-5 space-y-6 text-start">
                <span className="text-cyan-600 text-xs font-bold uppercase tracking-widest">Real-time Accountability</span>
                <h2 className="text-3xl lg:text-4xl font-headline font-bold text-slate-900 leading-tight">Interactive Smart Cities Monitoring</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Experience municipal transparency at scale. Our unified portal integrates automated AI dispatch pipelines and geospatial maps to route coordinates under dedicated Service Level Agreements (SLAs).
                </p>
                <div className="space-y-4 pt-2">
                  <div className="flex gap-3 align-items-start">
                    <div className="bg-cyan-50 text-cyan-600 p-2 rounded-none mt-1">
                      <ShieldCheck className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-slate-900">SLA Violation Escalation</h5>
                      <p className="text-slate-400 text-xs leading-normal mt-0.5">Issues exceeding target windows are automatically flagged as critical, triggering supervisor alerts.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 align-items-start">
                    <div className="bg-cyan-50 text-cyan-600 p-2 rounded-none mt-1">
                      <Sparkles className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-slate-900">Gamified Civic Support</h5>
                      <p className="text-slate-400 text-xs leading-normal mt-0.5">Citizens earn +10 points for validated reports and +20 points when tickets resolve successfully.</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <Button asChild size="lg" className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-none px-6 uppercase tracking-wider text-xs">
                    <Link href="/login">Access Portal Dashboard</Link>
                  </Button>
                </div>
              </div>

              {/* Graphic Mockup Dashboard Panel */}
              <div className="lg:col-span-7 relative">
                <div className="rounded-none border border-slate-200/80 bg-slate-50 p-3 shadow-premium">
                  <div className="bg-white border rounded-none p-5 text-start space-y-5">
                    
                    {/* Mockup Header */}
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center border-bottom pb-4 gap-3">
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-cyan-600 text-white rounded-pill px-2.5 py-0.5 text-xxs font-bold tracking-widest uppercase">Ward-14</span>
                          <span className="text-xxs text-muted uppercase tracking-wider font-weight-bold">Live Grid Monitor</span>
                        </div>
                        <h4 className="font-headline font-bold text-base text-slate-900 mt-1">Municipal Analytics Panel</h4>
                      </div>
                      <div className="d-inline-flex align-items-center gap-1 text-success text-xxs font-weight-bold uppercase bg-success bg-opacity-5 border border-success border-opacity-10 px-2 py-1 rounded-pill">
                        <Activity size={10} className="animate-pulse" /> AI Dispatcher Online
                      </div>
                    </div>

                    {/* Content Section: Charts Row */}
                    <div className="row g-4">
                      
                      {/* SLA Circle metrics */}
                      <div className="col-sm-5">
                        <div className="border border-slate-100 p-4 text-center hover:shadow-subtle transition-shadow">
                          <span className="text-xxs uppercase text-muted font-weight-bold">SLA Compliance Rate</span>
                          
                          {/* Circle mockup */}
                          <div className="position-relative d-flex justify-content-center my-3.5">
                            <svg className="w-24 h-24" viewBox="0 0 36 36">
                              <path className="text-slate-100" strokeWidth="2.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                              <path className="text-cyan-600" strokeDasharray="94.2, 100" strokeWidth="2.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                            <div className="position-absolute top-50 start-50 translate-middle">
                              <span className="font-headline font-extrabold text-slate-900 text-base">94.2%</span>
                            </div>
                          </div>
                          
                          <span className="text-xxs text-slate-400"><strong className="text-success">98 resolved</strong> / 104 registered</span>
                        </div>
                      </div>

                      {/* Line chart and Dispatch logs */}
                      <div className="col-sm-7">
                        <div className="border border-slate-100 p-4 h-100 hover:shadow-subtle transition-shadow d-flex flex-column justify-content-between">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-xxs uppercase text-muted font-weight-bold">Resolved Grievance SLA Chart</span>
                            <span className="text-xxs font-weight-bold text-cyan-600">-24% Open tickets</span>
                          </div>
                          
                          {/* Simulated SVG Line Chart */}
                          <div className="h-16 w-100 my-2 relative">
                            <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                              <defs>
                                <linearGradient id="cyan-glow" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="rgb(8, 145, 178)" stopOpacity="0.25" />
                                  <stop offset="100%" stopColor="rgb(8, 145, 178)" stopOpacity="0.0" />
                                </linearGradient>
                              </defs>
                              {/* Filled gradient under line */}
                              <path d="M 0,38 Q 20,28 40,32 T 80,12 T 100,16 L 100,40 L 0,40 Z" fill="url(#cyan-glow)" />
                              {/* Glowing vector line */}
                              <path d="M 0,38 Q 20,28 40,32 T 80,12 T 100,16" fill="none" stroke="rgb(8, 145, 178)" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </div>

                          <div className="d-flex justify-content-between text-xxs text-slate-400 uppercase tracking-widest pt-2 border-top">
                            <span>Mon</span>
                            <span>Wed</span>
                            <span>Fri</span>
                            <span>Sun</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Automated Dispatch logs Mockup */}
                    <div className="border border-slate-100 p-4">
                      <span className="text-xxs uppercase text-muted font-weight-bold d-block mb-3">Live Dispatch Logs (Simulated)</span>
                      <div className="space-y-2.5">
                        
                        <div className="d-flex align-items-center justify-content-between text-xs p-2.5 bg-slate-50 border-start border-3 border-danger rounded-none">
                          <div className="d-flex align-items-center gap-2 truncate">
                            <CheckCircle2 size={13} className="text-danger" />
                            <strong className="text-slate-900 font-bold truncate">Water leak at Market St</strong>
                          </div>
                          <div className="d-flex align-items-center gap-1.5 shrink-0 text-xxs uppercase font-weight-bold text-slate-500">
                            <Clock size={11} /> 12h SLA • Routed
                          </div>
                        </div>

                        <div className="d-flex align-items-center justify-content-between text-xs p-2.5 bg-slate-50 border-start border-3 border-warning rounded-none">
                          <div className="d-flex align-items-center gap-2 truncate">
                            <CheckCircle2 size={13} className="text-warning" />
                            <strong className="text-slate-900 font-bold truncate">Streetlight Outage, Ward 3</strong>
                          </div>
                          <div className="d-flex align-items-center gap-1.5 shrink-0 text-xxs uppercase font-weight-bold text-slate-500">
                            <Clock size={11} /> 48h SLA • Dispatch
                          </div>
                        </div>

                        <div className="d-flex align-items-center justify-content-between text-xs p-2.5 bg-slate-50 border-start border-3 border-success rounded-none">
                          <div className="d-flex align-items-center gap-2 truncate">
                            <CheckCircle2 size={13} className="text-success" />
                            <strong className="text-slate-900 font-bold truncate">Garbage Heap Dolores St</strong>
                          </div>
                          <div className="d-flex align-items-center gap-1.5 shrink-0 text-xxs uppercase font-weight-bold text-success">
                            RESOLVED • +20 Points
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 6. SMART CITY MISSION ADVOCACY */}
        <section className="py-20 border-t border-slate-100 bg-slate-50/50">
          <div className="container mx-auto px-6 text-center">
            <div className="max-w-3xl mx-auto space-y-6">
              <span className="text-cyan-600 text-xs font-bold uppercase tracking-widest">Digital India Alignment</span>
              <h2 className="text-3xl font-headline font-bold text-slate-900 tracking-tight">Supported by the Smart Cities Mission</h2>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xl mx-auto">
                E-Swachh coordinates directly with national Urban Local Body (ULB) initiatives, building clean, safe, and transparent neighborhoods through modern information technology frameworks.
              </p>
              <div className="flex justify-content-center gap-6 pt-4 flex-wrap">
                <div className="d-inline-flex align-items-center gap-2 text-xs uppercase tracking-wider font-bold text-slate-700">
                  <ShieldCheck size={16} className="text-cyan-600" /> SECURE DATA VAULT
                </div>
                <div className="d-inline-flex align-items-center gap-2 text-xs uppercase tracking-wider font-bold text-slate-700">
                  <GlassWaterIcon size={16} className="text-cyan-600" /> 100% TRANSPARENT TRACKING
                </div>
                 <div className="d-inline-flex align-items-center gap-2 text-xs uppercase tracking-wider font-bold text-slate-700">
                  <TimerIcon size={16} className="text-cyan-600" /> REAL-TIME MONITORING
                </div>
                 <div className="d-inline-flex align-items-center gap-2 text-xs uppercase tracking-wider font-bold text-slate-700">
                  <EarthLockIcon size={16} className="text-cyan-600" /> ECO-DRIVEN INNOVATION
                </div>
                 <div className="d-inline-flex align-items-center gap-2 text-xs uppercase tracking-wider font-bold text-slate-700">
                  <BuildingIcon size={16} className="text-cyan-600" /> MUNICIPAL INTEGRATION
                </div>
                 <div className="d-inline-flex align-items-center gap-2 text-xs uppercase tracking-wider font-bold text-slate-700">
                  <HandshakeIcon size={16} className="text-cyan-600" /> CITIZEN PARTICIPATION
                </div>
                 <div className="d-inline-flex align-items-center gap-2 text-xs uppercase tracking-wider font-bold text-slate-700">
                  <LeafIcon size={16} className="text-cyan-600" /> CLEAN CITY INTELIGENCE
                </div>
                 <div className="d-inline-flex align-items-center gap-2 text-xs uppercase tracking-wider font-bold text-slate-700">
                  <ComputerIcon size={16} className="text-cyan-600" /> DIGITAL INDIA READY
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. MODERN INTERACTIVE FAQS / HELP CENTER */}
        <section id="help" className="py-24 border-t border-slate-100 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <span className="text-cyan-600 text-xs font-bold uppercase tracking-widest block mb-2.5">Help & FAQ Center</span>
              <h2 className="text-3xl lg:text-4xl font-headline font-bold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto mt-3">Find instant, professional answers to expected questions about the   E-Swachh civic operations framework.</p>
            </div>
            
            <div className="max-w-3xl mx-auto space-y-4">
              <FaqItem 
                question="How does E-Swachh validate reports?" 
                answer="E-Swachh utilizes simulated AI validation frameworks to audit coordinates and sanitize incoming tickets. Upon validation, grievances are cataloged geo-spatially and instantly dispatched to the respective ward commissioner for targeted operational execution."
              />
              <FaqItem 
                question="What happens if a civic issue exceeds the specified SLA window?" 
                answer="If an active issue surpasses its allocated Service Level Agreement (SLA) target timeframe, our tracking system automatically updates its status to 'Critical Escalation'. This triggers automated supervisor notifications and prioritizes dispatch routing schedules."
              />
              <FaqItem 
                question="How do community upvoting and trending points function?" 
                answer="Citizens can view pending complaints in their neighborhood using the GIS impact map and vote for important concerns on their Portal Dashboard. Highly upvoted complaints are updated to 'Trending' priority to accelerate local resolution. Registered citizens earn +10 points for filing validated reports and +20 points when their reports resolve successfully, promoting positive civic collaboration."
              />
              <FaqItem 
                question="Is citizen personal data kept confidential?" 
                answer="Absolutely. All citizen registration forms and telephone contacts are highly encrypted and handled under secure governance parameters. Public GIS map pins and dispatch tickers display only localized issue summaries, keeping reporter identity completely anonymous."
              />
              <FaqItem 
                question="How can I track the live operational dispatch details for my report?" 
                answer="Each registered grievance receives an active digital ticket code. By logging into the unified Portal Dashboard, users can view active progress timeline bars, SLA countdown gauges, and direct supervisor assignments in real time."
              />
            </div>
          </div>
        </section>

      </main>

      {/* 8. SPACIOUS CHARCOAL MULTI-COLUMN FOOTER */}
      <footer className="bg-slate-950 text-white border-t border-slate-900 py-16 shrink-0 mt-auto">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 text-start">
            
            {/* Description Column */}
            <div className="col-span-12 lg:col-span-4 space-y-5">
              <Link href="/" className="flex items-center gap-2.5 group">
                <img 
                  src="/logo.png" 
                  alt="E-Swachh Logo" 
                  className="w-8 h-8 object-contain rounded-md transition-transform group-hover:scale-105"
                />
                <span className="text-lg font-headline font-extrabold tracking-wider text-white">
                  E-Swachh
                </span>
              </Link>
              <h6 className="text-xxs uppercase tracking-widest text-cyan-400 font-bold border-bottom border-white/10 pb-2.5 inline-block w-75">National Cleanliness Grid</h6>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                E-Swachh is a futuristic civic intelligence platform designed under the Digital India mission to streamline city maintenance tracking and coordinate grievance ticketing transparently.
              </p>
            </div>

            {/* Quick Links Column */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-3 space-y-4">
              <h6 className="text-xxs uppercase tracking-widest text-cyan-400 font-bold border-bottom border-white/10 pb-2.5 inline-block w-75">Grievance Portal</h6>
              <ul className="list-none p-0 flex flex-col gap-2.5 text-xs">
                <li><Link href="/" className="text-slate-400 hover:text-white transition-colors text-decoration-none">Homepage</Link></li>
                <li><Link href="/map" className="text-slate-400 hover:text-white transition-colors text-decoration-none">Live Heatmap Map</Link></li>
                <li><Link href="/login" className="text-slate-400 hover:text-white transition-colors text-decoration-none font-weight-bold text-cyan-400">Portal Dashboard</Link></li>
                <li><Link href="/report" className="text-slate-400 hover:text-white transition-colors text-decoration-none">Report New Grievance</Link></li>
              </ul>
            </div>

            {/* Important Documentation Column */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-3 space-y-4">
              <h6 className="text-xxs uppercase tracking-widest text-cyan-400 font-bold border-bottom border-white/10 pb-2.5 inline-block w-75">Resources & Hubs</h6>
              <ul className="list-none p-0 flex flex-col gap-3 text-xs">
                <li className="flex items-center gap-2 text-slate-400">
                  <BookOpen size={12} className="text-cyan-500" />
                  <Link href="#help" className="text-slate-400 hover:text-white transition-colors text-decoration-none">Help Center & FAQ Documentation</Link>
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Globe size={12} className="text-cyan-500" />
                  <span className="text-slate-400">Official Partner of Smart Cities Mission</span>
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <ShieldCheck size={12} className="text-cyan-500" />
                  <span className="text-slate-400">Certified by Urban Development Administration</span>
                </li>
              </ul>
            </div>

            {/* Developer Socials & Contact Hub */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-2 space-y-4">
              <h6 className="text-xxs uppercase tracking-widest text-cyan-400 font-bold border-bottom border-white/10 pb-2.5 inline-block w-75">Find us</h6>
              <div className="flex items-center gap-4 pt-1">
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-slate-400 hover:text-white hover:scale-110 transition-all duration-200"
                  title="LinkedIn Profile"
                >
                  <Linkedin size={20} />
                </a>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-slate-400 hover:text-white hover:scale-110 transition-all duration-200"
                  title="Instagram Feed"
                >
                  <Instagram size={20} />
                </a>
                <a 
                  href="https://github.com/thechampgit/E-SWACHH" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-slate-400 hover:text-white hover:scale-110 transition-all duration-200"
                  title="GitHub Code"
                >
                  <Github size={20} />
                </a>
                <button 
                  onClick={handleEmailClick} 
                  className="bg-transparent border-none p-0 text-slate-400 hover:text-white hover:scale-110 transition-all duration-200 cursor-pointer"
                  title="Contact Us"
                >
                  <Mail size={20} />
                </button>
              </div>
            </div>

          </div>

          {/* Copyright Band */}
          <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 gap-4">
            <p className="mb-0 tracking-wider">
              Copyright © 2026 | E-Swachh Grid Admin All Rights Reserved | Built for Digital India and Modern Urban Management 
            </p>
             
            <div className="flex gap-4">
              <span className="text-slate-600 hover:text-slate-400 cursor-pointer">Security Policy</span>
              <span className="text-slate-600 hover:text-slate-400 cursor-pointer">Privacy Guidelines</span>
              <span className="text-slate-600 hover:text-slate-400 cursor-pointer">API Agreement</span>
            </div>
          </div>

        </div>
      </footer>

      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 z-[200]">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-headline font-bold text-slate-900 dark:text-slate-100">
              Send Email / Complaint
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Submit your queries or complaints directly to the developer at <strong className="text-cyan-600 dark:text-cyan-400 font-semibold">champgmail@gmail.com</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendEmail} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label htmlFor="email-sender" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350">
                Your Email Address
              </label>
              <input 
                id="email-sender"
                type="email"
                placeholder="you@example.com"
                value={emailSender}
                onChange={(e) => setEmailSender(e.target.value)}
                required
                className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:border-transparent rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email-subject" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350">
                Subject
              </label>
              <input 
                id="email-subject"
                type="text"
                placeholder="e.g. Garbage collection delay in ward 4"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                required
                className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:border-transparent rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email-body" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350">
                Message / Complaint Details
              </label>
              <textarea 
                id="email-body"
                placeholder="Describe your issue or write your email message here..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                required
                rows={4}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:border-transparent rounded-lg resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setIsEmailDialogOpen(false)}
                className="h-10 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="h-10 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
              >
                Send Email
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}