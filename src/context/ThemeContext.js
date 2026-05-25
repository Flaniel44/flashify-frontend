import React, { createContext, useContext, useState, useEffect } from 'react';

const themes = {
  plain: {
    name: 'Plain',
    background: '#ffffff',
    surface: '#f9fafb',
    surfaceAlt: '#f3f4f6',
    border: '#e5e7eb',
    text: '#1e293b',
    textMuted: '#6b7280',
    textLight: '#9ca3af',
    primary: '#2563eb',
    primaryText: '#ffffff',
    success: '#16a34a',
    successBg: '#f0fdf4',
    successBorder: '#86efac',
    warning: '#fef9c3',
    error: '#dc2626',
    errorBg: '#fef2f2',
    errorBorder: '#fecaca',
    cardShadow: '0 4px 24px rgba(0,0,0,0.08)',
    selectedBg: '#dbeafe',
    badge: '#e0e7ff',
  },
  dark: {
    name: 'Dark',
    background: '#0f172a',
    surface: '#1e293b',
    surfaceAlt: '#334155',
    border: '#475569',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    textLight: '#64748b',
    primary: '#3b82f6',
    primaryText: '#ffffff',
    success: '#22c55e',
    successBg: '#14532d',
    successBorder: '#166534',
    warning: '#422006',
    error: '#f87171',
    errorBg: '#450a0a',
    errorBorder: '#7f1d1d',
    cardShadow: '0 4px 24px rgba(0,0,0,0.4)',
    selectedBg: '#1e3a5f',
    badge: '#1e3a5f',
  },
  green: {
    name: 'Pale Green',
    background: '#f0fdf4',
    surface: '#dcfce7',
    surfaceAlt: '#bbf7d0',
    border: '#86efac',
    text: '#14532d',
    textMuted: '#166534',
    textLight: '#4ade80',
    primary: '#16a34a',
    primaryText: '#ffffff',
    success: '#15803d',
    successBg: '#dcfce7',
    successBorder: '#86efac',
    warning: '#fef9c3',
    error: '#dc2626',
    errorBg: '#fef2f2',
    errorBorder: '#fecaca',
    cardShadow: '0 4px 24px rgba(0,0,0,0.06)',
    selectedBg: '#bbf7d0',
    badge: '#bbf7d0',
  },
  pink: {
    name: 'Pale Pink',
    background: '#fff1f2',
    surface: '#ffe4e6',
    surfaceAlt: '#fecdd3',
    border: '#fda4af',
    text: '#881337',
    textMuted: '#9f1239',
    textLight: '#fb7185',
    primary: '#e11d48',
    primaryText: '#ffffff',
    success: '#16a34a',
    successBg: '#f0fdf4',
    successBorder: '#86efac',
    warning: '#fef9c3',
    error: '#dc2626',
    errorBg: '#fef2f2',
    errorBorder: '#fecaca',
    cardShadow: '0 4px 24px rgba(0,0,0,0.06)',
    selectedBg: '#fecdd3',
    badge: '#fecdd3',
  },
  blue: {
    name: 'Pale Blue',
    background: '#eff6ff',
    surface: '#dbeafe',
    surfaceAlt: '#bfdbfe',
    border: '#93c5fd',
    text: '#1e3a8a',
    textMuted: '#1d4ed8',
    textLight: '#60a5fa',
    primary: '#2563eb',
    primaryText: '#ffffff',
    success: '#16a34a',
    successBg: '#f0fdf4',
    successBorder: '#86efac',
    warning: '#fef9c3',
    error: '#dc2626',
    errorBg: '#fef2f2',
    errorBorder: '#fecaca',
    cardShadow: '0 4px 24px rgba(0,0,0,0.06)',
    selectedBg: '#bfdbfe',
    badge: '#bfdbfe',
  }
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(() => {
    return localStorage.getItem('flashify_theme') || 'plain';
  });

  const theme = themes[themeName];

  const setTheme = (name) => {
    setThemeName(name);
    localStorage.setItem('flashify_theme', name);
  };

  useEffect(() => {
    document.body.style.background = theme.background;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}