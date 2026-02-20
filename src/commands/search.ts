import { Context7Client } from "../client.js";
import { success, failure } from "../output.js";
import type { SearchOptions } from "../types.js";

export async function searchCommand(
  libraryName: string,
  opts: SearchOptions
): Promise<void> {
  try {
    const client = new Context7Client(opts.apiKey);
    const results = await client.searchLibraries(libraryName, libraryName);

    if (results.length === 0) {
      failure(
        `No libraries found for "${libraryName}". Try a broader search term (e.g., "react" instead of "react-hooks").`
      );
    }

    if (opts.detail === "full") {
      success(results);
    } else {
      success(
        results.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
        }))
      );
    }
  } catch (err) {
    failure(err instanceof Error ? err.message : String(err));
  }
}
