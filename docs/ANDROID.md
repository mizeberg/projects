# GATENOVA for Android

This project includes a complete installable Android package of the current GATENOVA core application. The interface, starter lessons, practice questions, illustrations, fonts and Nova's local lesson guide are bundled in the APK. The installed app runs independently of the web server.

## Release identity

- App: **GATENOVA**
- Package: `io.gatenova.app`
- Version: `1.0.0`, Android version code `1`
- Minimum: Android 8.0 / API 26
- Target: Android 16 / API 36
- Architectures: universal (no packaged native machine-code libraries)
- Permissions: no Internet, camera, microphone or broad storage permission
- Storage: private on-device WebView storage; retained across updates signed with the same key. Uninstalling or clearing app storage removes it.

The Android edition shows an on-device profile and does not offer cloud sign-in. A separately deployed backend is required before adding cloud account sync. Nova uses the authored local lesson guide; external AI, RAG, verified PYQs and a full official syllabus are not part of this release.

## Install from GitHub

1. Open the **Download GATENOVA APK** link in the repository README on your Android phone.
2. Download **gatenova-1.0.0-android.apk**. The source ZIP is for developers and is not installable.
3. Open the downloaded APK. If Android asks, allow **Install unknown apps** for the browser or file manager used to open it.
4. Tap **Install**, then **Open**.
5. Use the workspace switcher or Profile → Personalize your journey to set your name, branch, target and daily availability.

No login or server URL is needed. File import and export use Android's document picker. Keep the Android System WebView component current. The APK is for Android; it cannot be installed on an iPhone.

## Build requirements

- Node.js 24+ and npm (declared lockfile)
- JDK 17+ (verified with Corretto 21)
- Android SDK platform 36 and build-tools 35.0.0
- `ANDROID_HOME` or an ignored `android/local.properties` containing `sdk.dir=/path/to/sdk`

```sh
npm ci
npm run android:debug
# android/app/build/outputs/apk/debug/app-debug.apk
```

The Gradle 8.13 wrapper verifies the official distribution against its pinned SHA-256. Android Gradle Plugin is pinned to 8.13.2. `npm run build:android:web` builds with `VITE_NATIVE_ANDROID=true`, copies the bundle into Android assets and applies a restrictive CSP. The generated assets are not committed.

## Sign a release

Create an owner-controlled signing key and store it privately. Do not commit the key or its password. Keep a secure backup; Android requires the same signing key for in-place updates.

The local build reads `GATENOVA_SIGNING_PROPERTIES`, a path outside the repository to a protected properties file:

```properties
storeFile=/private/path/release.p12
storePassword=YOUR_PRIVATE_PASSWORD
keyAlias=gatenova
keyPassword=YOUR_PRIVATE_PASSWORD
```

Then run:

```sh
GATENOVA_SIGNING_PROPERTIES=/private/path/signing.properties npm run android:release
# android/app/build/outputs/apk/release/app-release.apk
```

The release task refuses to use debug or unsigned signing. Increment `versionCode` for every published update and update `versionName`, the APK filename and release notes together. A Play Store upload is a separate process and requires an Android App Bundle and Play Console setup; this task distributes a signed APK directly through GitHub.

## Native boundaries

- `MainActivity.java` loads only signed bundled content using AndroidX `WebViewAssetLoader` at `https://appassets.androidplatform.net/assets/www/index.html`.
- File URL access, mixed content, automatic new windows and remote embedded frames are disabled. Missing resources never fall through to a remote server.
- One bounded native bridge exports text notes through `ACTION_CREATE_DOCUMENT`. Text import uses `ACTION_OPEN_DOCUMENT`; no broad storage access is granted.
- System status, navigation, cutout and keyboard insets are handled by the native container. Android Back first closes a dialog/menu, then returns home, then offers to close the app.
- The release build disables WebView debugging. The Android shell caches no credentials and requests no networking permission.

Implementation references: [Android local WebView content](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content), [AGP 8.13 compatibility](https://developer.android.com/build/releases/past-releases/agp-8-13-0-release-notes).
