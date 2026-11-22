#!/bin/sh
# Compile-check the Android Java sources without an app: javac against the
# Android SDK's android.jar and the react-android AAR from the local Gradle
# cache (put there by any React Native app build). Both source sets are
# compiled: main + oldarch, and main + newarch + the Java interfaces and
# delegates codegen generates from src/specs. A stub R class stands in for the
# resources (the real one comes from the app build). Nothing is downloaded.
# This proves the code compiles; it does not prove it works on a device.
#
# Usage: sh scripts/android-compile-check.sh [react-native-version]
set -eu

RN_VERSION="${1:-$(node -p "require('react-native/package.json').version")}"
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
CACHE="$HOME/.gradle/caches/modules-2/files-2.1"
OUT="android/build/compile-check"
PKG_DIR="com/skeletonnative"

fail() { echo "compile-check: $*" >&2; exit 1; }
find_one() { find "$CACHE/$1" -name "$2" 2>/dev/null | sort | tail -n 1; }

[ -n "$SDK" ] || fail "ANDROID_HOME is not set"
# ANDROID_PLATFORM picks the platform, for example android-36 (the default when installed).
PLATFORM="${ANDROID_PLATFORM:-android-36}"
ANDROID_JAR="$SDK/platforms/$PLATFORM/android.jar"
[ -f "$ANDROID_JAR" ] || ANDROID_JAR="$(ls -d "$SDK"/platforms/android-*/android.jar 2>/dev/null | sort -V | tail -n 1)"
[ -f "$ANDROID_JAR" ] || fail "no android.jar under $SDK/platforms"

AAR="${REACT_NATIVE_AAR:-$(find_one "com.facebook.react/react-android/$RN_VERSION" "react-android-$RN_VERSION-release.aar")}"
# A debug build only caches the debug AAR; its Java API is the same.
[ -n "$AAR" ] || AAR="$(find_one "com.facebook.react/react-android/$RN_VERSION" "react-android-$RN_VERSION-debug.aar")"
[ -n "$AAR" ] && [ -f "$AAR" ] || fail "react-android $RN_VERSION is not in $CACHE; build any React Native $RN_VERSION app once, or set REACT_NATIVE_AAR"
ANNOTATION="$(find_one androidx.annotation 'annotation-jvm-*.jar')"
[ -n "$ANNOTATION" ] || ANNOTATION="$(find_one androidx.annotation 'annotation-1.*.jar')"
JSR305="$(find_one com.google.code.findbugs 'jsr305-3*.jar')"
PROGUARD="$(find_one com.facebook.yoga 'proguard-annotations-*.jar')"
INFER="$(find_one com.facebook.infer.annotation 'infer-annotation-*.jar')"
KOTLIN="$(find_one org.jetbrains.kotlin 'kotlin-stdlib-[0-9]*.jar')"
KOTLIN_ANNOTATIONS="$(find_one org.jetbrains.kotlin 'kotlin-annotations-jvm-*.jar')"
for jar in "$ANNOTATION" "$JSR305" "$PROGUARD" "$INFER"; do
  [ -n "$jar" ] || fail "a support jar is missing from $CACHE (androidx.annotation, jsr305, proguard-annotations, infer-annotation)"
done

rm -rf "$OUT"
mkdir -p "$OUT/aar" "$OUT/codegen" "$OUT/stub/$PKG_DIR" "$OUT/classes-oldarch" "$OUT/classes-newarch"
(cd "$OUT/aar" && unzip -q -o "$AAR" classes.jar)

# Stub R with one int per resource file, like the class the app build generates.
node -e "
  const fs = require('fs');
  const res = 'android/src/main/res';
  const groups = fs.readdirSync(res).map((type) => {
    const fields = fs.readdirSync(res + '/' + type).map((f, i) =>
      '    public static final int ' + f.replace(/\.xml\$/, '') + ' = 0x7f0' + (i + 1).toString(16).padStart(5, '0') + ';');
    return '  public static final class ' + type + ' {\n' + fields.join('\n') + '\n  }';
  });
  fs.writeFileSync('$OUT/stub/$PKG_DIR/R.java', 'package com.skeletonnative;\n\npublic final class R {\n' + groups.join('\n') + '\n}\n');
"

node node_modules/@react-native/codegen/lib/cli/combine/combine-js-to-schema-cli.js "$OUT/codegen/schema.json" src/specs
node -e "
  const generate = require('@react-native/codegen/lib/generators/RNCodegen.js').generate;
  const schema = require(require('path').resolve('$OUT/codegen/schema.json'));
  const ok = generate(
    { libraryName: 'RNSkeletonNativeSpec', schema, outputDirectory: '$OUT/codegen/android', packageName: 'com.skeletonnative', assumeNonnull: false },
    { generators: ['componentsAndroid'] },
  );
  if (!ok) process.exit(1);
"

CP="$ANDROID_JAR:$OUT/aar/classes.jar:$ANNOTATION:$JSR305:$PROGUARD:$INFER${KOTLIN:+:$KOTLIN}${KOTLIN_ANNOTATIONS:+:$KOTLIN_ANNOTATIONS}"
JAVAC_FLAGS="-source 8 -target 8 -Xlint:all -Xlint:-options -Werror -encoding UTF-8"

echo "android.jar:   $ANDROID_JAR"
echo "react-android: $AAR"

# shellcheck disable=SC2086
javac $JAVAC_FLAGS -cp "$CP" -d "$OUT/classes-oldarch" \
  android/src/main/java/$PKG_DIR/*.java android/src/oldarch/java/$PKG_DIR/*.java "$OUT/stub/$PKG_DIR/R.java"
echo "old architecture: OK"

# Generated code is compiled first without -Werror: since React Native 0.88 it
# imports the deprecated LayoutShadowNode, which javac reports as a warning.
mkdir -p "$OUT/classes-codegen"
javac -source 8 -target 8 -nowarn -Xlint:-options -encoding UTF-8 -cp "$CP" -d "$OUT/classes-codegen" \
  "$OUT"/codegen/android/java/com/facebook/react/viewmanagers/*.java

# shellcheck disable=SC2086
javac $JAVAC_FLAGS -cp "$CP:$OUT/classes-codegen" -d "$OUT/classes-newarch" \
  android/src/main/java/$PKG_DIR/*.java android/src/newarch/java/$PKG_DIR/*.java "$OUT/stub/$PKG_DIR/R.java"
echo "new architecture: OK"
