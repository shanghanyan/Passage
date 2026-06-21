#!/bin/bash
# Remove quarantine (downloaded repos) and ad-hoc sign so macOS allows double-click launch.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/Launch Passage.app"

if [[ ! -d "$APP" ]]; then
  echo "Launch Passage.app not found at $APP" >&2
  exit 1
fi

chmod +x "$APP/Contents/MacOS/launcher"
xattr -cr "$APP" 2>/dev/null || true
codesign --force --deep --sign - "$APP"

echo "Done. You can double-click Launch Passage.app."
echo "If macOS still warns the first time: right-click the app → Open → Open."
