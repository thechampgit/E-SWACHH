'use client';

import Link from 'next/link';
import { AuthCard } from '@/components/AuthCard';
import { ArrowLeft } from 'lucide-react';
import React, { Suspense } from 'react';

export default function SignupPage() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center overflow-y-auto"
      style={{ 
        backgroundImage: `linear-gradient(rgba(10, 30, 35, 0.75), rgba(8, 15, 20, 0.85)), url('/auth_bg.jpg')`
      }}
    >
      {/* Top Floating Sleek Navigation Link */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2 border border-white/20 text-white/90 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-all duration-300 text-xs font-bold uppercase tracking-wider rounded-none"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
      </Link>
      
      {/* Centered Auth Card Scaffold with Suspense */}
      <div className="w-full max-w-lg my-12 z-10">
        <Suspense fallback={
          <div className="w-full max-w-lg border border-slate-200/80 bg-white/95 backdrop-blur-md shadow-2xl p-12 text-center text-slate-600 font-sans font-bold">
            Loading security modules...
          </div>
        }>
          <AuthCard defaultMode="signup" />
        </Suspense>
      </div>
    </div>
  );
}
