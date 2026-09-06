import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sinlessindustries.endlesscodex",
  appName: "Endless Codex",

  /**
   * @cloudflare/vite-plugin outputs the browser application here.
   *
   * The Worker/server build is separate and must not be packaged
   * into the Android application.
   */
  webDir: "dist/client",

  server: {
    /**
     * Keep the WebView on HTTPS semantics.
     *
     * Do not enable cleartext HTTP for production.
     */
    androidScheme: "https",
  },

  android: {
    /**
     * Do not permit mixed HTTP/HTTPS content.
     */
    allowMixedContent: false,
  },
};

export default config;