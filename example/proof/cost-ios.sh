#!/bin/sh
# For each library: launch the example with scenario=cost (a 10 s idle
# jankscope session starting 3 s after launch) and read, over 8 s inside that
# session, the CPU time of the app's main thread and of the simulator's
# backboardd (which hosts the render server in the simulator runtime). Then
# copy the jankscope reports. Simulator only: the processes run on the Mac.
# Usage: sh example/proof/cost-ios.sh <simulator udid> [libs]
set -eu
UDID="${1:?usage: cost-ios.sh <simulator udid> [libs]}"
LIBS="${2:-none native placeholder shimmer fast}"
B=org.reactjs.native.example.SkeletonExample
OUT="$(dirname "$0")/cost/ios"
mkdir -p "$OUT"
# "m:ss.cc" + "m:ss.cc" (system, user) -> centiseconds
cs() { awk '{ split($1, s, "[:.]"); split($2, u, "[:.]"); print (s[1]*60+s[2])*100+s[3] + (u[1]*60+u[2])*100+u[3] }'; }
main_cs() { ps -M -p "$1" | sed -n 2p | awk '{print $7, $8}' | cs; }
proc_cs() { ps -o stime=,utime= -p "$1" 2>/dev/null | awk '{print $1, $2}' | cs; }
BB="$(pgrep -f "$UDID.*backboardd" | head -1 || true)"
[ -n "$BB" ] || BB="$(pgrep -f "iOS 26.2.simruntime.*backboardd" | head -1)"
: > "$OUT/cpu.jsonl"
for lib in $LIBS; do
  timeout 30 xcrun simctl terminate "$UDID" "$B" 2>/dev/null || true
  sleep 1
  PID="$(timeout 30 xcrun simctl launch "$UDID" "$B" -skeletonUrl "skeletonexample://run?lib=$lib&scenario=cost" | awk '{print $NF}')"
  sleep 4.5
  M0=$(main_cs "$PID"); R0=$(proc_cs "$BB")
  sleep 8
  M1=$(main_cs "$PID"); R1=$(proc_cs "$BB")
  echo "{\"lib\":\"$lib\",\"windowS\":8,\"mainMsPerS\":$(( (M1 - M0) * 10 / 8 )),\"backboarddMsPerS\":$(( (R1 - R0) * 10 / 8 ))}" | tee -a "$OUT/cpu.jsonl"
  sleep 3
done
DATA="$(timeout 30 xcrun simctl get_app_container "$UDID" "$B" data)"
cp "$DATA"/Documents/jankscope/cost-*.json "$OUT/"
