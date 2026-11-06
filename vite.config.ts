import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/app/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),

    react(),

    tsconfigPaths(),

    tailwindcss(),

    cloudflare(),
  ],

  resolve: {
    dedupe: ["react", "react-dom"],
  },

  server: {
    // Loopback only. `host: true` listens on every interface, which is the
    // exposure condition for the Vite filesystem advisories.
    host: "localhost",
    port: 5173,
  },

  build: {
    outDir: "dist/web",
    // Client bundles must not ship source maps as public assets. Worker source
    // maps, when the Cloudflare plugin emits them, stay eligible for
    // `upload_source_maps` and are not part of the static asset directory.
    sourcemap: false,
  },
});
