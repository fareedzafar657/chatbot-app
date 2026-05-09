'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface ThemePreset {
  id: string;
  name: string;
  base: string; // hex for the "600" shade
  sidebar: string;
  emoji: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'violet', name: 'Violet', base: '#6366F1', sidebar: '#FAFAFA', emoji: '💜' },
  { id: 'indigo', name: 'Indigo', base: '#4F46E5', sidebar: '#F5F5FF', emoji: '🔵' },
  { id: 'blue', name: 'Blue', base: '#3B82F6', sidebar: '#F0F9FF', emoji: '💙' },
  { id: 'teal', name: 'Teal', base: '#0EA5E9', sidebar: '#F0FDFA', emoji: '🩵' },
  { id: 'emerald', name: 'Forest', base: '#10B981', sidebar: '#F0FDF4', emoji: '💚' },
  { id: 'amber', name: 'Amber', base: '#F59E0B', sidebar: '#FFFBEB', emoji: '🟡' },
  { id: 'rose', name: 'Rose', base: '#F43F5E', sidebar: '#FFF1F2', emoji: '🌹' },
  { id: 'slate', name: 'Slate', base: '#64748B', sidebar: '#F8FAFC', emoji: '🩶' },
];

interface ThemeContextType {
  activePreset: ThemePreset;
  customColor: string | null;
  isDark: boolean;
  accentColor: string; // resolved accent (custom or preset)
  setPreset: (id: string) => void;
  setCustomColor: (hex: string) => void;
  toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// ── Color utilities ────────────────────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const hex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

export function generatePalette(hex: string): Record<string, string> {
  const [h, s] = hexToHsl(hex);
  return {
    '50':  hslToHex(h, Math.min(s * 0.4, 30), 97),
    '100': hslToHex(h, Math.min(s * 0.5, 40), 94),
    '200': hslToHex(h, Math.min(s * 0.6, 50), 88),
    '300': hslToHex(h, s * 0.7, 78),
    '400': hslToHex(h, s * 0.85, 67),
    '500': hslToHex(h, s, 57),
    '600': hex,
    '700': hslToHex(h, s, 40),
    '800': hslToHex(h, s, 30),
    '900': hslToHex(h, s, 22),
    '950': hslToHex(h, s, 14),
  };
}

function injectThemeCSS(accent: string, sidebar: string) {
  const p = generatePalette(accent);
  const css = `
    :root {
      --color-violet-50:  ${p['50']};
      --color-violet-100: ${p['100']};
      --color-violet-200: ${p['200']};
      --color-violet-300: ${p['300']};
      --color-violet-400: ${p['400']};
      --color-violet-500: ${p['500']};
      --color-violet-600: ${p['600']};
      --color-violet-700: ${p['700']};
      --color-violet-800: ${p['800']};
      --color-violet-900: ${p['900']};
      --color-indigo-400: ${p['400']};
      --color-indigo-500: ${p['500']};
      --color-indigo-600: ${p['600']};
      --color-indigo-700: ${p['700']};
      --kai-sidebar-bg: ${sidebar};
      --kai-accent: ${accent};
    }
  `;
  let el = document.getElementById('kai-theme-vars');
  if (!el) {
    el = document.createElement('style');
    el.id = 'kai-theme-vars';
    document.head.appendChild(el);
  }
  el.textContent = css;
}

// ── Provider ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'kai-theme';

interface StoredTheme {
  presetId: string;
  customColor: string | null;
  isDark: boolean;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [activePresetId, setActivePresetId] = useState('violet');
  const [customColor, setCustomColorState] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  const activePreset = THEME_PRESETS.find(p => p.id === activePresetId) ?? THEME_PRESETS[0];
  const accentColor = customColor ?? activePreset.base;

  // Apply theme whenever it changes
  useEffect(() => {
    injectThemeCSS(accentColor, activePreset.sidebar);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [accentColor, activePreset.sidebar, isDark]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored: StoredTheme = JSON.parse(raw);
        if (stored.presetId) setActivePresetId(stored.presetId);
        if (stored.customColor) setCustomColorState(stored.customColor);
        if (stored.isDark !== undefined) setIsDark(stored.isDark);
      }
    } catch {}
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ presetId: activePresetId, customColor, isDark }));
  }, [activePresetId, customColor, isDark]);

  const setPreset = useCallback((id: string) => {
    setActivePresetId(id);
    setCustomColorState(null);
  }, []);

  const setCustomColor = useCallback((hex: string) => {
    setCustomColorState(hex);
  }, []);

  const toggleDark = useCallback(() => {
    setIsDark(p => !p);
  }, []);

  return (
    <ThemeContext.Provider value={{ activePreset, customColor, isDark, accentColor, setPreset, setCustomColor, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
