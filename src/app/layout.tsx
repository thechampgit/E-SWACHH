import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
import { AiChatbot } from '@/components/AiChatbot';
import { Metadata, Viewport } from 'next';
import React from 'react';
import { ClientOnly } from '@/components/ClientOnly';

export const metadata: Metadata = {
  title: 'e-Swachh | Smart Governance',
  description: 'e-Swachh is a smart civic issue reporting and monitoring platform that enables citizens and administrators to collaborate in resolving public infrastructure and community issues efficiently in real time.',
  openGraph: {
    title: 'e-Swachh | Smart Governance',
    description: 'Report, track, and resolve civic issues in real-time.',
    type: 'website',
    images: [
      {
        url: 'https://picsum.photos/seed/serenity-art/1200/630',
        width: 1200,
        height: 630,
        alt: 'e-Swachh Serenity Preview',
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#047857',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var savedTheme = localStorage.getItem('eswachh-theme') || 'light';
              var root = document.documentElement;
              if (savedTheme === 'dark' || (savedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                root.classList.add('dark');
              } else {
                root.classList.remove('dark');
              }
            } catch (e) {}
          })();
        ` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background">
        <GlobalErrorBoundary>
          <ClientOnly>
            <FirebaseClientProvider>
              {children}
              <AiChatbot />
              <Toaster />
            </FirebaseClientProvider>
          </ClientOnly>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
