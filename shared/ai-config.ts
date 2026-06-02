// No React — safe to import from server components or pure utils.

// ─── Model definitions ────────────────────────────────────────────────────────
// Pricing: input / output per 1M tokens. Free-tier availability noted.

export const BEDROCK_MODELS = [
  {
    value: "us.amazon.nova-pro-v1:0",
    label: "Nova Pro",
    note: "Balanced · $0.80/$3.20 per 1M",
    disabled: false,
  },
] as const;

// Keep in sync with config.demoModels.bedrockModels in node-streaming-test/src/config.js —
// both lists must contain the same model IDs or the client will offer models the server rejects.
const DEMO_BEDROCK_MODELS = [
  {
    value: "us.anthropic.claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    note: "Most capable · via Bedrock",
    disabled: false,
  },
] as const;

// IDs from Anthropic docs (May 2026). All models are paid — no free tier.
export const ANTHROPIC_MODELS = [
  {
    value: "",
    label: "Claude Haiku 4.5",
    note: "Fastest · $1/$5 per 1M",
    disabled: false,
  },
  {
    value: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    note: "Balanced · $3/$15 per 1M",
    disabled: false,
  },
  {
    value: "claude-opus-4-7",
    label: "Claude Opus 4.7",
    note: "Most capable · $15/$75 per 1M",
    disabled: false,
  },
] as const;

// IDs from Google Gemini API docs (May 2026).
// Free tier includes 2.5 Flash; 2.5 Pro requires a paid key.
export const GEMINI_MODELS = [
  {
    value: "",
    label: "Gemini 2.5 Flash",
    note: "Fast · free tier eligible",
    disabled: false,
  },
  {
    value: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    note: "Most capable · paid key required",
    disabled: false,
  },
] as const;

// ─── Prompt suggestions ───────────────────────────────────────────────────────

export const PROMPT_SUGGESTIONS = [
  { label: "Default", value: "" },
  {
    label: "Senior Engineer",
    value:
      "You are a senior software engineer. Be precise, explain your reasoning, and prefer simple solutions.",
  },
  {
    label: "Concise",
    value:
      "Always respond in 3 sentences or fewer unless the user explicitly asks for more detail.",
  },
  {
    label: "Socratic",
    value:
      "Instead of giving direct answers, ask clarifying questions to help the user think through the problem.",
  },
  {
    label: "Formal",
    value:
      "Respond formally and professionally. Avoid casual language and contractions.",
  },
] as const;

// ─── Model availability probing ───────────────────────────────────────────────
// Gemini: no list endpoint — probe each model with a minimal 1-token request.

export type ModelAvailability = Record<string, "available" | "unavailable">;

export type Provider = "anthropic" | "gemini";

export const providerAdaptors: Record<
  Provider,
  { probe(key: string): Promise<ModelAvailability> }
> = {
  anthropic: {
    async probe(apiKey) {
      try {
        const res = await fetch("https://api.anthropic.com/v1/models", {
          headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        });
        if (!res.ok) return {};
        const data = (await res.json()) as { data: { id: string }[] };
        const accessible = new Set(data.data.map((m) => m.id));
        const result: ModelAvailability = {};
        for (const m of ANTHROPIC_MODELS) {
          const id = m.value || "claude-haiku-4-5-20251001";
          result[m.value] = accessible.has(id) ? "available" : "unavailable";
        }
        return result;
      } catch {
        return {}; // network error — don't mark unavailable, just unknown
      }
    },
  },

  gemini: {
    async probe(apiKey) {
      const results = await Promise.all(
        GEMINI_MODELS.map(async (m) => {
          const modelId = m.value || "gemini-2.5-flash";
          try {
            const res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // Minimal 1-token request — only tests access, not quality
                body: JSON.stringify({
                  contents: [{ role: "user", parts: [{ text: "hi" }] }],
                  generationConfig: { maxOutputTokens: 1 },
                }),
              },
            );
            // 200 = ok, 400 = bad request but key is valid for this model
            return {
              key: m.value,
              status:
                res.ok || res.status === 400 ? "available" : "unavailable",
            } as const;
          } catch {
            return { key: m.value, status: "unavailable" } as const;
          }
        }),
      );
      return Object.fromEntries(results.map((r) => [r.key, r.status]));
    },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEMO_ALLOWED_EMAILS = (process.env.NEXT_PUBLIC_DEMO_MODELS_ALLOWED_EMAILS ?? "")
  .split(",").map((e) => e.trim()).filter(Boolean);

export function isDemoModelAllowed(email: string | null): boolean {
  return !!email && DEMO_ALLOWED_EMAILS.includes(email);
}

export function modelsForProvider(provider: Provider | null, userEmail: string | null = null) {
  if (provider === "anthropic") return ANTHROPIC_MODELS;
  if (provider === "gemini") return GEMINI_MODELS;
  if (isDemoModelAllowed(userEmail)) {
    return [...BEDROCK_MODELS, ...DEMO_BEDROCK_MODELS];
  }
  return BEDROCK_MODELS;
}
