#!/bin/sh
# Pack the library into the example app, then build, install and launch the
# Android release build on one device. Open a scenario afterwards with
#   adb shell am start -a android.intent.action.VIEW -d 'skeletonexample://run?lib=native&scenario=idle'
# Usage: sh scripts/example-android-release.sh <adb serial>
set -eu
SERIAL="${1:?usage: example-android-release.sh <adb serial>}"
npm run example:install >/dev/null
(cd example/android && timeout 3000 ./gradlew assembleRelease --console=plain -q)
timeout 180 adb -s "$SERIAL" install -r example/android/app/build/outputs/apk/release/app-release.apk
timeout 20 adb -s "$SERIAL" shell am force-stop com.skeletonexample
timeout 20 adb -s "$SERIAL" shell am start -n com.skeletonexample/.MainActivity
