"use client";

import { cn } from "@/lib/cn";
import { PROMPT_SUGGESTIONS } from "@/shared/ai-config";

interface Props {
  draftPrompt: string;
  setDraftPrompt: (v: string) => void;
}

export function SystemPrompt({ draftPrompt, setDraftPrompt }: Props) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        System Prompt
      </label>
      {/* Presets */}
      <div className="flex flex-wrap gap-1 mb-1.5">
        {PROMPT_SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            onClick={() => setDraftPrompt(s.value)}
            className={cn(
              "text-[11px] px-2 py-0.5 rounded-full border transition-colors",
              draftPrompt === s.value
                ? "border-violet-400 text-violet-600 bg-violet-50"
                : "border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600",
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
  );
}
