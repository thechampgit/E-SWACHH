'use client';

import React, { createContext, useContext, useState } from 'react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { useUser } from '@/firebase';

type LogoutConfirmContextType = {
  confirmLogout: (onConfirm: () => void | Promise<void>) => void;
};

const LogoutConfirmContext = createContext<LogoutConfirmContextType | undefined>(undefined);

export function LogoutConfirmProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void | Promise<void>) | null>(null);
  const { user } = useUser();

  const confirmLogout = (onConfirm: () => void | Promise<void>) => {
    setOnConfirmCallback(() => onConfirm);
    setIsOpen(true);
  };

  const handleSaveAndLogout = async () => {
    if (user?.email) {
      localStorage.setItem('savedEmail', user.email);
    }
    if (onConfirmCallback) {
      await onConfirmCallback();
    }
    setIsOpen(false);
  };

  const handleLogoutWithoutSaving = async () => {
    if (onConfirmCallback) {
      await onConfirmCallback();
    }
    setIsOpen(false);
  };

  const accountName = user?.email || user?.displayName || 'your account';

  return (
    <LogoutConfirmContext.Provider value={{ confirmLogout }}>
      {children}
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-slate-50 font-bold font-sans">
              Confirm Logout
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-650 dark:text-slate-400 text-sm mt-2 leading-relaxed">
              We will save the login info for ({accountName}) to your devices cloud backup, so you wont need to enter it on this device next time you log in
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex flex-col sm:flex-row gap-2 justify-end">
            <AlertDialogCancel className="bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border-none font-bold rounded-xl h-10 px-4 text-xs">
              Cancel
            </AlertDialogCancel>
            <button
              onClick={handleLogoutWithoutSaving}
              className="bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-655 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-850 rounded-xl h-10 px-4 text-xs transition-all"
            >
              Not now
            </button>
            <AlertDialogAction
              onClick={handleSaveAndLogout}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl h-10 px-4 text-xs"
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LogoutConfirmContext.Provider>
  );
}

export function useLogoutConfirm() {
  const context = useContext(LogoutConfirmContext);
  if (!context) {
    throw new Error('useLogoutConfirm must be used within a LogoutConfirmProvider');
  }
  return context;
}
