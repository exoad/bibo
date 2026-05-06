import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

/**
 * Headless Web Access Extension for bibo
 *
 * Provides browser-free alternatives to the Playwright-based browser tools.
 * Uses native fetch + linkedom/Readability for HTML parsing.
 *
 * No browser installation required. Works in fully headless environments.
 */

// Lazy-load heavy deps only when needed
let linkedomMod: typeof import("linkedom") | null = null;
let readabilityMod: typeof import("@mozilla/readability") | null = null;
let turndownMod: typeof import("turndown") | null = null;

async function getLinkedom() {
  if (!linkedomMod) linkedomMod = await import("linkedom");
  return linkedomMod;
}

async function getReadability() {
  if (!readabilityMod) readabilityMod = await import("@mozilla/readability");
  return readabilityMod;
}

async function getTurndown() {
  if (!turndownMod) turndownMod = new (await import("turndown")).default({ headingStyle: "atx", codeBlockStyle: "fenced" });
  return turndownMod;
}

interface PageSession {
  url: string;
  html: string;
  title: string;
  headers: Record<string, string>;
  status: number;
  history: string[];
}

const sessions = new Map<string, PageSession>();

function sessionKey(): string {
  return process.env.LITTLE_CODER_SESSION_ID || "default";
}

function getSession(): PageSession | null {
  return sessions.get(sessionKey()) ?? null;
}

function setSession(sess: PageSession): void {
  sessions.set(sessionKey(), sess);
}

function errorResult(text: string) {
  return {
    content: [{ type: "text" as const, text }],
    details: {},
    isError: true,
  };
}

function textResult(text: string) {
  return { content: [{ type: "text" as const, text }], details: {} };
}

const DEFAULT_TIMEOUT_MS = 15000;
const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5MB

async function headlessFetch(url: string, opts?: { signal?: AbortSignal }): Promise<{ ok: boolean; status: number; headers: Record<string, string>; body: string; url: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const signal = opts?.signal ? AbortSignal.any([controller.signal, opts.signal]) : controller.signal;

  try {
    const res = await fetch(url, {
      signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; bibo-headless/1.0)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "identity",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    const contentType = res.headers.get("content-type") || "";
    const contentLength = parseInt(res.headers.get("content-length") || "0", 10);
    if (contentLength > MAX_BODY_SIZE) {
      throw new Error(`Response body too large (${contentLength} bytes)`);
    }

    // For non-HTML, return raw text
    const isHtml = contentType.includes("text/html") || contentType.includes("application/xhtml");
    const body = await res.text();
    if (body.length > MAX_BODY_SIZE) {
      throw new Error(`Response body too large (${body.length} bytes)`);
    }

    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => { headers[k] = v; });

    return {
      ok: res.ok,
      status: res.status,
      headers,
      body,
      url: res.url,
    };
  } catch (e: any) {
    clearTimeout(timeout);
    throw e;
  }
}

async function extractReadable(html: string, url: string): Promise<{ title: string; content: string; excerpt: string }> {
  const { parseHTML } = await getLinkedom();
  const { Readability } = await getReadability();
  const turndown = await getTurndown();

  const { document } = parseHTML(html);
  const reader = new Readability(document, { nbTopCandidates: 5 });
  const article = reader.parse();

  if (!article) {
    // Fallback: extract body text
    const body = document.querySelector("body");
    const text = body ? (body.textContent || "").replace(/\s+/g, " ").trim() : "";
    return {
      title: document.title || url,
      content: text.slice(0, 8000),
      excerpt: text.slice(0, 200),
    };
  }

  // Convert to markdown
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = article.content;
  const markdown = turndown.turndown(tempDiv.innerHTML);

  return {
    title: article.title || document.title || url,
    content: markdown,
    excerpt: article.excerpt || markdown.slice(0, 200),
  };
}

