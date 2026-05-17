import { useState, useEffect, useCallback } from "react";
import { useChatStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { type ModelAvailability, type Provider, providerAdaptors } from "@/shared/ai-config";

// Manages local (unsaved) edits to AI config and model availability probing.
// Syncs from the store only on popover open — never tracks live store changes.
export function useAiConfigDraft(open: boolean) {
  const {
    userAnthropicKey,
    userGeminiKey,
    userProvider,
    userModel,
    userSystemPrompt,
    setAiConfig,
  } = useChatStore(
    useShallow((s) => ({
      userAnthropicKey: s.userAnthropicKey,
      userGeminiKey: s.userGeminiKey,
      userProvider: s.userProvider,
      userModel: s.userModel,
      userSystemPrompt: s.userSystemPrompt,
      setAiConfig: s.setAiConfig,
    })),
  );

  const [provider, setProvider] = useState<Provider | null>(userProvider);
  const [draftAnthropic, setDraftAnthropic] = useState(userAnthropicKey ?? "");
  const [draftGemini, setDraftGemini] = useState(userGeminiKey ?? "");
  const [draftModel, setDraftModel] = useState(userModel ?? "");
  const [draftPrompt, setDraftPrompt] = useState(userSystemPrompt ?? "");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [availability, setAvailability] = useState<ModelAvailability>({});
  const [probing, setProbing] = useState(false);

  // Sync from store on open — picks up keys saved in a previous session
  useEffect(() => {
    if (!open) return;
    setProvider(userProvider);
    setDraftAnthropic(userAnthropicKey ?? "");
    setDraftGemini(userGeminiKey ?? "");
    setDraftModel(userModel ?? "");
    setDraftPrompt(userSystemPrompt ?? "");
    setShowKey(false);
    setAvailability({});
  }, [open]); // intentionally not tracking store values — sync only on open

  const runProbe = useCallback(async (p: Provider | null, key: string) => {
    if (p === null || !key.trim()) { setAvailability({}); return; }
    setProbing(true);
    const result = await providerAdaptors[p].probe(key.trim());
    setAvailability(result);
    setProbing(false);
  }, []);

  const handleProviderChange = (p: Provider | null) => {
    setProvider(p);
    setDraftModel("");
    setShowKey(false);
    setAvailability({});
    const existingKey = p === "anthropic" ? draftAnthropic : p === "gemini" ? draftGemini : "";
    if (existingKey.trim()) runProbe(p, existingKey);
  };

  const handleKeyBlur = (p: Provider, value: string) => {
    if (provider === p) runProbe(p, value);
  };

  const handleSave = () => {
    setAiConfig({
      anthropicKey: draftAnthropic.trim() || null,
      geminiKey: draftGemini.trim() || null,
      provider,
      model: draftModel || null,
      systemPrompt: draftPrompt.trim() || null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const activeKey = provider === "anthropic" ? draftAnthropic : provider === "gemini" ? draftGemini : null;
  const setActiveKey = provider === "anthropic" ? setDraftAnthropic : provider === "gemini" ? setDraftGemini : null;
  const keyEntered = provider !== null ? !!activeKey?.trim() : true;

  return {
    provider, handleProviderChange,
    draftModel, setDraftModel,
    draftPrompt, setDraftPrompt,
    showKey, setShowKey,
    saved,
    availability, probing,
    activeKey, setActiveKey,
    keyEntered,
    handleKeyBlur, handleSave,
    userProvider, userModel, userSystemPrompt,
  };
}
