#!/usr/bin/env bash
set -euo pipefail

REPO="tylergibbs1/context7cli"
BINARY_NAME="context7"

get_latest_version() {
  curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" \
    | grep '"tag_name"' \
    | cut -d'"' -f4
}

detect_platform() {
  local os arch
  os="$(uname -s)"
  arch="$(uname -m)"

  case "$os" in
    Linux)  os="linux" ;;
    Darwin) os="darwin" ;;
    *)      echo "Unsupported OS: $os" >&2; exit 1 ;;
  esac

  case "$arch" in
    x86_64|amd64)  arch="x64" ;;
    aarch64|arm64) arch="arm64" ;;
    *)             echo "Unsupported architecture: $arch" >&2; exit 1 ;;
  esac

  echo "${os}-${arch}"
}

main() {
  local version platform url install_dir tmp

  version="${VERSION:-$(get_latest_version)}"
  if [ -z "$version" ]; then
    echo "Error: could not determine latest version." >&2
    exit 1
  fi

  platform="$(detect_platform)"
  url="https://github.com/${REPO}/releases/download/${version}/${BINARY_NAME}-${platform}"

  echo "Installing ${BINARY_NAME} ${version} (${platform})..."

  tmp="$(mktemp)"
  trap 'rm -f "$tmp"' EXIT

  curl -fsSL "$url" -o "$tmp"
  chmod +x "$tmp"

  if [ -w "/usr/local/bin" ]; then
    install_dir="/usr/local/bin"
  else
    install_dir="${HOME}/.local/bin"
    mkdir -p "$install_dir"
  fi

  mv "$tmp" "${install_dir}/${BINARY_NAME}"
  trap - EXIT

  echo "Installed ${BINARY_NAME} to ${install_dir}/${BINARY_NAME}"

  if "${install_dir}/${BINARY_NAME}" --help > /dev/null 2>&1; then
    echo "Smoke test passed."
  else
    echo "Warning: smoke test failed. The binary may not be compatible with your system." >&2
  fi

  case ":${PATH}:" in
    *":${install_dir}:"*) ;;
    *)
      echo ""
      echo "Warning: ${install_dir} is not in your PATH."
      echo "Add it with:"
      echo "  export PATH=\"${install_dir}:\$PATH\""
      ;;
  esac
}

main
