'use client';

import { createContext, useContext, useEffect } from 'react';

type ThemeContextType = {
  darkMode: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Light-mode only: ensure the `dark` class is never applied.
    document.documentElement.classList.remove('dark');
    try {
      localStorage.setItem('theme', 'light');
    } catch {
      // ignore
    }
  }, []);

  const darkMode = false;
  const toggleTheme = () => {
    // No-op: app is light-mode only.
    document.documentElement.classList.remove('dark');
    try {
      localStorage.setItem('theme', 'light');
    } catch {
      // ignore
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
