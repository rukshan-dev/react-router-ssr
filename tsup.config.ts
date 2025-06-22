import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts", "src/ssr.loader.ts", "src/express"],
    splitting: false,
    sourcemap: false,
    clean: true,
    dts: true,
    outDir: "./dist",
    external: ["express", "react-router", "virtual:repacked/server"],
  },
]);
