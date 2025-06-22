import { RepackedPluginFactory } from "repacked";

export const ssrPlugin: RepackedPluginFactory = () => (options) => {
  return {
    apply(compiler) {},
    updateConfig(config) {
      if (options.target === "client") {
        // @ts-ignore
        config.output.filename = "[name].js";
        config.module?.rules?.push({
          test: /\.(js|ts)x?$/,
          use: `${__dirname}/ssr.loader.js`,
        });
      }
    },
  };
};
