/* eslint-disable no-undef */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    base: mode === "production" ? "/kozmo-brand-frontend/" : "/",

    plugins: [react()],
    server: {
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      target: ["es2015", "safari11", "firefox60"],
      cssTarget: ["safari11", "firefox60"],
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            redux: ["@reduxjs/toolkit", "react-redux"],
            ui: ["@fortawesome/react-fontawesome"],
          },
        },
      },
    },
  };
});
