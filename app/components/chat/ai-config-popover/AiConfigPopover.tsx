"use client";

import { useState, useRef, useEffect } from "react";
import { Settings, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { modelsForProvider, type Provider } from "@/shared/ai-config";
import { useAiConfigDraft } from "./useAiConfigDraft";
import { KeyField } from "./KeyField";
import { ModelPicker } from "./ModelPicker";
import { SystemPrompt } from "./SystemPrompt";

// ─── Active-badge label ───────────────────────────────────────────────────────

function useActiveBadge(
  userProvider: Provider | null,
  userModel: string | null,
  userSystemPrompt: string | null,
): string | null {
  const hasCustomConfig = userProvider !== null || userModel !== null || userSystemPrompt !== null;
  if (!hasCustomConfig) return null;
  const pLabel = userProvider === "anthropic" ? "Claude" : userProvider === "gemini" ? "Gemini" : "K-AI";
  const mLabel = userModel ? modelsForProvider(userProvider).find((m) => m.value === userModel)?.label : null;
  return mLabel ? `${pLabel} · ${mLabel}` : pLabel;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AiConfigPopover() {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  const draft = useAiConfigDraft(open);
  const activeBadge = useActiveBadge(draft.userProvider, draft.userModel, draft.userSystemPrompt);

  return (
    <div className="relative flex-shrink-0">
      {/* Trigger */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        title="AI configuration"
        className={cn(
          "flex items-center gap-1.5 rounded-lg transition-all duration-150",
          activeBadge ? "pl-1.5 pr-2 py-1" : "p-1.5",
          activeBadge ? "text-violet-600 hover:bg-violet-50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
        )}
      >
        <Settings className="w-4 h-4 flex-shrink-0" />
        {activeBadge && <span className="text-[11px] font-medium leading-none">{activeBadge}</span>}
      </button>

      {/* Popover — scrollable, max height respects viewport */}
      {open && (
        <div
          ref={popoverRef}
          className="absolute bottom-full left-0 mb-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 flex flex-col max-h-[calc(100vh-120px)]"
        >
          {/* Active-config badge */}
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
                {(["K-AI Provided", "Claude", "Gemini"] as const).map((label) => {
                  const p: Provider | null = label === "Claude" ? "anthropic" : label === "Gemini" ? "gemini" : null;
                  return (
                    <button
                      key={label}
                      onClick={() => draft.handleProviderChange(p)}
                      className={cn(
                        "px-2.5 py-1 text-[12px] font-medium rounded-lg transition-all",
                        draft.provider === p
                          ? "bg-[#18181B] text-white"
                          : "border border-gray-200 text-gray-600 hover:border-gray-300",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Anthropic warning */}
            {draft.provider === "anthropic" && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700">
                  Claude API key support is not fully tested. Responses may not work as expected.
                </p>
              </div>
            )}

            {/* API key */}
            {draft.provider !== null && draft.activeKey !== null && draft.setActiveKey !== null && (
              <KeyField
                provider={draft.provider}
                activeKey={draft.activeKey}
                setActiveKey={draft.setActiveKey}
                showKey={draft.showKey}
                setShowKey={draft.setShowKey}
                onBlur={draft.handleKeyBlur}
              />
            )}

            <ModelPicker
              provider={draft.provider}
              draftModel={draft.draftModel}
              setDraftModel={draft.setDraftModel}
              availability={draft.availability}
              probing={draft.probing}
              keyEntered={draft.keyEntered}
            />

            <SystemPrompt draftPrompt={draft.draftPrompt} setDraftPrompt={draft.setDraftPrompt} />
          </div>

          {/* Sticky apply */}
          <div className="p-3 border-t border-gray-100">
            <button
              onClick={draft.handleSave}
              disabled={!draft.keyEntered}
              title={!draft.keyEntered ? "Enter your API key first" : undefined}
              className={cn(
                "w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px] font-medium transition-all text-white",
                !draft.keyEntered
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : draft.saved
                    ? "bg-emerald-500"
                    : "bg-[#18181B] hover:bg-black",
              )}
            >
              {draft.saved ? <><Check className="w-3.5 h-3.5" /> Saved</> : "Apply"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
