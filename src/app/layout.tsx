"use client"

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <title>CivicPulse | Smart City Governance</title>
        <meta name="description" content="CivicPulse is a smart civic issue reporting and monitoring platform that enables citizens and administrators to collaborate in resolving public infrastructure and community issues efficiently in real time." />
        <meta name="theme-color" content="#2563eb" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        
        {/* Open Graph */}
        <meta property="og:title" content="CivicPulse | Smart City Governance" />
        <meta property="og:description" content="Report, track, and resolve civic issues in real-time." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://picsum.photos/seed/civic-preview/1200/630" />
      </head>
      <body className="font-body antialiased bg-background">
        <GlobalErrorBoundary>
          <FirebaseClientProvider>
            {children}
            <Toaster />
          </FirebaseClientProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
