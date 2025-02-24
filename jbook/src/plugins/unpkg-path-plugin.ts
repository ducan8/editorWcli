import * as esbuild from "esbuild-wasm";
import axios from "axios";
import localforage from "localforage";

const cacheFile = localforage.createInstance({ name: "cachFile" });

export const unpkgPathPlugin = (inputCode: string) => {
  return {
    name: "unpkg-path-plugin",
    setup(build: esbuild.PluginBuild) {
      build.onResolve({ filter: /.*/ }, async (args: any) => {
        console.log("onResole", args);
        if (args.path === "index.js") {
          return { path: args.path, namespace: "a" };
        }

        if (args.path.includes("./") || args.path.includes("../")) {
          return {
            namespace: "a",
            path: new URL(
              args.path,
              "https://unpkg.com" + args.resolveDir + "/"
            ).href,
          };
        }

        return {
          path: `https://unpkg.com/${args.path}`,
          namespace: "a",
        };
      });

      build.onLoad({ filter: /.*/ }, async (args: any) => {
        console.log("onLoad", args);

        if (args.path === "index.js") {
          return {
            loader: "jsx",
            contents: inputCode,
          };
        }

        //is the file in cache already?
        //yes

        const fileCache = await cacheFile.getItem<esbuild.OnLoadResult>(
          args.path
        );
        if (fileCache) return fileCache;
        //no

        const { data, request } = await axios.get(args.path).then((res) => res);

        const result: esbuild.OnLoadResult = {
          loader: "jsx",
          contents: data,
          resolveDir: new URL(".", request.responseURL).pathname,
        };

        await cacheFile.setItem(args.path, result);
        return result;
      });
    },
  };
};
