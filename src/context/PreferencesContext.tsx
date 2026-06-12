'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations } from '@/lib/translations';

type Language = 'en' | 'hi' | 'bn' | 'mai';
type Theme = 'light' | 'dark' | 'system';

interface PreferencesContextType {
  lang: Language;
  theme: Theme;
  setLang: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  t: any;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>('en');
  const [theme, setThemeState] = useState<Theme>('light');

  // Load initial preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('eswachh-language') as Language;
      if (savedLang && ['en', 'hi', 'bn', 'mai'].includes(savedLang)) {
        setLangState(savedLang);
      } else {
        // Fallback check for capital case just in case
        const legacyLang = localStorage.getItem('Eswachh-language') as Language;
        if (legacyLang && ['en', 'hi', 'bn', 'mai'].includes(legacyLang)) {
          setLangState(legacyLang);
          localStorage.setItem('eswachh-language', legacyLang);
          localStorage.removeItem('Eswachh-language');
        }
      }

      const savedTheme = localStorage.getItem('eswachh-theme') as Theme;
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeState(savedTheme);
      }
    }
  }, []);

  const applyTheme = (targetTheme: Theme) => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;

    if (targetTheme === 'dark') {
      root.classList.add('dark');
    } else if (targetTheme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  // Sync theme changes to document and localStorage
  useEffect(() => {
    applyTheme(theme);

    // Watch for system preference changes if theme is system
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      
      // Modern browsers
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('eswachh-language', newLang);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('eswachh-theme', newTheme);
  };

  // Select the appropriate translations dictionary based on the language
  const t = translations[lang] || translations.en;

  return (
    <PreferencesContext.Provider value={{ lang, theme, setLang, setTheme, t }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