export default function (pi: ExtensionAPI) {
  pi.on("session_shutdown", async () => {
    sessions.delete(sessionKey());
  });

  // ── HeadlessNavigate ──────────────────────────────────────────────────
  pi.registerTool({
    name: "HeadlessNavigate",
    label: "HeadlessNavigate",
    description:
      "Fetch a URL via HTTP and parse the HTML into readable text. No browser required. Works with static and server-rendered pages. For JS-heavy pages, content may be incomplete.",
    parameters: Type.Object({
      url: Type.String({ description: "URL to fetch (must start with http:// or https://)" }),
    }),
    async execute(_id, { url }) {
      const u = (url ?? "").trim();
      if (!u) return errorResult("Error: url is required");
      if (!u.startsWith("http://") && !u.startsWith("https://")) {
        return errorResult("Error: url must start with http:// or https://");
      }

      try {
        const res = await headlessFetch(u);
        if (!res.ok) {
          return errorResult(`HTTP ${res.status} fetching ${u}`);
        }

        const readable = await extractReadable(res.body, res.url);
        const sess: PageSession = {
          url: res.url,
          html: res.body,
          title: readable.title,
          headers: res.headers,
          status: res.status,
          history: [res.url],
        };
        setSession(sess);

        return textResult(
          `[status=${res.status}] ${res.url}\ntitle: ${readable.title}\n\n${readable.excerpt}\n\n---\n\n${readable.content.slice(0, 4000)}${readable.content.length > 4000 ? "\n\n... (truncated)" : ""}`,
        );
      } catch (e: any) {
        return errorResult(`Error fetching ${u}: ${e?.message ?? e}`);
      }
    },
  });

  // ── HeadlessExtract ─────────────────────────────────────────────────
  pi.registerTool({
    name: "HeadlessExtract",
    label: "HeadlessExtract",
    description:
      "Extract readable content from the current headless page or a given URL. Returns clean markdown text. No browser required.",
    parameters: Type.Object({
      url: Type.Optional(Type.String({ description: "Optional URL to fetch (if omitted, uses current page)" })),
      maxLength: Type.Optional(Type.Number({ description: "Maximum characters to return (default: 8000)" })),
    }),
    async execute(_id, { url, maxLength }) {
      const limit = maxLength ?? 8000;
      let html: string;
      let pageUrl: string;

      if (url) {
        const u = (url ?? "").trim();
        if (!u.startsWith("http://") && !u.startsWith("https://")) {
          return errorResult("Error: url must start with http:// or https://");
        }
        try {
          const res = await headlessFetch(u);
          if (!res.ok) return errorResult(`HTTP ${res.status} fetching ${u}`);
          html = res.body;
          pageUrl = res.url;
        } catch (e: any) {
          return errorResult(`Error fetching ${u}: ${e?.message ?? e}`);
        }
      } else {
        const sess = getSession();
        if (!sess) {
          return errorResult("No current headless page. Use HeadlessNavigate first, or pass a url.");
        }
        html = sess.html;
        pageUrl = sess.url;
      }

      try {
        const readable = await extractReadable(html, pageUrl);
        const content = readable.content.slice(0, limit);
        return textResult(
          `title: ${readable.title}\nurl: ${pageUrl}\n\n${content}${readable.content.length > limit ? "\n\n... (truncated)" : ""}`,
        );
      } catch (e: any) {
        return errorResult(`Error extracting content: ${e?.message ?? e}`);
      }
    },
  });

  // ── HeadlessBack ────────────────────────────────────────────────────
  pi.registerTool({
    name: "HeadlessBack",
    label: "HeadlessBack",
    description: "Navigate back to the previous headless page in history.",
    parameters: Type.Object({}),
    async execute() {
      const sess = getSession();
      if (!sess || sess.history.length < 2) {
        return errorResult("No previous page in history.");
      }
      const prevUrl = sess.history[sess.history.length - 2];
      try {
        const res = await headlessFetch(prevUrl);
        if (!res.ok) return errorResult(`HTTP ${res.status} fetching ${prevUrl}`);
        const readable = await extractReadable(res.body, res.url);
        sess.url = res.url;
        sess.html = res.body;
        sess.title = readable.title;
        sess.headers = res.headers;
        sess.status = res.status;
        sess.history.push(res.url);
        return textResult(
          `[status=${res.status}] ${res.url}\ntitle: ${readable.title}\n\n${readable.excerpt}`,
        );
      } catch (e: any) {
        return errorResult(`Error navigating back: ${e?.message ?? e}`);
      }
    },
  });

  // ── HeadlessHistory ───────────────────────────────────────────────────
  pi.registerTool({
    name: "HeadlessHistory",
    label: "HeadlessHistory",
    description: "Show the headless navigation history.",
    parameters: Type.Object({}),
    async execute() {
      const sess = getSession();
      if (!sess || sess.history.length === 0) {
        return textResult("No headless navigation history.");
      }
      const lines = sess.history.map((u, i) => `${i + 1}. ${u}`);
      return textResult(lines.join("\n"));
    },
  });

  // ── HeadlessSearch ────────────────────────────────────────────────────
  pi.registerTool({
    name: "HeadlessSearch",
    label: "HeadlessSearch",
    description:
      "Search the web using DuckDuckGo HTML scraper (no API key needed). Returns top results with titles, URLs, and snippets. No browser required.",
    parameters: Type.Object({
      query: Type.String({ description: "Search query" }),
      maxResults: Type.Optional(Type.Number({ description: "Maximum results (default: 5, max: 10)" })),
    }),
    async execute(_id, { query, maxResults }) {
      const q = (query ?? "").trim();
      if (!q) return errorResult("Error: query is required");
      const limit = Math.min(Math.max(1, maxResults ?? 5), 10);

      try {
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
        const res = await headlessFetch(searchUrl);
        if (!res.ok) return errorResult(`HTTP ${res.status} from search`);

        const { parseHTML } = await getLinkedom();
        const { document } = parseHTML(res.body);

        const results: Array<{ title: string; url: string; snippet: string }> = [];
        const links = document.querySelectorAll(".result__a");
        const snippets = document.querySelectorAll(".result__snippet");

        for (let i = 0; i < Math.min(links.length, snippets.length, limit); i++) {
          const a = links[i];
          const s = snippets[i];
          const href = a.getAttribute("href") || "";
          // DuckDuckGo uses redirect URLs
          const urlMatch = href.match(/uddg=([^&]+)/);
          const url = urlMatch ? decodeURIComponent(urlMatch[1]) : href;
          results.push({
            title: (a.textContent || "").trim(),
            url,
            snippet: (s.textContent || "").trim(),
          });
        }

        if (results.length === 0) {
          return textResult("No search results found. DuckDuckGo may have blocked the request.");
        }

        const lines = results.map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.snippet}`);
        return textResult(lines.join("\n\n"));
      } catch (e: any) {
        return errorResult(`Search failed: ${e?.message ?? e}`);
      }
    },
  });
}
