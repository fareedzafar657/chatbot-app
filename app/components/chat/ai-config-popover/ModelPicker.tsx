"use client";

import { Check, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { modelsForProvider, type Provider } from "@/shared/ai-config";

interface Props {
  provider: Provider | null;
  userEmail: string | null;
  draftModel: string;
  setDraftModel: (v: string) => void;
  availability: Record<string, "available" | "unavailable">;
  probing: boolean;
  keyEntered: boolean;
}

export function ModelPicker({ provider, userEmail, draftModel, setDraftModel, availability, probing, keyEntered }: Props) {
  const models = modelsForProvider(provider, userEmail);
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <label className={cn("block text-[11px] font-semibold uppercase tracking-wide", keyEntered ? "text-gray-500" : "text-gray-300")}>
          Model
        </label>
        {probing && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
      </div>
      {!keyEntered && (
        <p className="text-[11px] text-gray-400 mb-1.5">Enter your API key above to select a model.</p>
      )}
      {/* Options */}
      <div className="space-y-1">
        {models.map((m) => {
          const unavailable = !keyEntered || m.disabled || availability[m.value] === "unavailable";
          return (
            <button
              key={m.value}
              disabled={unavailable}
              onClick={() => setDraftModel(m.value)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all",
                unavailable
                  ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                  : draftModel === m.value
                    ? "border-violet-400 bg-violet-50"
                    : "border-gray-200 hover:border-gray-300",
              )}
            >
              <div>
                <span className="text-[12px] font-medium text-gray-800">{m.label}</span>
                <span className="block text-[11px] text-gray-400">{m.note}</span>
              </div>
              {unavailable ? (
                <AlertCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" aria-label="Not available with your key" />
              ) : draftModel === m.value ? (
                <Check className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
