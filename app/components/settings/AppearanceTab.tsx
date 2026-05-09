'use client';

import React, { useState } from 'react';
import { Moon, Sun, Check, Palette } from 'lucide-react';
import { useTheme, THEME_PRESETS, generatePalette } from '@/app/context/ThemeContext';

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="py-6 border-b border-gray-100 last:border-0">
      <div className="flex gap-8">
        <div className="w-[220px] flex-shrink-0">
          <h3 className="text-[13px] font-semibold text-gray-900 mb-0.5">{title}</h3>
          {description && <p className="text-[12px] text-gray-500 leading-relaxed">{description}</p>}
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

function ThemePreview({ accent }: { accent: string }) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
      {/* Sidebar strip */}
      <div className="flex h-28">
        <div className="w-10 flex-shrink-0 bg-[#FAFAFA] border-r border-gray-100 flex flex-col items-center py-2 gap-2">
          <div className="w-5 h-5 rounded-md" style={{ background: accent }} />
          <div className="w-4 h-1 rounded bg-gray-200" />
          <div className="w-4 h-1 rounded bg-gray-200" />
          <div className="w-4 h-1 rounded bg-gray-200" />
        </div>
        {/* Chat area */}
        <div className="flex-1 flex flex-col p-2 gap-1.5 justify-center">
          {/* User message */}
          <div className="flex justify-end">
            <div className="bg-gray-100 rounded-xl px-2 py-1 max-w-[80%]">
              <div className="w-16 h-1.5 rounded bg-gray-300" />
            </div>
          </div>
          {/* AI message */}
          <div className="flex gap-1.5 items-start">
            <div className="w-4 h-4 rounded-md flex-shrink-0" style={{ background: accent }} />
            <div className="flex-1 space-y-1">
              <div className="w-full h-1.5 rounded bg-gray-200" />
              <div className="w-4/5 h-1.5 rounded bg-gray-200" />
              <div className="w-3/5 h-1.5 rounded bg-gray-200" />
            </div>
          </div>
          {/* Input bar */}
          <div className="mt-1 border border-gray-200 rounded-lg px-2 py-1 flex items-center justify-between">
            <div className="w-20 h-1.5 rounded bg-gray-100" />
            <div className="w-4 h-4 rounded-md" style={{ background: accent }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppearanceTab() {
  const { activePreset, customColor, isDark, accentColor, setPreset, setCustomColor, toggleDark } = useTheme();
  const [localCustom, setLocalCustom] = useState(customColor ?? '#6366F1');

  const handleCustomApply = () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(localCustom)) {
      setCustomColor(localCustom);
    }
  };

  return (
    <div>
      {/* Live preview */}
      <Section title="Live Preview" description="See how your theme looks before applying.">
        <div className="max-w-[280px]">
          <ThemePreview accent={accentColor} />
          <div className="mt-2 flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-white shadow" style={{ background: accentColor }} />
            <span className="text-[12px] text-gray-600 font-mono">{accentColor.toUpperCase()}</span>
          </div>
        </div>
      </Section>

      {/* Dark mode */}
      <Section title="Light / Dark Mode" description="Toggle between light and dark interface.">
        <div className="flex gap-3">
          <button
            onClick={() => isDark && toggleDark()}
            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              !isDark ? 'border-violet-400 bg-violet-50' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center">
              <Sun className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="text-[13px] font-medium text-gray-800">Light</div>
              <div className="text-[11px] text-gray-400">Bright & clean</div>
            </div>
            {!isDark && <Check className="w-4 h-4 text-violet-600" />}
          </button>

          <button
            onClick={() => !isDark && toggleDark()}
            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              isDark ? 'border-violet-400 bg-violet-50' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-gray-900 border border-gray-700 shadow-sm flex items-center justify-center">
              <Moon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-[13px] font-medium text-gray-800">Dark</div>
              <div className="text-[11px] text-gray-400">Easy on the eyes</div>
            </div>
            {isDark && <Check className="w-4 h-4 text-violet-600" />}
          </button>
        </div>
      </Section>

      {/* Preset themes */}
      <Section title="Color Theme" description="Choose an accent color preset for the entire interface.">
        <div className="grid grid-cols-4 gap-3">
          {THEME_PRESETS.map(preset => {
            const isActive = !customColor && activePreset.id === preset.id;
            const palette = generatePalette(preset.base);
            return (
              <button
                key={preset.id}
                onClick={() => setPreset(preset.id)}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  isActive
                    ? 'border-gray-900 shadow-md'
                    : 'border-gray-100 hover:border-gray-300'
                }`}
              >
                {/* Color swatch stack */}
                <div className="flex gap-0.5">
                  {['100', '400', '600', '800'].map(shade => (
                    <div
                      key={shade}
                      className="w-5 h-5 rounded-md"
                      style={{ background: palette[shade] }}
                    />
                  ))}
                </div>
                <div className="text-[11px] font-medium text-gray-700">{preset.name}</div>
                {isActive && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Custom color */}
      <Section
        title="Custom Accent"
        description="Set any hex color as your accent. The full color scale is auto-generated."
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {/* Color picker */}
            <div className="relative">
              <input
                type="color"
                value={localCustom}
                onChange={e => setLocalCustom(e.target.value)}
                className="sr-only"
                id="kai-color-picker"
              />
              <label
                htmlFor="kai-color-picker"
                className="w-10 h-10 rounded-xl border-2 border-white shadow-md cursor-pointer block hover:scale-105 transition-transform"
                style={{ background: localCustom }}
              />
            </div>

            {/* Hex input */}
            <input
              type="text"
              value={localCustom}
              onChange={e => {
                const v = e.target.value;
                setLocalCustom(v);
              }}
              placeholder="#6366F1"
              className="w-28 px-3 py-2 text-[13px] font-mono border border-gray-200 rounded-lg outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
            />

            <button
              onClick={handleCustomApply}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#18181B] hover:bg-black text-white text-[13px] font-medium rounded-lg transition-colors shadow-sm"
            >
              <Palette className="w-3.5 h-3.5" />
              Apply
            </button>

            {customColor && (
              <button
                onClick={() => { setPreset(activePreset.id); }}
                className="text-[12px] text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          {/* Generated palette preview */}
          {localCustom && /^#[0-9A-Fa-f]{6}$/.test(localCustom) && (
            <div>
              <div className="text-[11px] font-medium text-gray-500 mb-2">Generated palette</div>
              <div className="flex gap-1">
                {['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'].map(shade => {
                  const p = generatePalette(localCustom);
                  return (
                    <div key={shade} className="flex-1 text-center">
                      <div
                        className="w-full h-8 rounded-md mb-1"
                        style={{ background: p[shade] }}
                        title={p[shade]}
                      />
                      <div className="text-[9px] text-gray-400 font-mono">{shade}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
