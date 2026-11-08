# Local platform builds

`npm run build` builds the web application once, checks TypeScript, and packages
Android plus the desktop target for the current operating system. On macOS it also
builds the iOS simulator application. It reports other operating systems as
unavailable; it does not create placeholder packages or dispatch remote CI jobs.

| Folder         | Output                                                                        | Required host         |
| -------------- | ----------------------------------------------------------------------------- | --------------------- |
| `dist/web`     | React assets in `client/` and the Cloudflare Worker in its named subdirectory | Linux, macOS, Windows |
| `dist/android` | Release APK and AAB (unsigned unless Gradle signing is configured)            | Linux, macOS, Windows |
| `dist/mac`     | Tauri macOS DMG                                                               | macOS                 |
| `dist/windows` | Tauri MSI and NSIS EXE installers                                             | Windows               |
| `dist/linux`   | Tauri DEB, RPM, and AppImage packages                                         | Linux                 |
| `dist/ios`     | `endless-codex-ios-simulator.tar.gz`, containing the Release `App.app`        | macOS                 |

The iOS artifact runs in the simulator; it is not an IPA for physical devices or
App Store distribution. Use `npm run ios:open` to configure an Apple development
team and archive/export a signed device build in Xcode. Desktop packages also use
whatever signing configuration is available on the host; this command does not
provision certificates or notarization credentials.

## Commands

```sh
npm run build                  # All local platform targets
npm run build:web              # Web + Worker only
npm run build:android          # Web prerequisite + Android APK/AAB
npm run build:desktop          # Web prerequisite + current desktop platform
npm run build:linux
npm run build:windows
npm run build:mac
npm run build:ios
npm run build -- --targets=web,android
npm run test:build             # Build target and artifact-collection tests
```

`desktop:build` is an alias for `build:desktop`. Explicit requests for a different
host's platform fail before building. Missing SDKs or native build failures also
return a nonzero exit code; they are not silently skipped. Other successful target
outputs remain available. Each native target replaces only its own output folder;
the web build cleans only its environment folders under `dist/web`.

`npm run preview`, `npm run deploy`, and `npm run deploy:check` remain web-only.
Wrangler discovers the Vite-generated Worker configuration through
`.wrangler/deploy/config.json`. Tauri's direct CLI hook runs `build:web`; the combined
builder disables that hook after building web once, preventing recursive builds.
Existing web validation workflows likewise call `build:web`.

## Prerequisites

Install dependencies with `npm ci` and use the platform SDKs below:

- **Desktop:** Rust/Cargo and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/).
  Linux needs WebKitGTK 4.1 development libraries, a C/C++ toolchain, and the Linux
  bundler dependencies; Windows needs the MSVC C++ build tools; macOS needs Xcode
  command-line tools. Tauri may download packaging tools on its first build.
- **Android:** JDK 21, Android SDK platform 36 and build tools, accepted SDK licenses,
  and `ANDROID_HOME` or `android/local.properties` pointing to the SDK. The checked-in
  Gradle wrapper selects the Gradle version. Capacitor sync runs before packaging.
- **iOS:** macOS with Xcode and its iOS simulator SDK. The checked-in Capacitor project
  uses Swift Package Manager; sync updates its dependencies before `xcodebuild`.
  CocoaPods is not required. See the [Capacitor iOS guide](https://capacitorjs.com/docs/ios).

Native caches stay in `src-tauri/target`, Android's Gradle build directories, and
`.cache/ios-build`; final artifacts go into the platform folders above. Do not copy
Cloudflare Worker code or private environment files into mobile assets.

## Runtime scope

Packaging preserves the existing native runtime setup. Tauri loads the hosted
Endless Codex site. Capacitor packages `dist/web/client` locally. Android Auto
Backup and device-to-device transfer are disabled so WebView storage is not
exported with the app. The shared browser API currently uses same-origin
requests, so packaging the mobile application does not by itself establish
authenticated connectivity to the deployed Worker. That native API/auth
integration is a separate application change. No backend is embedded in a
native installer.
