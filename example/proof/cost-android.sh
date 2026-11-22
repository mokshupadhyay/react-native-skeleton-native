#!/bin/sh
# For each library: cold-start the example with scenario=cost (a 10 s idle
# jankscope session that starts 3 s after launch), and read the CPU time of
# the main (UI) thread and of RenderThread from /proc over 8 s inside that
# session. Then pull the jankscope reports.
# Usage: sh example/proof/cost-android.sh <adb serial> [libs]
set -eu
SERIAL="${1:?usage: cost-android.sh <adb serial> [libs]}"
LIBS="${2:-none native placeholder shimmer fast}"
OUT="$(dirname "$0")/cost/android"
mkdir -p "$OUT"
A="timeout 30 adb -s $SERIAL"
ticks() { # pid -> "main_ticks render_ticks" (utime+stime, 1/100 s)
  $A shell "cat /proc/$1/task/$1/stat | cut -d')' -f2 | awk '{print \$12+\$13}'; for t in /proc/$1/task/*; do if grep -q RenderThread \$t/comm; then cut -d')' -f2 \$t/stat | awk '{print \$12+\$13}'; fi; done" | tr -d '\r' | tr '\n' ' '
}
: > "$OUT/cpu.jsonl"
for lib in $LIBS; do
  $A shell am force-stop com.skeletonexample
  $A shell am start -W -a android.intent.action.VIEW -d "'skeletonexample://run?lib=$lib&scenario=cost'" com.skeletonexample >/dev/null 2>&1
  PID="$($A shell pidof com.skeletonexample | tr -d '\r')"
  sleep 4.5
  set -- $(ticks "$PID"); M0=$1; R0=$2
  sleep 8
  set -- $(ticks "$PID"); M1=$1; R1=$2
  echo "{\"lib\":\"$lib\",\"windowS\":8,\"mainMsPerS\":$(( (M1 - M0) * 10 / 8 )),\"renderThreadMsPerS\":$(( (R1 - R0) * 10 / 8 ))}" | tee -a "$OUT/cpu.jsonl"
  sleep 3
done
$A pull /sdcard/Android/data/com.skeletonexample/files/jankscope/. "$OUT/" >/dev/null
