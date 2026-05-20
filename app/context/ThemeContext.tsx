'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface ThemePreset {
  id: string;
  name: string;
  base: string;
  sidebar: string;
  emoji: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'violet',  name: 'Violet', base: '#6366F1', sidebar: '#FAFAFA',  emoji: '💜' },
  { id: 'indigo',  name: 'Indigo', base: '#4F46E5', sidebar: '#F5F5FF',  emoji: '🔵' },
  { id: 'blue',    name: 'Blue',   base: '#3B82F6', sidebar: '#F0F9FF',  emoji: '💙' },
  { id: 'teal',    name: 'Teal',   base: '#0EA5E9', sidebar: '#F0FDFA',  emoji: '🩵' },
  { id: 'emerald', name: 'Forest', base: '#10B981', sidebar: '#F0FDF4',  emoji: '💚' },
  { id: 'amber',   name: 'Amber',  base: '#F59E0B', sidebar: '#FFFBEB',  emoji: '🟡' },
  { id: 'rose',    name: 'Rose',   base: '#F43F5E', sidebar: '#FFF1F2',  emoji: '🌹' },
  { id: 'slate',   name: 'Slate',  base: '#64748B', sidebar: '#F8FAFC',  emoji: '🩶' },
];

const DEFAULT_PRESET_ID = 'violet';

interface StoredTheme {
  presetId: string;
  customColor: string | null;
  isDark: boolean;
}

const STORAGE_KEY = 'kai-theme';

function loadStoredTheme(): StoredTheme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('[ThemeProvider] Failed to load theme from localStorage:', err);
  }
  return { presetId: DEFAULT_PRESET_ID, customColor: null, isDark: false };
}

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
  if      (h < 60)  { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else              { r = c; b = x; }
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

function applyTheme(accent: string, sidebar: string, isDark: boolean) {
  const p = generatePalette(accent);

  // Inject CSS variables so components can use var(--accent-*) regardless of preset name
  let el = document.getElementById('kai-theme-vars');
  if (!el) {
    el = document.createElement('style');
    el.id = 'kai-theme-vars';
    document.head.appendChild(el);
  }
  el.textContent = `
    :root {
      --accent-50:  ${p['50']};
      --accent-100: ${p['100']};
      --accent-200: ${p['200']};
      --accent-300: ${p['300']};
      --accent-400: ${p['400']};
      --accent-500: ${p['500']};
      --accent-600: ${p['600']};
      --accent-700: ${p['700']};
      --accent-800: ${p['800']};
      --accent-900: ${p['900']};
      --accent-950: ${p['950']};
      --kai-sidebar-bg: ${sidebar};
      --kai-accent: ${accent};
    }
  `;

  document.documentElement.classList.toggle('dark', isDark);
}

// ── Context ────────────────────────────────────────────────────────────────

interface ThemeContextType {
  activePreset: ThemePreset;
  customColor: string | null;
  isDark: boolean;
  accentColor: string;
  setPreset: (id: string) => void;
  setCustomColor: (hex: string) => void;
  toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize directly from localStorage to avoid flash of default theme on load
  const [activePresetId, setActivePresetId] = useState<string>(() => loadStoredTheme().presetId);
  const [customColor, setCustomColor]        = useState<string | null>(() => loadStoredTheme().customColor);
  const [isDark, setIsDark]                  = useState<boolean>(() => loadStoredTheme().isDark);

  const activePreset = THEME_PRESETS.find(p => p.id === activePresetId) ?? THEME_PRESETS[0];
  const accentColor  = customColor ?? activePreset.base;

  useEffect(() => {
    applyTheme(accentColor, activePreset.sidebar, isDark);
  }, [accentColor, activePreset.sidebar, isDark]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ presetId: activePresetId, customColor, isDark }));
  }, [activePresetId, customColor, isDark]);

  const setPreset = useCallback((id: string) => {
    setActivePresetId(id);
    setCustomColor(null);
  }, []);

  const toggleDark = useCallback(() => {
    setIsDark(prev => !prev);
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
