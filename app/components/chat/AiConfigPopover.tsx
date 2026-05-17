'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Settings, Eye, EyeOff, Check, Loader2, AlertCircle } from 'lucide-react';
import { useChatStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '@/lib/cn';

// ─── Model definitions ────────────────────────────────────────────────────────
// Pricing: input / output per 1M tokens. Free-tier availability noted.

const BEDROCK_MODELS = [
  { value: '',                        label: 'Nova Micro',  note: 'Fastest · $0.035/$0.14 per 1M', disabled: false },
  { value: 'amazon.nova-lite-v1:0',   label: 'Nova Lite',  note: 'Coming soon',                   disabled: true  },
  { value: 'us.amazon.nova-pro-v1:0', label: 'Nova Pro',   note: 'Coming soon',                   disabled: true  },
] as const;

// IDs from Anthropic docs (May 2026). All models are paid — no free tier.
const ANTHROPIC_MODELS = [
  { value: '',                  label: 'Claude Haiku 4.5',  note: 'Fastest · $1/$5 per 1M',        disabled: false },
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', note: 'Balanced · $3/$15 per 1M',      disabled: false },
  { value: 'claude-opus-4-7',   label: 'Claude Opus 4.7',   note: 'Most capable · $15/$75 per 1M', disabled: false },
] as const;

// IDs from Google Gemini API docs (May 2026).
// Free tier includes 2.5 Flash; 2.5 Pro requires a paid key.
const GEMINI_MODELS = [
  { value: '',               label: 'Gemini 2.5 Flash', note: 'Fast · free tier eligible',      disabled: false },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro',  note: 'Most capable · paid key required', disabled: false },
] as const;

// ─── System prompt suggestions ────────────────────────────────────────────────

const PROMPT_SUGGESTIONS = [
  { label: 'Default',         value: '' },
  { label: 'Senior Engineer', value: 'You are a senior software engineer. Be precise, explain your reasoning, and prefer simple solutions.' },
  { label: 'Concise',         value: 'Always respond in 3 sentences or fewer unless the user explicitly asks for more detail.' },
  { label: 'Socratic',        value: 'Instead of giving direct answers, ask clarifying questions to help the user think through the problem.' },
  { label: 'Formal',          value: 'Respond formally and professionally. Avoid casual language and contractions.' },
] as const;

// ─── Model availability probing ───────────────────────────────────────────────
// Adaptor pattern: each provider exposes the same probe interface.
// Anthropic: GET /v1/models returns all accessible model IDs for the key.
// Gemini: no list endpoint — probe each model with a minimal 1-token request.

type ModelAvailability = Record<string, 'available' | 'unavailable'>;

const providerAdaptors = {
  anthropic: {
    async probe(apiKey: string): Promise<ModelAvailability> {
      try {
        const res = await fetch('https://api.anthropic.com/v1/models', {
          headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        });
        if (!res.ok) return {};
        const data = await res.json() as { data: { id: string }[] };
        const accessible = new Set(data.data.map((m) => m.id));
        const result: ModelAvailability = {};
        for (const m of ANTHROPIC_MODELS) {
          const id = m.value || 'claude-haiku-4-5-20251001';
          result[m.value] = accessible.has(id) ? 'available' : 'unavailable';
        }
        return result;
      } catch {
        return {}; // network error — don't mark unavailable, just unknown
      }
    },
  },

  gemini: {
    async probe(apiKey: string): Promise<ModelAvailability> {
      const results = await Promise.all(
        GEMINI_MODELS.map(async (m) => {
          const modelId = m.value || 'gemini-2.5-flash';
          try {
            const res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Minimal 1-token request — only tests access, not quality
                body: JSON.stringify({
                  contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
                  generationConfig: { maxOutputTokens: 1 },
                }),
              }
            );
            // 200 = ok, 400 = bad request but key is valid for this model
            return { key: m.value, status: (res.ok || res.status === 400) ? 'available' : 'unavailable' } as const;
          } catch {
            return { key: m.value, status: 'unavailable' } as const;
          }
        })
      );
      return Object.fromEntries(results.map((r) => [r.key, r.status]));
    },
  },
} satisfies Record<string, { probe(key: string): Promise<ModelAvailability> }>;

// ─── Component ────────────────────────────────────────────────────────────────

