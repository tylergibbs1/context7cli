# context7cli

CLI for AI agents to fetch up-to-date library documentation from [Context7](https://context7.com).

Two commands. No intermediate steps. Token-budgeted responses.

## Install

### npm

```bash
npm install -g @grayhaven/context7cli
```

### Homebrew (macOS)

```bash
brew install tylergibbs1/context7cli/context7cli
```

### curl (macOS / Linux / WSL)

```bash
curl -fsSL https://raw.githubusercontent.com/tylergibbs1/context7cli/main/install.sh | bash
```

Pin a version:

```bash
VERSION=v0.1.0 curl -fsSL https://raw.githubusercontent.com/tylergibbs1/context7cli/main/install.sh | bash
```

### PowerShell (Windows)

```powershell
irm https://raw.githubusercontent.com/tylergibbs1/context7cli/main/install.ps1 | iex
```

Pin a version:

```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/tylergibbs1/context7cli/main/install.ps1))) -Version v0.1.0
```

### From source

```bash
git clone https://github.com/tylergibbs1/context7cli.git
cd context7cli
bun install
bun run build
```

The built CLI is at `dist/index.js`. Link it globally with `npm link`.

## Commands

### `search` — browse available libraries

```bash
context7 search <library>
```

```bash
context7 search react
# {"ok":true,"data":[{"id":"/websites/react_dev","name":"React","description":"..."},…]}
```

With full metadata:

```bash
context7 search react --detail full
# {"ok":true,"data":[{"id":"/websites/react_dev","name":"React","description":"...","totalSnippets":2922,"trustScore":10,"benchmarkScore":95.1,"versions":[]},…]}
```

### `docs` — fetch documentation

Accepts a library **name** (auto-resolves) or **ID** (direct lookup).

```bash
context7 docs <name-or-id> [--topic T] [--tokens N] [--detail concise|full]
```

```bash
# By name (auto-resolves to best match)
context7 docs nextjs --topic routing

# By ID (skips resolution)
context7 docs /vercel/next.js --topic routing

# Limit token budget
context7 docs nextjs --tokens 2000

# Full metadata (type, tokens, language per snippet)
context7 docs nextjs --topic hooks --detail full
```

**Concise response** (default):

```json
{
  "ok": true,
  "library": "Next.js",
  "libraryId": "/vercel/next.js",
  "data": [
    { "title": "App Router > Routing", "content": "..." }
  ]
}
```

**Full response** (`--detail full`):

```json
{
  "ok": true,
  "library": { "id": "/vercel/next.js", "name": "Next.js", "snippets": 2922, "trustScore": 10 },
  "data": [
    { "title": "App Router > Routing", "content": "...", "type": "code", "tokens": 450, "language": "typescript" }
  ]
}
```

**Truncation** — when results exceed the token budget, a steering message is appended:

```json
{
  "truncated": "Result truncated at 2000 tokens. 3 more snippets available. Use --tokens 4000 or --topic to narrow results."
}
```

## Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--api-key <key>` | Context7 API key (or set `CONTEXT7_API_KEY` env var) | — |
| `--topic <topic>` | Focus docs on a specific topic | `"documentation"` |
| `--tokens <number>` | Token budget for docs response | `10000` |
| `--detail <concise\|full>` | Response detail level | `concise` |
| `--help` | Show help | — |

## Authentication

Optional. Set `CONTEXT7_API_KEY` for higher rate limits:

```bash
export CONTEXT7_API_KEY=your-key-here
```

Get a free key at [context7.com/dashboard](https://context7.com/dashboard).

## Development

```bash
bun run dev              # run from source
bun run typecheck        # type check
bun run build            # bundle to dist/
bun test                 # run tests
```

## License

MIT
