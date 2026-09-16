import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  /**
   * Keep this identifier stable after public release.
   *
   * Android package:
   *   com.sinlessindustries.endlesscodex
   */
  appId: "com.sinlessindustries.endlesscodex",

  /**
   * User-facing application name.
   */
  appName: "The Endless Codex",

  /**
   * @cloudflare/vite-plugin outputs the browser application here.
   *
   * Only the client bundle belongs in the native application.
   * Cloudflare Worker/server output must remain deployed separately.
   */
  webDir: "dist/web/client",

  /**
   * Only emit Capacitor/native logs from debug builds.
   *
   * This keeps production logs quieter and reduces the chance of
   * sensitive debugging information being exposed in release builds.
   */
  loggingBehavior: "debug",

  /**
   * Match the Endless Codex dark theme while the WebView starts.
   *
   * This avoids a bright white flash before React renders.
   */
  backgroundColor: "#0B0911",

  /**
   * Application UI controls its own sizing and accessibility.
   */
  zoomEnabled: false,

  /**
   * Give the primary WebView focus when the application starts.
   */
  initialFocus: true,

  server: {
    /**
     * Keep the default local Capacitor origin explicit.
     *
     * Do NOT change this to the production API/domain. The packaged
     * frontend should remain local and communicate with the Cloudflare
     * backend over HTTPS.
     */
    hostname: "localhost",

    /**
     * Use HTTPS semantics for the Android WebView's local origin.
     *
     * This preserves secure-context browser APIs.
     */
    androidScheme: "https",

    /**
     * Do not add `url` here for production.
     *
     * Capacitor's server.url is intended primarily for live reload /
     * development rather than shipping the application as a remote
     * website wrapper.
     */
  },

  android: {
    /**
     * Never allow HTTPS pages to load insecure HTTP resources.
     */
    allowMixedContent: false,

    /**
     * Use the standard Android input implementation.
     */
    captureInput: false,

    /**
     * Do not force production WebViews into a permanently debuggable state.
     *
     * Capacitor still enables WebView debugging appropriately during
     * development.
     */
    webContentsDebuggingEnabled: false,

    /**
     * Explicitly retain focus behavior on Android.
     */
    initialFocus: true,
  },
};

export default config;
