import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Gate the shim behind an explicit flag so production uses the real SDK
      ...(process.env.VITE_USE_ELEVENLABS_SHIM === 'true'
        ? { "@elevenlabs/react": path.resolve(__dirname, "./src/shims/elevenlabs-react.ts") }
        : {}),
    },
  },
}));
