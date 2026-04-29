import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

interface ProviderConfig {
  name: string;
  api: string;
  baseUrl: string;
  apiKey: string;
  models: Array<{
    id: string;
    name: string;
    reasoning?: boolean;
    input?: string[];
    contextWindow?: number;
    maxTokens?: number;
  }>;
}

interface ProviderFile {
  providers: ProviderConfig[];
}

/**
 * Load provider configuration from provider.json.
 * Falls back to environment variables if the file doesn't exist.
 */
function loadProviders(): ProviderConfig[] {
  // Try to find provider.json starting from the extension's directory
  const extensionDir = __dirname;
  const biboRoot = join(extensionDir, "..", "..", "..");
  const providerPath = join(biboRoot, "provider.json");

  if (existsSync(providerPath)) {
    try {
      const content = readFileSync(providerPath, "utf-8");
      const config = JSON.parse(content) as ProviderFile;
      if (config.providers && Array.isArray(config.providers)) {
        return config.providers;
      }
    } catch {
      // Fall through to env var fallback
    }
  }

  // Fallback: build providers from environment variables
  const llamacppUrl = process.env.LLAMACPP_BASE_URL || "http://127.0.0.1:6969/v1";
  const llamacppKey = process.env.LLAMACPP_API_KEY || "noop";
  const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1";
  const ollamaKey = process.env.OLLAMA_API_KEY || "noop";

  return [
    {
      name: "jackbox",
      api: "openai-completions",
      baseUrl: llamacppUrl,
      apiKey: llamacppKey,
      models: [
        {
          id: "bibo-qwen3.6",
          name: "Bibo Qwen3.6 (jackbox)",
          reasoning: true,
          input: ["text"],
          contextWindow: 131072,
          maxTokens: 4096,
        },
	{
          id: "bibo-qwen3.6-flash",
          name: "Bibo Qwen3.6-Flash (jackbox)",
          reasoning: true,
          input: ["text"],
          contextWindow: 65536,
          maxTokens: 4096,
	},
      ],
    },
    {
      name: "ollama",
      api: "openai-completions",
      baseUrl: ollamaUrl,
      apiKey: ollamaKey,
      models: [
        {
          id: "qwen3.5",
          name: "Qwen3.5 (ollama)",
          reasoning: true,
          input: ["text"],
          contextWindow: 32768,
          maxTokens: 4096,
        },
      ],
    },
  ];
}

export default function (pi: ExtensionAPI) {
  const providers = loadProviders();

  for (const provider of providers) {
    pi.registerProvider(provider.name, {
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey,
      api: provider.api,
      models: provider.models.map((model) => ({
        ...model,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      })),
    });
  }
}
