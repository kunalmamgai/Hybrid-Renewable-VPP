import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three/") || id.includes("node_modules\\three\\")) {
            return "three";
          }
          if (id.includes("@react-three/drei") || id.includes("three-stdlib")) {
            return "react-three-drei";
          }
          if (id.includes("@react-three/fiber")) return "react-three-fiber";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("react-dom") || id.includes("node_modules/react/")) return "react";
          return undefined;
        },
      },
    },
  },
});
