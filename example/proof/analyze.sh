#!/bin/sh
# Longest frozen stretch for every recording in a folder.
# Usage: sh example/proof/analyze.sh <folder> <list crop w:h:x:y> <marker crop w:h:x:y> [threshold]
set -eu
DIR="$1"; CROP="$2"; MARKER="$3"; T="${4:-0.01}"
for f in "$DIR"/*.mp4 "$DIR"/*.mov; do
  [ -f "$f" ] || continue
  timeout 120 node "$(dirname "$0")/../../scripts/motion-analyze.mjs" "$f" --crop "$CROP" --marker "$MARKER" --window 2 --threshold "$T" --json || echo "{\"video\":\"$f\",\"error\":true}"
done
