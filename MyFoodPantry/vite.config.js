import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { createApiHandler } from "./server/api.js";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "SPOONACULAR_");
  const api = () =>
    createApiHandler({
      getKey: () => process.env.SPOONACULAR_API_KEY || env.SPOONACULAR_API_KEY,
    });
  return {
    plugins: [
      react(),
      {
        name: "spoonacular-server",
        configureServer(server) {
          server.middlewares.use(api());
        },
        configurePreviewServer(server) {
          server.middlewares.use(api());
        },
      },
    ],
  };
});
