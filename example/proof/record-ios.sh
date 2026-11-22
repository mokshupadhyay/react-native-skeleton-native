#!/bin/sh
# Record every library x scenario on an iOS simulator (release build already
# installed). Videos go to example/proof/raw/ios/.
# Usage: sh example/proof/record-ios.sh <simulator udid> [libs] [scenarios]
set -eu
UDID="${1:?usage: record-ios.sh <simulator udid> [libs] [scenarios]}"
LIBS="${2:-native placeholder shimmer fast}"
SCENARIOS="${3:-idle js ui storm}"
B=org.reactjs.native.example.SkeletonExample
OUT="$(dirname "$0")/raw/ios"
mkdir -p "$OUT"
for lib in $LIBS; do
  for sc in $SCENARIOS; do
    timeout 30 xcrun simctl terminate "$UDID" "$B" 2>/dev/null || true
    rm -f "$OUT/$lib-$sc.mov"
    timeout 30 xcrun simctl io "$UDID" recordVideo --codec h264 --force "$OUT/$lib-$sc.mov" >/dev/null 2>&1 &
    REC=$!
    sleep 1
    # The link goes in as a launch argument (read from NSUserDefaults by the
    # example), because `simctl openurl` shows a confirmation alert.
    timeout 30 xcrun simctl launch "$UDID" "$B" -skeletonUrl "skeletonexample://run?lib=$lib&scenario=$sc" >/dev/null
    sleep 9
    kill -INT $REC
    wait $REC || true
    echo "recorded $lib-$sc"
  done
done
