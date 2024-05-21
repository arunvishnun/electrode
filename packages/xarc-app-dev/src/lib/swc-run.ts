/* eslint-disable @typescript-eslint/no-var-requires */
/*
 * Start user's app server from src/server directory in dev mode.
 *
 * - If user has src/server/dev.js, then just requires that, and expect
 *   user does all the SWC register setup etc in that file.
 * - otherwise load swc-node/register, with swc config to process files
 *   that are only under CWD and not within CWD/node_modules.
 *
 * This allows symlinked node modules to work in dev mode without swc
 * trying to load .swcrc or process files from them.
 *
 */
import Path from "path";
import { loadXarcOptions } from "../lib/utils";
import { util } from "@xarc/webpack";

const serverDir = process.argv[2] || "src/server";

let start;
const xarcOptions = loadXarcOptions();
const xarcCwd = xarcOptions.cwd;

/**
 * Get a SWC exclude function to filter out files that should not
 * be transpiled.
 *
 * @param xarcOptions - xarc dev options
 * @returns swc exclude patterns array
 */
export const getSwcExclude = (xarcOptions: any) => {
  const AppMode = xarcOptions.AppMode;
  const clientVendor = Path.join(AppMode.src.client, "vendor/");
  const { includeRegExp, excludeRegExp } = xarcOptions.babel;

  const swcExclude = (x: string) => {
    if (includeRegExp && includeRegExp.find((r: RegExp) => x.match(r))) {
      return false;
    }

    if (excludeRegExp && excludeRegExp.find((r: RegExp) => x.match(r))) {
      return true;
    }

    if (x.indexOf("node_modules") >= 0) {
      if (x.indexOf("~es2x~") >= 0 || x.indexOf("~es6~") >= 0) {
        return false;
      }
      return true;
    }

    if (x.indexOf(clientVendor) >= 0) {
      return true;
    }

    return false;
  };

  return (filename: string) => swcExclude(filename);
};


try {
  // Try to load user's dev.js under src/server
  start = require(Path.resolve(xarcCwd, serverDir, "dev.js"));
} catch (err) {
  if (err.code !== "MODULE_NOT_FOUND") {
    throw err;
  }

  // fallback to default action that loads swc-node/register and then requires
  // src/server, under which there should be an index.js file.
  require("@swc-node/register")({
    ignore: [getSwcExclude(xarcOptions)],
    extensions: [".js", ".jsx"]
      .concat(xarcOptions.swc.enableTypeScript && [".ts", ".tsx"])
      .filter((x) => x),
    cache: true,
  });

  const fullServerDir = Path.resolve(xarcCwd, serverDir);

  start = require(fullServerDir);
}

if (typeof start === "function") {
  start();
}
