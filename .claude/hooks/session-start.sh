#!/bin/bash
# SessionStart hook for Claude Code on the web.
# The project is a single self-contained index.html with no dependencies,
# so there is nothing to install; just confirm Node is available and that
# the page's payload and script are sound before work begins.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

if ! command -v node >/dev/null 2>&1; then
  echo "node not found; scripts/check.mjs will not run" >&2
  exit 0
fi

node scripts/check.mjs index.html || echo "index.html check failed; see output above" >&2