export function AiConfigPopover() {
  const { userAnthropicKey, userGeminiKey, userProvider, userModel, userSystemPrompt, setAiConfig } = useChatStore(
    useShallow((s) => ({
      userAnthropicKey: s.userAnthropicKey,
      userGeminiKey:    s.userGeminiKey,
      userProvider:     s.userProvider,
      userModel:        s.userModel,
      userSystemPrompt: s.userSystemPrompt,
      setAiConfig:      s.setAiConfig,
    }))
  );

  const [open,          setOpen]          = useState(false);
  const [provider,      setProvider]      = useState<'anthropic' | 'gemini' | null>(userProvider);
  const [draftAnthropic, setDraftAnthropic] = useState(userAnthropicKey ?? '');
  const [draftGemini,   setDraftGemini]   = useState(userGeminiKey ?? '');
  const [draftModel,    setDraftModel]    = useState(userModel ?? '');
  const [draftPrompt,   setDraftPrompt]   = useState(userSystemPrompt ?? '');
  const [showKey,       setShowKey]       = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [availability,  setAvailability]  = useState<ModelAvailability>({});
  const [probing,       setProbing]       = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef  = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current  && !buttonRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  // Sync drafts from store on open — picks up keys saved in a previous session
  useEffect(() => {
    if (!open) return;
    setProvider(userProvider);
    setDraftAnthropic(userAnthropicKey ?? '');
    setDraftGemini(userGeminiKey ?? '');
    setDraftModel(userModel ?? '');
    setDraftPrompt(userSystemPrompt ?? '');
    setShowKey(false);
    setAvailability({});
  }, [open]); // intentionally not tracking store values — sync only on open

  const runProbe = useCallback(async (p: typeof provider, key: string) => {
    if (p === null || !key.trim()) { setAvailability({}); return; }
    setProbing(true);
    const result = await providerAdaptors[p].probe(key.trim());
    setAvailability(result);
    setProbing(false);
  }, []);

  const handleProviderChange = (p: typeof provider) => {
    setProvider(p);
    setDraftModel('');
    setShowKey(false);
    setAvailability({});
    // Probe immediately if the relevant key is already filled
    const existingKey = p === 'anthropic' ? draftAnthropic : p === 'gemini' ? draftGemini : '';
    if (existingKey.trim()) runProbe(p, existingKey);
  };

  const handleKeyBlur = (p: 'anthropic' | 'gemini', value: string) => {
    if (provider === p) runProbe(p, value);
  };

  const handleSave = () => {
    setAiConfig({
      anthropicKey: draftAnthropic.trim() || null,
      geminiKey:    draftGemini.trim()    || null,
      provider,
      model:        draftModel         || null,
      systemPrompt: draftPrompt.trim() || null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const activeModels =
    provider === 'anthropic' ? ANTHROPIC_MODELS :
    provider === 'gemini'    ? GEMINI_MODELS :
    BEDROCK_MODELS;

  // The key field shown depends purely on which provider tab is active
  const activeKey      = provider === 'anthropic' ? draftAnthropic : provider === 'gemini' ? draftGemini : null;
  const setActiveKey   = provider === 'anthropic' ? setDraftAnthropic : provider === 'gemini' ? setDraftGemini : null;
  const keyPlaceholder = provider === 'anthropic' ? 'sk-ant-...' : 'AIza...';

  // Anthropic/Gemini require a key before models or Apply are unlocked.
  // Bedrock uses IAM — no key needed.
  const keyRequired = provider !== null;
  const keyEntered  = keyRequired ? !!activeKey?.trim() : true;

  const hasCustomConfig = userProvider !== null || userModel !== null || userSystemPrompt !== null;
  const activeBadge = (() => {
    if (!hasCustomConfig) return null;
    const pLabel = userProvider === 'anthropic' ? 'Claude' : userProvider === 'gemini' ? 'Gemini' : 'K-AI';
    const models = userProvider === 'anthropic' ? ANTHROPIC_MODELS : userProvider === 'gemini' ? GEMINI_MODELS : BEDROCK_MODELS;
    const mLabel = userModel ? models.find((m) => m.value === userModel)?.label : null;
    return mLabel ? `${pLabel} · ${mLabel}` : pLabel;
  })();

  return (
    <div className="relative flex-shrink-0">
      {/* Trigger */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        title="AI configuration"
        className={cn(
          'flex items-center gap-1.5 p-1.5 rounded-lg transition-all duration-150',
          hasCustomConfig
            ? 'text-violet-600 hover:bg-violet-50'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
        )}
      >
        <Settings className="w-4 h-4" />
      </button>

      {/* Popover — scrollable, max height respects viewport */}
      {open && (
        <div
          ref={popoverRef}
          className="absolute bottom-full left-0 mb-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 flex flex-col max-h-[calc(100vh-120px)]"
        >
          {/* Badge when config is active */}
          {activeBadge && (
            <div className="px-4 pt-3 pb-0">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                <Settings className="w-2.5 h-2.5" /> {activeBadge}
              </span>
            </div>
          )}

          {/* Scrollable body */}
          <div className="overflow-y-auto p-4 space-y-4 flex-1">

            {/* Provider tabs */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Provider
              </label>
              <div className="flex gap-1.5">
                {([null, 'anthropic', 'gemini'] as const).map((p) => {
                  const label = p === null ? 'K-AI Provided' : p === 'anthropic' ? 'Claude' : 'Gemini';
                  return (
                    <button
                      key={label}
                      onClick={() => handleProviderChange(p)}
                      className={cn(
                        'px-2.5 py-1 text-[12px] font-medium rounded-lg transition-all',
                        provider === p
                          ? 'bg-[#18181B] text-white'
                          : 'border border-gray-200 text-gray-600 hover:border-gray-300'
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Untested provider warning */}
            {provider === 'anthropic' && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700">Claude API key support is not fully tested. Responses may not work as expected.</p>
              </div>
            )}

            {/* API key — one field, shows only the active provider's key */}
            {provider !== null && activeKey !== null && setActiveKey !== null && (
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type="text"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore
                    value={showKey ? activeKey : activeKey ? '•'.repeat(activeKey.length) : ''}
                    onChange={(e) => {
                      // When hidden, any keystroke replaces the whole value (like a real password field)
                      if (!showKey) {
                        setActiveKey(e.target.value.replaceAll('•', ''));
                      } else {
                        setActiveKey(e.target.value);
                      }
                    }}
                    onBlur={(e) => {
                      // Pass the real key, not the bullet string
                      handleKeyBlur(provider, showKey ? e.target.value : activeKey ?? '');
                    }}
                    placeholder={keyPlaceholder}
                    className="w-full px-3 py-1.5 pr-8 text-[13px] border border-gray-200 rounded-lg bg-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Saved to localStorage. Never sent to our servers.</p>
                {provider === 'gemini' && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Get a free API key at{' '}
                    <a
                      href="https://aistudio.google.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-500 hover:text-violet-700 underline"
                    >
                      aistudio.google.com/api-keys
                    </a>
                  </p>
                )}
              </div>
            )}

            {/* Model picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={cn(
                  'block text-[11px] font-semibold uppercase tracking-wide',
                  keyEntered ? 'text-gray-500' : 'text-gray-300'
                )}>
                  Model
                </label>
                {probing && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
              </div>
              {!keyEntered && (
                <p className="text-[11px] text-gray-400 mb-1.5">Enter your API key above to select a model.</p>
              )}
              <div className="space-y-1">
                {activeModels.map((m) => {
                  const status      = availability[m.value];
                  const unavailable = !keyEntered || m.disabled || status === 'unavailable';
                  return (
                    <button
                      key={m.value}
                      disabled={unavailable}
                      onClick={() => setDraftModel(m.value)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all',
                        unavailable
                          ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                          : draftModel === m.value
                            ? 'border-violet-400 bg-violet-50'
                            : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div>
                        <span className="text-[12px] font-medium text-gray-800">{m.label}</span>
                        <span className="block text-[11px] text-gray-400">{m.note}</span>
                      </div>
                      {unavailable
                        ? <AlertCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" title="Not available with your key" />
                        : draftModel === m.value
                          ? <Check className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                          : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* System prompt */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                System Prompt
              </label>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {PROMPT_SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => setDraftPrompt(s.value)}
                    className={cn(
                      'text-[11px] px-2 py-0.5 rounded-full border transition-colors',
                      draftPrompt === s.value
                        ? 'border-violet-400 text-violet-600 bg-violet-50'
                        : 'border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <textarea
                value={draftPrompt}
                onChange={(e) => setDraftPrompt(e.target.value)}
                rows={2}
                placeholder="Leave blank to use the default system prompt."
                className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg bg-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all leading-relaxed resize-none"
              />
            </div>
          </div>

          {/* Sticky apply button */}
          <div className="p-3 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={!keyEntered}
              title={!keyEntered ? 'Enter your API key first' : undefined}
              className={cn(
                'w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px] font-medium transition-all text-white',
                !keyEntered        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
                saved              ? 'bg-emerald-500' :
                                     'bg-[#18181B] hover:bg-black'
              )}
            >
              {saved ? <><Check className="w-3.5 h-3.5" /> Saved</> : 'Apply'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
