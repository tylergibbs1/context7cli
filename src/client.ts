import {
  API_BASE_URL,
  SEARCH_PATH,
  CONTEXT_PATH,
  DEFAULT_TIMEOUT,
  MAX_RETRIES,
  RETRY_BACKOFF_BASE,
} from "./constants.js";
import type {
  SearchResponse,
  ContextJsonResponse,
  Library,
  FullDoc,
} from "./types.js";

export class Context7Client {
  private baseUrl: string;
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.CONTEXT7_API_KEY;
    this.baseUrl = process.env.CONTEXT7_API_URL || API_BASE_URL;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      h["Authorization"] = `Bearer ${this.apiKey}`;
    }
    return h;
  }

  private async fetch<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}/${path}`);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

        const res = await fetch(url.toString(), {
          method: "GET",
          headers: this.headers(),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          const body = await res.text();
          if (res.status === 429) {
            throw new Error(
              "Rate limited. Set CONTEXT7_API_KEY env var for higher limits. Get a free key at context7.com/dashboard"
            );
          }
          let msg: string;
          try {
            const json = JSON.parse(body) as { message?: string; error?: string };
            msg = json.message || json.error || `HTTP ${res.status}`;
          } catch {
            msg = `HTTP ${res.status}: ${body.slice(0, 200)}`;
          }
          throw new Error(msg);
        }

        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          return (await res.json()) as T;
        }
        return (await res.text()) as T;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, Math.exp(attempt) * RETRY_BACKOFF_BASE));
        }
      }
    }

    throw lastError ?? new Error("Request failed after retries");
  }

  async searchLibraries(
    query: string,
    libraryName: string
  ): Promise<Library[]> {
    const raw = await this.fetch<SearchResponse>(SEARCH_PATH, {
      query,
      libraryName,
    });

    if (raw.error) {
      throw new Error(raw.error);
    }

    return raw.results.map((r) => ({
      id: r.id,
      name: r.title,
      description: r.description,
      totalSnippets: r.totalSnippets,
      trustScore: r.trustScore ?? 0,
      benchmarkScore: r.benchmarkScore ?? 0,
      versions: r.versions,
    }));
  }

  async getDocs(
    query: string,
    libraryId: string
  ): Promise<FullDoc[]> {
    const raw = await this.fetch<ContextJsonResponse>(CONTEXT_PATH, {
      query,
      libraryId,
      type: "json",
    });

    const docs: FullDoc[] = [];

    if (raw.codeSnippets) {
      for (const s of raw.codeSnippets) {
        const title = s.pageTitle
          ? `${s.pageTitle} > ${s.codeTitle}`
          : s.codeTitle;
        docs.push({
          title,
          content: s.codeList.map((c) => c.code).join("\n\n"),
          type: "code",
          tokens: s.codeTokens ?? 0,
          language: s.codeLanguage || undefined,
        });
      }
    }

    if (raw.infoSnippets) {
      for (const s of raw.infoSnippets) {
        docs.push({
          title: s.breadcrumb || s.pageId,
          content: s.content,
          type: "info",
          tokens: s.contentTokens ?? 0,
        });
      }
    }

    return docs;
  }

  async resolve(query: string, libraryName: string): Promise<Library | null> {
    const libs = await this.searchLibraries(query, libraryName);
    if (libs.length === 0) return null;
    return libs.sort(
      (a, b) => b.trustScore - a.trustScore || b.totalSnippets - a.totalSnippets
    )[0] ?? null;
  }
}
