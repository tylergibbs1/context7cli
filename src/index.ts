#!/usr/bin/env node
import { searchCommand } from "./commands/search.js";
import { docsCommand } from "./commands/docs.js";
import { failure } from "./output.js";
import type { DetailLevel } from "./types.js";

function parseArgs(args: string[]): {
  command: string;
  positional: string[];
  flags: Record<string, string>;
} {
  const flags: Record<string, string> = {};
  const positional: string[] = [];
  let command = "";

  let i = 0;
  while (i < args.length) {
    const arg = args[i]!;
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i += 2;
      } else {
        flags[key] = "true";
        i++;
      }
    } else if (!command) {
      command = arg;
      i++;
    } else {
      positional.push(arg);
      i++;
    }
  }

  return { command, positional, flags };
}

const USAGE = `context7 - Context7 CLI for AI agents

Commands:
  search <library>                      Browse available libraries
  docs <name-or-id> [--topic T]         Fetch docs (auto-resolves names to IDs)

Flags:
  --api-key <key>        Context7 API key (or set CONTEXT7_API_KEY)
  --topic <topic>        Focus documentation on a specific topic
  --tokens <number>      Token budget for docs (default: 10000)
  --detail <concise|full> Response detail level (default: concise)
  --help                 Show this help

All output is JSON to stdout. Errors exit with code 1.`;

async function main(): Promise<void> {
  const raw = process.argv.slice(2);

  if (raw.length === 0) {
    process.stderr.write(USAGE + "\n");
    failure("No command provided. Run: context7 search <name> or context7 docs <name-or-id>");
  }

  const { command, positional, flags } = parseArgs(raw);

  if (flags["help"] || command === "help") {
    process.stderr.write(USAGE + "\n");
    process.exit(0);
  }

  const apiKey = flags["api-key"];
  const detail = (flags["detail"] as DetailLevel) || undefined;

  switch (command) {
    case "search": {
      const name = positional[0];
      if (!name) failure("Usage: context7 search <library>");
      await searchCommand(name, { apiKey, detail });
      break;
    }

    case "docs": {
      const input = positional[0];
      if (!input) failure("Usage: context7 docs <name-or-id> [--topic T] [--tokens N]");
      const tokens = flags["tokens"] ? parseInt(flags["tokens"], 10) : undefined;
      if (tokens !== undefined && (isNaN(tokens) || tokens <= 0)) {
        failure("--tokens must be a positive number");
      }
      await docsCommand(input, {
        topic: flags["topic"],
        tokens,
        detail,
        apiKey,
      });
      break;
    }

    default:
      failure(
        `Unknown command: "${command}". Available commands: search, docs. Run: context7 --help`
      );
  }
}

main();
