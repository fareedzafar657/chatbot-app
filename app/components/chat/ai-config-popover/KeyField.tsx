"use client";

import { Eye, EyeOff } from "lucide-react";
import { type Provider } from "@/shared/ai-config";

interface Props {
  provider: Provider;
  activeKey: string;
  setActiveKey: (v: string) => void;
  showKey: boolean;
  setShowKey: (v: boolean) => void;
  onBlur: (p: Provider, value: string) => void;
}

export function KeyField({ provider, activeKey, setActiveKey, showKey, setShowKey, onBlur }: Props) {
  const placeholder = provider === "anthropic" ? "sk-ant-..." : "AIza...";
  return (
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
          value={showKey ? activeKey : activeKey ? "•".repeat(activeKey.length) : ""}
          onChange={(e) => {
            // When hidden, any keystroke replaces the whole value (like a real password field)
            setActiveKey(showKey ? e.target.value : e.target.value.replaceAll("•", ""));
          }}
          onBlur={(e) => onBlur(provider, showKey ? e.target.value : activeKey)}
          placeholder={placeholder}
          className="w-full px-3 py-1.5 pr-8 text-[13px] border border-gray-200 rounded-lg bg-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
      <p className="text-[11px] text-gray-400 mt-1">Saved to localStorage. Never sent to our servers.</p>
      {provider === "gemini" && (
        <p className="text-[11px] text-gray-400 mt-0.5">
          Get a free API key at{" "}
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
  );
}
