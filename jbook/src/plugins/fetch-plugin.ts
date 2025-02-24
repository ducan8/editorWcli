import * as esbuild from "esbuild-wasm";
import axios from "axios";
import localforage from "localforage";

const cacheFile = localforage.createInstance({ name: "cachFile" });
export const fetchPlugin = (inputCode: string) => {
  return {
    name: "fetch-plugin",
    setup(build: esbuild.PluginBuild) {
      build.onLoad({ filter: /^index\.js$/ }, () => {
        return {
          loader: "jsx",
          contents: inputCode,
        };
      });

      build.onLoad({ filter: /.*/ }, async (args: any) => {
        //is the file in cache already?
        //yes
        const fileCache = await cacheFile.getItem<esbuild.OnLoadResult>(
          args.path
        );
        if (fileCache) return fileCache;
      });

      build.onLoad({ filter: /.css$/ }, async (args: any) => {
        const { data, request } = await axios.get(args.path);
        console.log(args.path);

        const escaped = data
          .replace(/\n/g, "")
          .replace(/"/g, '\\"')
          .replace(/'/g, "\\'");
        const contents = `
          const style = document.createElement('style');
          style.innetText = '${escaped}';
          document.head.appendChild(style);
        `;

        const result: esbuild.OnLoadResult = {
          loader: "jsx",
          contents,
          resolveDir: new URL(".", request.responseURL).pathname,
        };

        await cacheFile.setItem(args.path, result);
        return result;
      });
      build.onLoad({ filter: /.*/ }, async (args: any) => {
        const { data, request } = await axios.get(args.path);

        const contents = data;

        const result: esbuild.OnLoadResult = {
          loader: "jsx",
          contents,
          resolveDir: new URL(".", request.responseURL).pathname,
        };

        await cacheFile.setItem(args.path, result);
        return result;
      });
    },
  };
};

// import 'bulma/css/bulma.css'
