#!/usr/bin/env python3
"""
Fail a build whose APK references classes it does not contain.

This exists because John AI once shipped an APK that passed aapt2, d8, R8,
apksigner and a full static audit, and still could not start: Okio was absent
from the dex, OkHttp needs it, and OkHttpClient was constructed in
Application.onCreate. R8 would have reported the missing classes, but a
"-dontwarn okio.**" rule in proguard-rules.pro silenced exactly that error.

The check here cannot be silenced by a keep rule, because it reads the shipped
artifact rather than the build configuration: every type referenced by the dex
must either be defined in the dex or be provided by the Android platform.

Usage:  python3 tools/verify-apk.py dist/john-ai.apk
Exit 0 if the APK is self-contained, 1 otherwise.
"""
import struct
import sys
import zipfile

# Packages the Android runtime provides. Everything else must be in the APK.
FRAMEWORK_PREFIXES = (
    "Landroid/", "Ljava/", "Ljavax/", "Ldalvik/", "Llibcore/", "Lsun/",
    "Lorg/w3c/", "Lorg/xml/", "Lorg/xmlpull/", "Lorg/json/", "Lorg/apache/http/",
    "Lcom/android/internal/", "Ljunit/",
)

# Compile-time-only annotations: CLASS retention, never loaded at runtime.
# These are the only absences that are safe, and they are listed explicitly
# rather than wildcarded so a real missing dependency cannot hide among them.
KNOWN_SAFE = {
    "Lorg/jetbrains/annotations/NotNull;",
    "Lorg/jetbrains/annotations/Nullable;",
    "Lorg/intellij/lang/annotations/Language;",
}


def parse_dex(data: bytes):
    u4 = lambda off: struct.unpack_from("<I", data, off)[0]
    string_ids_size, string_ids_off = u4(56), u4(60)
    type_ids_size, type_ids_off = u4(64), u4(68)
    class_defs_size, class_defs_off = u4(96), u4(100)

    def uleb128(off):
        result = shift = 0
        while True:
            byte = data[off]
            off += 1
            result |= (byte & 0x7F) << shift
            shift += 7
            if not byte & 0x80:
                return result, off

    strings = []
    for i in range(string_ids_size):
        _, start = uleb128(u4(string_ids_off + 4 * i))
        strings.append(data[start:data.index(b"\0", start)].decode("utf-8", "replace"))

    types = [strings[u4(type_ids_off + 4 * i)] for i in range(type_ids_size)]
    defined = {types[u4(class_defs_off + 32 * i)] for i in range(class_defs_size)}
    return set(types), defined


def main(path: str) -> int:
    apk = zipfile.ZipFile(path)
    dex_names = sorted(n for n in apk.namelist() if n.endswith(".dex"))
    if not dex_names:
        print(f"FAIL  {path} contains no dex file")
        return 1

    referenced, defined = set(), set()
    for name in dex_names:
        ref, dfn = parse_dex(apk.read(name))
        referenced |= ref
        defined |= dfn
        print(f"  {name}: {len(ref)} referenced types, {len(dfn)} defined classes")

    missing = sorted(
        t for t in referenced
        if t.startswith("L") and t.endswith(";")
        and t not in defined
        and not t.startswith(FRAMEWORK_PREFIXES)
        and t not in KNOWN_SAFE
    )

    if missing:
        print(f"\nFAIL  {len(missing)} class(es) referenced but not packaged:")
        for m in missing:
            print(f"        {m}")
        print("\n  The app will throw NoClassDefFoundError when these are touched.")
        print("  Add the missing library to the dexing classpath - do NOT add a")
        print("  -dontwarn rule, which hides the problem instead of fixing it.")
        return 1

    print(f"\nPASS  {path} is self-contained "
          f"({len(defined)} classes, every reference resolves)")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
