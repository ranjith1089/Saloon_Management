# Mobile apps (Android + iOS) — Capacitor

The salon web app (`frontend/`) is wrapped with **Capacitor 8**, which packages the
existing React build into native Android and iOS apps. No UI was rewritten — the
apps load the same `dist/` web bundle inside a native WebView.

- **App name:** Studieo
- **App ID (bundle id):** `com.studieo.salon`
- **Web build dir:** `frontend/dist`
- Native projects: `frontend/android/` and `frontend/ios/`

## 1. Configure the backend URL (required)

A packaged app has no dev proxy and cannot reach `localhost`. Set the absolute
backend URL in [`frontend/.env.production`](frontend/.env.production):

```
VITE_API_URL=https://your-deployed-backend/api/v1
```

For local testing before deploying the backend:
- **Android emulator:** `http://10.0.2.2:5000/api/v1` (`10.0.2.2` = your PC)
- **Real device on Wi-Fi:** `http://<your-PC-LAN-IP>:5000/api/v1`

> Testing against an `http://` (non-TLS) URL on Android also needs cleartext
> enabled — see step 3.

## 2. The build → sync loop

Any time the web app changes, rebuild and copy it into the native projects:

```bash
cd frontend
npm run mobile:sync        # build + cap sync (both platforms)
```

Convenience scripts (in `frontend/package.json`):
- `npm run mobile:android` — build, sync, open in Android Studio
- `npm run mobile:ios` — build, sync, open in Xcode (macOS only)
- `npm run mobile:run:android` — build and run on a connected device/emulator

## 3. Build Android  (works on Windows/macOS/Linux)

Prerequisites **not yet installed on this machine**:
1. **JDK 17** (you currently have Java 8 — Android Gradle needs 17).
2. **Android Studio** (bundles the Android SDK + emulator). After install, set
   `ANDROID_HOME` and accept SDK licenses (`sdkmanager --licenses`).

Then:
```bash
cd frontend
npm run mobile:android         # opens Android Studio → Run ▶ on an emulator/device
# or a debug APK from the CLI:
cd android && ./gradlew assembleDebug
# APK: frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

For a Play Store release you'll create a signing keystore and run
`./gradlew bundleRelease` (produces an `.aab`).

**Cleartext for local http testing:** to hit an `http://` backend from Android,
add `android:usesCleartextTraffic="true"` to the `<application>` tag in
`frontend/android/app/src/main/AndroidManifest.xml` (dev only — remove for a
release that talks to your `https://` backend).

## 4. Build iOS  (requires a Mac)

iOS apps **cannot be compiled on Windows** — Apple requires macOS + Xcode.
The `ios/` project is fully scaffolded and ready; on a Mac:

```bash
cd frontend
npm install
npm run mobile:ios             # opens Xcode → select a simulator → Run ▶
```

Signing/TestFlight/App Store steps are done in Xcode with an Apple Developer
account. No CocoaPods needed — Capacitor 8 uses Swift Package Manager.

**No Mac?** Use a cloud macOS CI to build the `ios/` project:
[Codemagic](https://codemagic.io), [Ionic Appflow](https://ionic.io/appflow),
or [EAS Build](https://expo.dev) all build Capacitor iOS apps.

## 5. App icon & splash

Drop a 1024×1024 `icon.png` (and optional `splash.png`) in
`frontend/resources/` and run `npx @capacitor/assets generate` to produce all
Android/iOS icon and splash sizes. The splash background is currently the brand
red `#dc2626` (see `capacitor.config.ts`).

## What's next (optional)

- Adapt the UI to the bottom-tab mobile design (the published mockups) instead
  of the responsive sidebar layout.
- Add native plugins as needed: push notifications, camera, share, biometrics.
