// Context7 API response types

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  branch: string;
  lastUpdateDate: string;
  state: "initial" | "finalized" | "error" | "delete";
  totalTokens: number;
  totalSnippets: number;
  stars?: number;
  trustScore?: number;
  benchmarkScore?: number;
  versions?: string[];
}

export interface SearchResponse {
  error?: string;
  results: SearchResult[];
}

export interface CodeSnippet {
  codeTitle: string;
  codeDescription: string;
  codeLanguage: string;
  codeList: { language: string; code: string }[];
  codeId: string;
  codeTokens?: number;
  pageTitle?: string;
}

export interface InfoSnippet {
  content: string;
  breadcrumb?: string;
  pageId: string;
  contentTokens?: number;
}

export interface ContextJsonResponse {
  codeSnippets: CodeSnippet[];
  infoSnippets: InfoSnippet[];
}

// CLI output types - designed for agent consumption

export interface Library {
  id: string;
  name: string;
  description: string;
  totalSnippets: number;
  trustScore: number;
  benchmarkScore: number;
  versions?: string[];
}

export interface ConciseDoc {
  title: string;
  content: string;
}

export interface FullDoc {
  title: string;
  content: string;
  type: "code" | "info";
  tokens: number;
  language?: string;
}

export type DetailLevel = "concise" | "full";

export interface ConciseDocsResult {
  ok: true;
  library: string;
  libraryId: string;
  data: ConciseDoc[];
  truncated?: string;
}

export interface FullDocsResult {
  ok: true;
  library: { id: string; name: string; snippets: number; trustScore: number };
  data: FullDoc[];
  truncated?: string;
}

export type DocsResult = ConciseDocsResult | FullDocsResult;

// CLI result envelope - every command returns this shape
export interface CLIResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

// Command option types
export interface SearchOptions {
  apiKey?: string;
  detail?: DetailLevel;
}

export interface DocsOptions {
  topic?: string;
  tokens?: number;
  detail?: DetailLevel;
  apiKey?: string;
}
