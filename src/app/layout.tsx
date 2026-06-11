import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
import { AiChatbot } from '@/components/AiChatbot';
import { Metadata, Viewport } from 'next';
import React from 'react';
import { ClientOnly } from '@/components/ClientOnly';
import { AuthProvider } from "@/context/AuthContext";
import { LogoutConfirmProvider } from '@/context/LogoutConfirmContext';

export const metadata: Metadata = {
  title: 'E-Swachh | Smart Governance',
  description: 'E-Swachh is a smart civic issue reporting and monitoring platform.',
};

export const viewport: Viewport = {
  themeColor: '#047857',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
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
            `,
          }}
        />
      </head>

      <body className="font-body antialiased bg-background">
        <GlobalErrorBoundary>
          <ClientOnly>
            <FirebaseClientProvider>
              <AuthProvider>
                <LogoutConfirmProvider>
                  {children}
                  <AiChatbot />
                  <Toaster />
                </LogoutConfirmProvider>
              </AuthProvider>
            </FirebaseClientProvider>
          </ClientOnly>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
