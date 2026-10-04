# R8 rules for John AI.
#
# Everything here exists because something is resolved reflectively and would
# otherwise be removed or renamed. Rules are kept narrow on purpose: broad
# "-keep class **" rules would defeat shrinking, which is what keeps the APK
# small enough to matter on the cheap Android phones many pastors use.

# ---------------------------------------------------------------- Compose
# The Compose compiler already emits what the runtime needs; R8 ships Compose
# rules in the AARs. Only the Composer intrinsics need protecting here.
-dontwarn androidx.compose.**

# ------------------------------------------------- kotlinx.serialization
# Serializers are looked up reflectively from the companion of each @Serializable
# class, so the generated serializer and the backing fields must survive.
-keepattributes *Annotation*, InnerClasses, EnclosingMethod, Signature, RuntimeVisibleAnnotations
-dontnote kotlinx.serialization.**

-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}
-if @kotlinx.serialization.Serializable class **
-keepclassmembers class <1> {
    static <1>$Companion Companion;
    static **$* *;
}
-if @kotlinx.serialization.Serializable class ** {
    static **$* *;
}
-keepclassmembers class <2>$<3> {
    kotlinx.serialization.KSerializer serializer(...);
}

# John AI's own API models are serialized by name: keep their fields unrenamed
# so the JSON contract with the backend does not silently break.
-keep @kotlinx.serialization.Serializable class com.johnai.app.data.** { *; }

# ---------------------------------------------------------------- OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**

# ------------------------------------------------------------ Coroutines
-dontwarn kotlinx.coroutines.**
-keepclassmembers class kotlinx.coroutines.** {
    volatile <fields>;
}

# ----------------------------------------------------- Android entry points
# Instantiated by name from the manifest.
-keep class com.johnai.app.MainActivity { <init>(); }
-keep class com.johnai.app.JohnAiApplication { <init>(); }

# Keep source line numbers so a crash report from a pastor is actionable,
# but hide the original file name.
-keepattributes SourceFile, LineNumberTable
-renamesourcefileattribute SourceFile

# ------------------------------------------------- compile-time annotations
# @NotNull/@Nullable/@Language have CLASS retention and are deliberately absent
# at runtime; they are referenced by kotlinx and AndroidX bytecode but never
# loaded. AGP ships the same rules by default.
-dontwarn org.jetbrains.annotations.**
-dontwarn org.intellij.lang.annotations.**
