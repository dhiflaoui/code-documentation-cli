import * as esbuild from "esbuild-wasm";
import axios from "axios";
import localforage from "localforage"; //store the files in cache using indexDB

//store files in cache
const fileCache = localforage.createInstance({
  name: "filecache",
});

export const fetchPlugin = (inputCode: string) => {
  return {
    name: "fetch-plugin",
    setup(build: esbuild.PluginBuild) {
      //use the path an load the file
      build.onLoad({ filter: /.*/ }, async (args: any) => {
        console.log("onLoad", args);

        if (args.path === "index.js") {
          return {
            loader: "jsx",
            contents: inputCode,
          };
        }

        //cache storage IndexDB
        //check if we have already fetched this file
        const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(
          args.path
        );

        //if it is , return it immediately
        if (cachedResult) {
          return cachedResult;
        }

        //load up the file (fetch the url with axios)
        const { data, request } = await axios.get(args.path);

        const result: esbuild.OnLoadResult = {
          loader: "jsx",
          contents: data,
          resolveDir: new URL("./", request.responseURL).pathname,
        };
        //store response in cache

        // store response in cache
        await fileCache.setItem(args.path, result);

        return result;
      });
    },
  };
};
