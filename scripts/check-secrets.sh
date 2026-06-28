#!/usr/bin/env bash
#
# Lightweight secret scanner. Run with: bash scripts/check-secrets.sh
#
# Fails (exit 1) if it finds likely secrets or a committed real .env file.
# This is a guardrail, not a replacement for a dedicated secret scanner.
# It is intentionally read-only and never sends data anywhere.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

EXCLUDES=(':!node_modules' ':!dist' ':!coverage' ':!package-lock.json' ':!*.png' ':!*.jpg' ':!*.jpeg' ':!*.webp')

# Patterns that strongly indicate a leaked secret.
PATTERNS=(
  '-----BEGIN [A-Z ]*PRIVATE KEY-----'
  'AKIA[0-9A-Z]{16}'
  'aws_secret_access_key'
  'xox[baprs]-[0-9A-Za-z-]{10,}'
  'ghp_[0-9A-Za-z]{30,}'
  'sk-[A-Za-z0-9]{20,}'
  '(api[_-]?key|secret|token|password)\s*[:=]\s*["'"'"'][A-Za-z0-9_\-]{16,}["'"'"']'
)

found=0

# 1) A real .env file must never be committed (only .env.example is allowed).
if [ -f ".env" ]; then
  echo "ERROR: a real .env file exists. Never commit secrets (.env.example only)."
  found=1
fi

# 2) Scan tracked + untracked (but not ignored) text files for secret patterns.
#    Falls back to a filesystem grep if not in a git repo.
scan() {
  local pattern="$1"
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git grep -nIE "$pattern" -- . "${EXCLUDES[@]}" 2>/dev/null || true
  else
    grep -rnIE --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git "$pattern" . 2>/dev/null || true
  fi
}

for pattern in "${PATTERNS[@]}"; do
  matches="$(scan "$pattern")"
  if [ -n "$matches" ]; then
    echo "ERROR: potential secret matching /$pattern/:"
    echo "$matches"
    found=1
  fi
done

if [ "$found" -ne 0 ]; then
  echo ""
  echo "Secret scan FAILED. Remove the secret and rotate it if it was ever committed."
  exit 1
fi

echo "Secret scan passed: no obvious secrets found."
