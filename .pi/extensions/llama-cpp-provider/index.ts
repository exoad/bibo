import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const LLAMACPP_BASE_URL = process.env.LLAMACPP_BASE_URL || "http://127.0.0.1:6969/v1";
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1";

export default function (pi: ExtensionAPI) {
  pi.registerProvider("jackbox", {
    baseUrl: LLAMACPP_BASE_URL,
    apiKey: "LLAMACPP_API_KEY",
    api: "openai-completions",
    models: [
      {
        id: "kibi-qwen3.6",
        name: "Kibi Qwen3.6 (jackbox)",
        reasoning: true,
        input: ["text"],
        contextWindow: 131072,
        maxTokens: 4096,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
    ],
  });

  pi.registerProvider("ollama", {
    baseUrl: OLLAMA_BASE_URL,
    apiKey: "OLLAMA_API_KEY",
    api: "openai-completions",
    models: [
      {
        id: "qwen3.5",
        name: "Qwen3.5 (ollama)",
        reasoning: true,
        input: ["text"],
        contextWindow: 32768,
        maxTokens: 4096,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
    ],
  });
}
