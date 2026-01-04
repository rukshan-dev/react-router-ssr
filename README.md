# React Router SSR

A lightweight helper package that wires React Router's data APIs into the [Repacked](https://www.npmjs.com/package/repacked) build/runtime so you can ship a single-page app with server-side rendering and streaming-friendly data responses.

## Installation

```bash
yarn add @repacked-tools/react-router-ssr
```

## Usage

### 1. Enable the plugin in your Repacked config

```ts
// repacked.config.ts
import type { AppConfig } from "repacked";
import { ssrPlugin } from "@repacked-tools/react-router-ssr";

const config: AppConfig = {
  appName: "react-router-ssr-demo",
  output: { dir: "dist" },
  development: { port: 3000, open: false },
  client: {
    enabled: true,
    entry: "src/client.tsx",
    template: "public/index.html",
    publicPath: "/",
    assetsDir: "assets",
    envFilter: () => true,
  },
  server: {
    enabled: true,
    entry: "src/server.ts",
  },
  rspack: (config) => config,
  jest: (config) => config,
  plugins: [ssrPlugin()],
};

export default config;
```

### 2. Use the Express middleware from the SSR template

```ts
// src/server.ts
import express from "express";
import path from "path";
import expressSSRMiddleware from "@repacked-tools/react-router-ssr/dist/express";
import routes from "./routes";
import type { RuntimeConfigs } from "repacked";

export default async function server(app: express.Express, runtime: RuntimeConfigs) {
  app.use("/", express.static(path.join(process.cwd(), "dist/client")));

  // Serve application HTML or loader data using React Router's data APIs
  app.use(expressSSRMiddleware(routes, runtime, { requestContext: {} }));

  return app;
}
```

### 3. Render scripts in your HTML template

Use the provided `<Scripts />` helper to inject client bundles that match your current entry point.

```tsx
// src/client.tsx
import { Scripts } from "@repacked-tools/react-router-ssr";

export function Html({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>React Router SSR</title>
      </head>
      <body>
        <div id="root">{children}</div>
        <Scripts entry="main" />
      </body>
    </html>
  );
}
```

This example mirrors the [SSR template](https://github.com/rukshan-dev/repacked/tree/main/templates/ssr-template) setup: wire the plugin into Repacked, mount the Express middleware to handle React Router data responses and HTML rendering, and render the generated client bundles in your template.
