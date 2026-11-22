#!/bin/sh
# Record every library x scenario on an Android device or emulator (release
# build already installed). Videos go to example/proof/raw/android/.
# Usage: sh example/proof/record-android.sh <adb serial> [libs] [scenarios]
set -eu
SERIAL="${1:?usage: record-android.sh <adb serial> [libs] [scenarios]}"
LIBS="${2:-native placeholder shimmer fast}"
SCENARIOS="${3:-idle js ui storm}"
OUT="$(dirname "$0")/raw/android"
mkdir -p "$OUT"
A="timeout 30 adb -s $SERIAL"
for lib in $LIBS; do
  for sc in $SCENARIOS; do
    $A shell am force-stop com.skeletonexample
    $A shell rm -f /sdcard/proof.mp4
    # --size halves the encode work; this emulator records about 14 frames/s either way.
    timeout 20 adb -s "$SERIAL" shell screenrecord --size 540x1200 --bit-rate 6000000 --time-limit 11 /sdcard/proof.mp4 &
    REC=$!
    sleep 0.5
    # Cold start through the link, so the app reads it with Linking.getInitialURL.
    $A shell am start -W -a android.intent.action.VIEW -d "'skeletonexample://run?lib=$lib&scenario=$sc'" com.skeletonexample >/dev/null 2>&1
    wait $REC || true
    sleep 1
    $A pull /sdcard/proof.mp4 "$OUT/$lib-$sc.mp4" >/dev/null
    echo "recorded $lib-$sc"
  done
done
