import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { loadEnv } from "vite";

// Load .env / .env.local so the Blob contract tests can run when the owner
// has pulled Vercel credentials into .env.development.local or .env.local.
const env = loadEnv("test", process.cwd(), "");
for (const [k, v] of Object.entries(env)) process.env[k] ??= v;

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["node_modules/**", "e2e/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // The real package throws in the test (client-like) environment.
      "server-only": path.resolve(__dirname, "./src/test-stubs/server-only.ts"),
    },
  },
});
