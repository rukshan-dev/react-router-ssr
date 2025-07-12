import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: [
      "src/index.ts",
      "src/ssr.loader.ts",
      "src/express",
    ],
    splitting: true,
    sourcemap: false,
    clean: true,
    dts: true,
    outDir: "./dist",
    external: [
      "src/scripts/context.ts",
      "react",
      "react-dom",
      "express",
      "react-router",
      "virtual:repacked/server",
    ],
  },
]);
