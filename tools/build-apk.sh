#!/usr/bin/env bash
#
# Builds a signed, installable debug APK for John AI WITHOUT Gradle or the
# Android Gradle Plugin, by driving the underlying tools directly:
#
#   aapt2 compile/link  ->  resources.arsc + R ids
#   kotlinc + Compose compiler plugin  ->  .class files
#   d8  ->  classes.dex (+ classes2.dex)
#   zip + apksigner  ->  signed APK
#
# This exists because the environment this project was built in could not reach
# dl.google.com, maven.google.com, repo1.maven.org or services.gradle.org, so
# `gradle :app:assembleDebug` was impossible. On a normal machine prefer:
#
#   gradle wrapper && ./gradlew :app:assembleDebug
#
# Point these at your own tooling before running.
#   ANDROID_JAR   android.jar for the compile SDK (API 34)
#   KOTLINC       kotlinc executable (Kotlin 2.0.x)
#   COMPOSE_PLUGIN  kotlin-compose-compiler-plugin jar matching KOTLINC
#   SERIALIZATION_PLUGIN  kotlinx-serialization compiler plugin jar
#   AAPT2, D8_JAR, APKSIGNER_JAR  from Android build-tools
#   LIBS_DIR      directory of the runtime/compile jars (AndroidX, Compose,
#                 kotlinx, okhttp, okio, kotlin-stdlib)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${OUT:-$ROOT/dist}"
WORK="${WORK:-$(mktemp -d)}"

: "${ANDROID_JAR:?set ANDROID_JAR}"
: "${KOTLINC:?set KOTLINC}"
: "${COMPOSE_PLUGIN:?set COMPOSE_PLUGIN}"
: "${SERIALIZATION_PLUGIN:?set SERIALIZATION_PLUGIN}"
: "${AAPT2:?set AAPT2}"
: "${D8_JAR:?set D8_JAR}"
: "${APKSIGNER_JAR:?set APKSIGNER_JAR}"
: "${LIBS_DIR:?set LIBS_DIR}"

API_BASE_URL="${API_BASE_URL:-http://10.0.2.2:8787}"
MAIN="$ROOT/app/src/main"
mkdir -p "$OUT" "$WORK/flat" "$WORK/gen" "$WORK/classes" "$WORK/dex"

echo "==> manifest (the values AGP would inject from build.gradle.kts)"
python3 - "$MAIN/AndroidManifest.xml" "$WORK/AndroidManifest.xml" <<'PY'
import sys
src = open(sys.argv[1]).read()
src = src.replace(
    '<manifest xmlns:android="http://schemas.android.com/apk/res/android">',
    '<manifest xmlns:android="http://schemas.android.com/apk/res/android"\n'
    '    package="com.johnai.app"\n'
    '    android:versionCode="1"\n'
    '    android:versionName="0.1.0">\n\n'
    '    <uses-sdk android:minSdkVersion="26" android:targetSdkVersion="34" />')
open(sys.argv[2], 'w').write(src)
PY

echo "==> aapt2: compile and link resources"
"$AAPT2" compile --dir "$MAIN/res" -o "$WORK/flat/res.zip"
"$AAPT2" link -o "$WORK/base.apk" \
    -I "$ANDROID_JAR" \
    --manifest "$WORK/AndroidManifest.xml" \
    --java "$WORK/gen" \
    --min-sdk-version 26 --target-sdk-version 34 \
    --auto-add-overlay \
    "$WORK/flat/res.zip"

echo "==> generate the R and BuildConfig sources AGP would generate"
python3 - "$WORK/gen/com/johnai/app/R.java" "$WORK/gen/R.kt" <<'PY'
import re, sys
src = open(sys.argv[1]).read()
out = ["// Generated from the aapt2 link output; ids match resources.arsc.",
       "package com.johnai.app", "", "object R {"]
for m in re.finditer(r'public static final class (\w+) \{(.*?)\n  \}', src, re.S):
    out.append(f"    object {m.group(1)} {{")
    for n, v in re.findall(r'public static final int (\w+)\s*=\s*(0x[0-9a-fA-F]+);', m.group(2)):
        out.append(f"        const val {n} = {v}")
    out.append("    }")
out.append("}")
open(sys.argv[2], 'w').write("\n".join(out) + "\n")
PY
cat > "$WORK/gen/BuildConfig.kt" <<EOF
package com.johnai.app
object BuildConfig {
    const val JOHN_API_BASE_URL: String = "$API_BASE_URL"
    const val DEBUG: Boolean = true
}
EOF

echo "==> kotlinc: compile the Compose sources"
CP="$(find "$LIBS_DIR" -name '*.jar' | tr '\n' ':')$ANDROID_JAR"
"$KOTLINC" -J-Xmx6g \
    -Xplugin="$COMPOSE_PLUGIN" \
    -Xplugin="$SERIALIZATION_PLUGIN" \
    -jvm-target 17 -nowarn -cp "$CP" \
    $(find "$MAIN" -name '*.kt') "$WORK/gen/BuildConfig.kt" "$WORK/gen/R.kt" \
    -d "$WORK/classes"

echo "==> d8: dex app classes and runtime libraries"
java -Xmx3g -cp "$D8_JAR" com.android.tools.r8.D8 \
    --release --min-api 26 \
    --lib "$ANDROID_JAR" \
    --output "$WORK/dex" \
    $(find "$LIBS_DIR" -name '*.jar') \
    $(find "$WORK/classes" -name '*.class')

echo "==> package: resources + dex, resources.arsc stored and 4-byte aligned"
python3 - "$WORK/base.apk" "$WORK/dex" "$WORK/unsigned.apk" <<'PY'
import sys, zipfile, os
base, dexdir, dest = sys.argv[1:4]
src = zipfile.ZipFile(base)
out = zipfile.ZipFile(dest, 'w')

def add(name, data, stored, align=4):
    zi = zipfile.ZipInfo(name, date_time=(1981, 1, 1, 0, 0, 0))
    zi.compress_type = zipfile.ZIP_STORED if stored else zipfile.ZIP_DEFLATED
    zi.external_attr = 0o644 << 16
    if stored:
        offset = out.fp.tell() + 30 + len(name.encode())
        zi.extra = b'\0' * ((align - (offset % align)) % align)
    out.writestr(zi, data)

for i in src.infolist():
    add(i.filename, src.read(i.filename),
        i.filename == 'resources.arsc' or i.compress_type == zipfile.ZIP_STORED)
for d in sorted(os.listdir(dexdir)):
    if d.endswith('.dex'):
        add(d, open(os.path.join(dexdir, d), 'rb').read(), False)
out.close()
PY

echo "==> sign"
if [ ! -f "$OUT/debug.pk8" ]; then
    openssl req -x509 -newkey rsa:2048 -keyout "$WORK/key.pem" -out "$OUT/debug.pem" \
        -days 10000 -nodes -subj "/CN=John AI Debug/O=John AI/C=IN" 2>/dev/null
    openssl pkcs8 -topk8 -inform PEM -outform DER -in "$WORK/key.pem" -out "$OUT/debug.pk8" -nocrypt
fi
java -jar "$APKSIGNER_JAR" sign \
    --key "$OUT/debug.pk8" --cert "$OUT/debug.pem" \
    --min-sdk-version 26 \
    --out "$OUT/john-ai-debug.apk" "$WORK/unsigned.apk"
java -jar "$APKSIGNER_JAR" verify --verbose --min-sdk-version 26 "$OUT/john-ai-debug.apk"

echo
echo "APK: $OUT/john-ai-debug.apk"
