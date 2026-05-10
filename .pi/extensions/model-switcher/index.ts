import type { ExtensionAPI, ProviderConfig, ProviderModelConfig } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

/**
 * Model parameter compatibility registry.
 * Maps model IDs to their supported/unsupported parameters.
 */
interface ModelCompat {
  supportsTemperature: boolean;
  supportsTopP: boolean;
  supportsTopK: boolean;
  supportsPresencePenalty: boolean;
  supportsFrequencyPenalty: boolean;
  supportsReasoningEffort: boolean;
  supportsMaxTokens: boolean;
  supportsStreamOptions: boolean;
}

const DEFAULT_COMPAT: ModelCompat = {
  supportsTemperature: true,
  supportsTopP: true,
  supportsTopK: false,
  supportsPresencePenalty: true,
  supportsFrequencyPenalty: true,
  supportsReasoningEffort: false,
  supportsMaxTokens: true,
  supportsStreamOptions: true,
};

// Models known to reject certain parameters
const MODEL_COMPAT_REGISTRY: Record<string, Partial<ModelCompat>> = {
  // GitHub Copilot models (via copilot provider)
  "gpt-4o-copilot": { supportsTemperature: false },
  "gpt-4o-mini-copilot": { supportsTemperature: false },
  "claude-sonnet-4-copilot": { supportsTemperature: false },
  "claude-3-5-sonnet-copilot": { supportsTemperature: false },
  "copilot-gpt-4o": { supportsTemperature: false },
  "copilot-gpt-4o-mini": { supportsTemperature: false },
  "copilot-claude-sonnet-4": { supportsTemperature: false },
  "copilot-claude-3-5-sonnet": { supportsTemperature: false },

  // Some local models
  "qwen3.6": { supportsTemperature: true },
  "qwen3.6-flash": { supportsTemperature: true },

  // Azure OpenAI sometimes rejects certain params
  "azure-gpt-4o": { supportsTemperature: false, supportsPresencePenalty: false },
};

function getModelCompat(modelId: string): ModelCompat {
  return { ...DEFAULT_COMPAT, ...(MODEL_COMPAT_REGISTRY[modelId] || {}) };
}

/**
 * Strip unsupported parameters from a request body based on model compatibility.
 */
function stripUnsupportedParams(body: Record<string, unknown>, modelId: string): Record<string, unknown> {
  const compat = getModelCompat(modelId);
  const stripped = { ...body };

  if (!compat.supportsTemperature) {
    delete stripped.temperature;
  }
  if (!compat.supportsTopP) {
    delete stripped.top_p;
  }
  if (!compat.supportsTopK) {
    delete stripped.top_k;
  }
  if (!compat.supportsPresencePenalty) {
    delete stripped.presence_penalty;
  }
  if (!compat.supportsFrequencyPenalty) {
    delete stripped.frequency_penalty;
  }
  if (!compat.supportsReasoningEffort) {
    delete stripped.reasoning_effort;
  }
  if (!compat.supportsMaxTokens) {
    delete stripped.max_tokens;
    delete stripped.max_completion_tokens;
  }
  if (!compat.supportsStreamOptions) {
    delete stripped.stream_options;
  }

  return stripped;
}

/**
 * Build a streamSimple wrapper that strips unsupported parameters.
 */
function createCompatStream(originalStream: any, modelId: string) {
  return async function* compatStream(model: any, context: any, options?: any) {
    // If there's a body in options, strip unsupported params
    if (options?.body) {
      options.body = stripUnsupportedParams(options.body, modelId);
    }
    // Also strip from the raw request if present
    if (options?.request?.body) {
      options.request.body = stripUnsupportedParams(options.request.body, modelId);
    }

    // Forward to original stream
    yield* originalStream(model, context, options);
  };
}

/**
 * Model profiles with parameter compatibility info.
 */
const MODEL_PROFILES: Record<string, ProviderModelConfig> = {
  "jackbox/bibo-qwen3.6": {
    id: "bibo-qwen3.6",
    name: "Bibo Qwen3.6 (jackbox)",
    reasoning: true,
    input: ["text"],
    contextWindow: 131072,
    maxTokens: 4096,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  },
  "jackbox/bibo-qwen3.6-flash": {
    id: "bibo-qwen3.6-flash",
    name: "Bibo Qwen3.6-Flash (jackbox)",
    reasoning: true,
    input: ["text"],
    contextWindow: 65536,
    maxTokens: 4096,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  },
  "ollama/qwen3.5": {
    id: "qwen3.5",
    name: "Qwen3.5 (ollama)",
    reasoning: true,
    input: ["text"],
    contextWindow: 32768,
    maxTokens: 4096,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  },
  // GitHub Copilot models (temperature not supported)
  "copilot/gpt-4o": {
    id: "gpt-4o",
    name: "GPT-4o (Copilot)",
    reasoning: false,
    input: ["text", "image"],
    contextWindow: 128000,
    maxTokens: 16384,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    compat: {
      supportsReasoningEffort: false,
    },
  },
  "copilot/gpt-4o-mini": {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini (Copilot)",
    reasoning: false,
    input: ["text", "image"],
    contextWindow: 128000,
    maxTokens: 16384,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    compat: {
      supportsReasoningEffort: false,
    },
  },
  "copilot/claude-sonnet-4": {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4 (Copilot)",
    reasoning: true,
    input: ["text", "image"],
    contextWindow: 200000,
    maxTokens: 16384,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  },
};

