import * as esbuild from "esbuild-wasm";
import axios from "axios";
import localforage from "localforage"; //store the files in cache using indexDB

//store files in cache
const fileCache = localforage.createInstance({
  name: "filecache",
});

export const unpkgPathPlugin = () => {
  return {
    name: "unpkg-path-plugin",
    setup(build: esbuild.PluginBuild) {
      //where the file stored 'the path'
      build.onResolve({ filter: /.*/ }, async (args: any) => {
        console.log("onResolve", args);
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
          namespace: "a",
          path: `https://unpkg.com/${args.path}`,
        };
      });

      //use the path an load the file
      build.onLoad({ filter: /.*/ }, async (args: any) => {
        console.log("onLoad", args);

        if (args.path === "index.js") {
          return {
            loader: "jsx",
            contents: `
            import React, { useState } from 'react-select';
            console.log(React, useState);
            `,
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
