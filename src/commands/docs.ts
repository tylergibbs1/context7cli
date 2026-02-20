import { Context7Client } from "../client.js";
import { failure } from "../output.js";
import { DEFAULT_TOKEN_BUDGET } from "../constants.js";
import type {
  DocsOptions,
  DocsResult,
  ConciseDoc,
  FullDoc,
  Library,
} from "../types.js";

function isLibraryId(input: string): boolean {
  return input.startsWith("/");
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function docsCommand(
  input: string,
  opts: DocsOptions
): Promise<void> {
  try {
    const client = new Context7Client(opts.apiKey);
    const detail = opts.detail ?? "concise";
    const tokenBudget = opts.tokens ?? DEFAULT_TOKEN_BUDGET;

    let libraryId: string;
    let library: Library | null = null;

    if (isLibraryId(input)) {
      libraryId = input;
    } else {
      library = await client.resolve(input, input);
      if (!library) {
        failure(
          `No library found for "${input}". Try a broader name (e.g., "react" instead of "react-hooks") or run: context7 search ${input} to browse available libraries.`
        );
      }
      libraryId = library.id;
    }

    const query = opts.topic || "documentation";
    const allDocs = await client.getDocs(query, libraryId);

    // Apply token budget
    const included: FullDoc[] = [];
    let usedTokens = 0;

    for (const doc of allDocs) {
      const docTokens = doc.tokens || estimateTokens(doc.content);
      if (usedTokens + docTokens > tokenBudget && included.length > 0) {
        break;
      }
      included.push(doc);
      usedTokens += docTokens;
    }

    const remaining = allDocs.length - included.length;
    const truncatedMsg =
      remaining > 0
        ? `Result truncated at ${tokenBudget} tokens. ${remaining} more snippet${remaining === 1 ? "" : "s"} available. Use --tokens ${tokenBudget * 2} or --topic to narrow results.`
        : undefined;

    let result: DocsResult;

    if (detail === "full") {
      result = {
        ok: true,
        library: library
          ? { id: library.id, name: library.name, snippets: library.totalSnippets, trustScore: library.trustScore }
          : { id: libraryId, name: libraryId, snippets: allDocs.length, trustScore: 0 },
        data: included,
        truncated: truncatedMsg,
      };
    } else {
      const conciseDocs: ConciseDoc[] = included.map((d) => ({
        title: d.title,
        content: d.content,
      }));

      result = {
        ok: true,
        library: library?.name ?? libraryId,
        libraryId,
        data: conciseDocs,
        truncated: truncatedMsg,
      };
    }

    process.stdout.write(JSON.stringify(result) + "\n");
    process.exit(0);
  } catch (err) {
    failure(err instanceof Error ? err.message : String(err));
  }
}
