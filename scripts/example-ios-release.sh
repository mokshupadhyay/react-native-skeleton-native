#!/bin/sh
# Pack the library into the example app, build the Release configuration for
# the simulator, install it and launch it. Open a scenario afterwards with
#   xcrun simctl openurl <udid> 'skeletonexample://run?lib=native&scenario=idle'
# Set RCT_NEW_ARCH_ENABLED=0 to build the old architecture (React Native
# versions that still have it; 0.82 and later always use the New Architecture).
# Usage: sh scripts/example-ios-release.sh <simulator udid>
set -eu
UDID="${1:?usage: example-ios-release.sh <simulator udid>}"
BUNDLE_ID=org.reactjs.native.example.SkeletonExample
npm run example:install >/dev/null
(cd example/ios && timeout 1800 pod install >/dev/null)
(cd example/ios && timeout 3600 xcodebuild -workspace SkeletonExample.xcworkspace -scheme SkeletonExample \
  -configuration Release -sdk iphonesimulator -destination "id=$UDID" -derivedDataPath build -quiet)
timeout 120 xcrun simctl install "$UDID" example/ios/build/Build/Products/Release-iphonesimulator/SkeletonExample.app
timeout 30 xcrun simctl terminate "$UDID" "$BUNDLE_ID" 2>/dev/null || true
timeout 30 xcrun simctl launch "$UDID" "$BUNDLE_ID"