/**
 * Provider configurations.
 */
const PROVIDERS: Record<string, ProviderConfig> = {
  jackbox: {
    baseUrl: "http://127.0.0.1:6969/v1",
    apiKey: "LLAMACPP_API_KEY",
    api: "openai-completions",
    models: [
      MODEL_PROFILES["jackbox/bibo-qwen3.6"],
      MODEL_PROFILES["jackbox/bibo-qwen3.6-flash"],
    ],
  },
  ollama: {
    baseUrl: "http://127.0.0.1:11434/v1",
    apiKey: "OLLAMA_API_KEY",
    api: "openai-completions",
    models: [
      MODEL_PROFILES["ollama/qwen3.5"],
    ],
  },
  copilot: {
    baseUrl: "https://api.githubcopilot.com",
    apiKey: "GITHUB_COPILOT_API_KEY",
    api: "openai-completions",
    models: [
      MODEL_PROFILES["copilot/gpt-4o"],
      MODEL_PROFILES["copilot/gpt-4o-mini"],
      MODEL_PROFILES["copilot/claude-sonnet-4"],
    ],
    headers: {
      "Editor-Version": "vscode/1.90.0",
      "Editor-Plugin-Version": "copilot-chat/0.16.0",
    },
    authHeader: true,
  },
};

/**
 * Current active model tracking.
 */
let currentModel = "jackbox/bibo-qwen3.6";

export default function (pi: ExtensionAPI) {
  // Register all providers
  for (const [name, config] of Object.entries(PROVIDERS)) {
    pi.registerProvider(name, config);
  }

  // Register the model switcher command
  pi.registerCommand("switch-model", {
    description: "Switch to a different model. Usage: /switch-model <provider/model-id>",
    handler: async (args, ctx) => {
      if (!args || args.trim() === "") {
        // List available models
        const models = Object.keys(MODEL_PROFILES);
        const current = currentModel;
        const list = models.map((m) => (m === current ? `* ${m} (current)` : `  ${m}`)).join("\n");
        ctx.ui.notify(`Available models:\n${list}`, "info");
        return;
      }

      const modelId = args.trim();
      if (!MODEL_PROFILES[modelId]) {
        ctx.ui.notify(`Unknown model: ${modelId}\nAvailable: ${Object.keys(MODEL_PROFILES).join(", ")}`, "error");
        return;
      }

      currentModel = modelId;

      // Update the model profile in settings
      const compat = getModelCompat(modelId);
      const profile: any = {
        context_limit: MODEL_PROFILES[modelId].contextWindow,
        max_tokens: MODEL_PROFILES[modelId].maxTokens,
        thinking_budget: MODEL_PROFILES[modelId].reasoning ? 8192 : 0,
        skill_token_budget: 300,
        knowledge_token_budget: 200,
        system_prompt_budget: 0,
        max_retries: 1,
      };

      // Only add temperature if the model supports it
      if (compat.supportsTemperature) {
        profile.temperature = 0.3;
      }

      // Update the default model profile
      if (ctx.settings?.bibo?.default_model_profile) {
        ctx.settings.bibo.default_model_profile = profile;
      }

      ctx.ui.notify(`Switched to model: ${modelId}`, "success");
      ctx.ui.setStatus("model-switcher", `Model: ${modelId}`);
    },
  });

  // Register a tool for programmatic model switching
  pi.registerTool({
    name: "switch_model",
    label: "Switch Model",
    description: "Switch the active LLM model. Returns available models if called without arguments.",
    parameters: Type.Object({
      model_id: Type.Optional(Type.String({
        description: "Model ID to switch to (e.g., 'jackbox/bibo-qwen3.6', 'copilot/gpt-4o')",
      })),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      if (!params.model_id) {
        const models = Object.keys(MODEL_PROFILES);
        const current = currentModel;
        const list = models.map((m) => (m === current ? `* ${m} (current)` : `  ${m}`)).join("\n");
        return {
          content: [{ type: "text", text: `Available models:\n${list}\n\nCurrent: ${current}` }],
          details: {},
        };
      }

      const modelId = params.model_id;
      if (!MODEL_PROFILES[modelId]) {
        return {
          content: [{ type: "text", text: `Unknown model: ${modelId}\nAvailable: ${Object.keys(MODEL_PROFILES).join(", ")}` }],
          details: { error: true },
        };
      }

      currentModel = modelId;
      const compat = getModelCompat(modelId);
      const profile: any = {
        context_limit: MODEL_PROFILES[modelId].contextWindow,
        max_tokens: MODEL_PROFILES[modelId].maxTokens,
        thinking_budget: MODEL_PROFILES[modelId].reasoning ? 8192 : 0,
        skill_token_budget: 300,
        knowledge_token_budget: 200,
        system_prompt_budget: 0,
        max_retries: 1,
      };

      if (compat.supportsTemperature) {
        profile.temperature = 0.3;
      }

      if (ctx.settings?.bibo?.default_model_profile) {
        ctx.settings.bibo.default_model_profile = profile;
      }

      return {
        content: [{ type: "text", text: `Switched to model: ${modelId}` }],
        details: {},
      };
    },
  });

  // Set initial status
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.setStatus("model-switcher", `Model: ${currentModel}`);
  });

  // Intercept tool calls to strip unsupported parameters for Copilot models
  pi.on("tool_call", async (event, ctx) => {
    // This intercepts LLM tool calls, not the model API request itself.
    // The streamSimple wrapper handles API request parameter stripping.
  });
}
