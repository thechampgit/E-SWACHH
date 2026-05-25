import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
import { AiChatbot } from '@/components/AiChatbot';
import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'CivicPulse | Smart City Governance',
  description: 'CivicPulse is a smart civic issue reporting and monitoring platform that enables citizens and administrators to collaborate in resolving public infrastructure and community issues efficiently in real time.',
  themeColor: '#2563eb',
  manifest: '/manifest.json',
  openGraph: {
    title: 'CivicPulse | Smart City Governance',
    description: 'Report, track, and resolve civic issues in real-time.',
    type: 'website',
    images: [
      {
        url: 'https://picsum.photos/seed/civic-preview/1200/630',
        width: 1200,
        height: 630,
        alt: 'CivicPulse Preview',
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background">
        <GlobalErrorBoundary>
          <FirebaseClientProvider>
            {children}
            <AiChatbot />
            <Toaster />
          </FirebaseClientProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
