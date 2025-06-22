import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts", "src/ssr.loader.ts"],
    splitting: false,
    sourcemap: false,
    clean: true,
    dts: true,
    outDir: "./dist",
  },
]);
