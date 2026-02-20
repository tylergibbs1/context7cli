#!/usr/bin/env bash
set -euo pipefail

OUTDIR="binaries"
ENTRY="src/index.ts"

mkdir -p "$OUTDIR"

targets=(
  "bun-linux-x64:context7-linux-x64"
  "bun-linux-arm64:context7-linux-arm64"
  "bun-darwin-x64:context7-darwin-x64"
  "bun-darwin-arm64:context7-darwin-arm64"
  "bun-windows-x64:context7-windows-x64.exe"
)

for entry in "${targets[@]}"; do
  target="${entry%%:*}"
  output="${entry##*:}"
  echo "Building $output ($target)..."
  bun build "$ENTRY" --compile --target "$target" --outfile "$OUTDIR/$output"
done

echo ""
echo "Built binaries:"
ls -lh "$OUTDIR"/
