/* eslint-disable @typescript-eslint/no-var-requires, max-statements */

/* eslint-disable no-process-exit */

import * as Fs from "fs";
import * as Path from "path";
import * as _ from "lodash";
const optionalRequire = require("optional-require")(require);
const chalk = require("chalk");
import { logger } from "@xarc/dev-base";
const mkdirp = require("mkdirp");
import { loadXarcOptions } from "../util/load-xarc-options";
import { injectEntry } from "../util/inject-entry";

const DEV_HMR_DIR = ".__dev_hmr";

function makeEntryPartial() {
  const xarcOptions = loadXarcOptions();
  const xarcCwd = xarcOptions.cwd;
  const AppMode = xarcOptions.AppMode;
  const partial: any = {
    context: Path.resolve(xarcCwd, AppMode.src.client)
  };

  //
  // Look for src/client/entry.config.js, which should export the entry field
  // for the webpack config.  It can be an object that specifies multiple
  // entries, or a string that points the file for entry
  //
  function searchEntryConfig() {
    /*
     * Allow an application to opt in for *multiple* entry points and consequently for
     * multiple bundles in the app by placing `bundle.config.js` in application root
     * directory.
     *
     * If you need to set something like __webpack_public_path__, then your entry file
     * must be vanilla JS because webpack can only process those, so support having a
     * vanilla JS file as entry.
     */
    const entryPath = Path.join(partial.context, "entry.config.js");

    const entry = optionalRequire(entryPath, {
      fail: err => {
        logger.error(`Loading ${entryPath} failed`, err);
        process.exit(1);
      },
      notFound: () => {
        // logger.info(`No custom entry point configuration ${entryPath}`);
      }
    });

    if (entry) {
      logger.info(`Using custom entry config from ${entryPath}`);
    }

    return entry;
  }
  const hmrString = (req) => {
    return `
      const refresh = info => {
        const subApp = window.xarcV1.getSubApp(info.name);
        subApp.info = info;
        subApp._started.forEach(instance => setTimeout(() => subApp.start(instance), 0));
      };

      if (module.hot) {
        module.hot.accept("${req}", () => {
          var info = import("${req}");
          info = info.default || info; // check for es6 module
        if (info.then) {
            info.then((mod) => {
              refresh(mod.default || mod);
            });
          } else {
            refresh(info);
          }
        });
      }
    `;
  };

  function genSubAppHmrEntry(hmrDir, isDev, manifest) {
    let subAppReq = manifest.module ? manifest.entry : `${manifest.subAppDir}/${manifest.entry}`;

    // subapp has built-in code to handle HMR accept
    // or not running in webpack dev mode
    // => do not generate HMR accept code
    if (manifest.hmrSelfAccept || !isDev) {
      return manifest.module ? subAppReq : `./${subAppReq}`;
    }

    const hmrEntry = `hmr-${manifest.subAppDir.replace(/[\/\\]/g, "-")}.js`;
    subAppReq = manifest.module ? subAppReq : `../${subAppReq}`;

    let reducerHmrCode = "";

    if (manifest.reducers) {
      const subAppReducers = manifest.module
        ? manifest.reducers
        : `../${manifest.subAppDir}/reducers`;
      reducerHmrCode = `
import { getReduxCreateStore } from "subapp-redux";
import reducers from "${subAppReducers}";
if (subApp.reduxReducers && (!subApp.reduxCreateStore || subApp._genReduxCreateStore)) {
  subApp._genReduxCreateStore = "hmr";
  const createStore = getReduxCreateStore(subApp);
  subApp.reduxCreateStore = initialState => {
    const store = createStore(initialState);
    module.hot.accept("${subAppReducers}", () => {
      store.replaceReducer(require("${subAppReducers}").default, subApp);
    });

    return store;
  };
}`;
    }

    Fs.writeFileSync(
      Path.join(hmrDir, hmrEntry),
      `
// generated by @xarc/app-dev/config/webpack/partial/entry.js
// for redux reducers hot module reloading during development
const subApp = import( /* webpackChunkName: "${manifest.name.replace(
      "/",
      "_"
    )}~._bootstrap__" */ "${subAppReq}");

${reducerHmrCode}

export default subApp;

 ${hmrString(subAppReq)}
// if (module.hot) {
//   module.hot.accept("${subAppReq}", () => {
//     require("subapp-web").hotReloadSubApp(require("${subAppReq}"));
//   });
// }
`
    );

    return `./${DEV_HMR_DIR}/${hmrEntry}`;
  }

  //
  // Look for src/client/<name>/subapp.js files.  If found, then assume app follows
  // the subapp architecture, and automatically generate one entry for each subapp.
  //
  function searchSubApps() {
    const subApps = AppMode.subApps;

    if (_.isEmpty(subApps)) {
      // logger.info(`No version 1 subapps found under ${AppMode.src.dir}`);
      return false;
    } else {
      logger.info(`Found version 1 subapps: ${Object.keys(subApps).join(", ")}`);
    }

    const isDev = Boolean(process.env.WEBPACK_DEV);
    const hmrDir = Path.resolve(xarcCwd, AppMode.src.dir, DEV_HMR_DIR);
    const gitIgnoreFile = Path.join(hmrDir, ".gitignore");
    if (isDev && !Fs.existsSync(gitIgnoreFile)) {
      mkdirp.sync(hmrDir);
      Fs.writeFileSync(
        gitIgnoreFile,
        `# Directory to contain Electrode default hot module loaders for subapps
# Please ignore this
# Please don't commit this
*
`
      );
    }

    partial.context = Path.resolve(xarcCwd, AppMode.src.dir);
    const entry = {};
    _.each(subApps, ma => {
      const entryName = `${ma.name.toLowerCase()}`;
      const x1 = `${chalk.magenta("subapp")} ${chalk.blue(ma.name)}`;
      entry[entryName] = genSubAppHmrEntry(hmrDir, isDev, ma);
      logger.info(`${x1} entry ${entry[entryName]}`);
    });

    return entry;
  }

  function appEntry() {
    // App has src/client/entry.config.js?
    const entryConfig = searchEntryConfig();
    if (entryConfig) return entryConfig;

    if (xarcOptions.options.subapp !== false) {
      // App has subapp apps within src?
      const subApps = searchSubApps();
      if (subApps) {
        return subApps;
      }
    } else {
      logger.info(`subapp turned off by archetypeConfig.options.subapp flag`);
    }

    // finally look for src/client/app.js or src/client/app.jsx or src/client/app.tsx
    const entries = ["./app.js", "./app.jsx", "./app.tsx"];
    let entry = entries.find(f => Fs.existsSync(Path.join(partial.context, f)));
    //
    // no entry found, maybe there's no src/client
    // look under src instead
    //
    if (!entry) {
      entry = entries.find(f => Fs.existsSync(Path.join(AppMode.src.dir, f)));
      if (entry) {
        logger.info(
          `Found your app entry as ${entry} under dir ${AppMode.src.dir} - setting webpack context to it.`
        );
        partial.context = Path.join(xarcCwd, AppMode.src.dir);
        return entry;
      }

      entry = "./app.jsx";
      logger.info(
        `Unable to determine your app's entry - assuming it's ${entry} under dir ${partial.context}`
      );
    } else {
      logger.info(
        `Default to single app entry point using ${entry} under context ${partial.context}`
      );
    }

    return entry;
  }

  function shouldPolyfill() {
    if (xarcOptions.webpack.enableBabelPolyfill) {
      const hasMultipleTarget =
        Object.keys(xarcOptions.babel.envTargets)
          .sort()
          .join(",") !== "default,node";
      if (hasMultipleTarget) {
        return xarcOptions.babel.target === "default";
        // for all other targets, disable polyfill
      } else {
        return true;
      }
    }

    return false;
  }

  function makeEntry() {
    let entry = appEntry();
    const polyfill = shouldPolyfill();

    //
    // need to insert CDN mapping code for webpack jsonp in production mode
    //
    const jsonpCdn = !process.env.WEBPACK_DEV && require.resolve("../client/webpack5-jsonp-cdn");

    if (polyfill) {
      const coreJs = "core-js";
      const runtime = "regenerator-runtime/runtime";
      entry = injectEntry({ entry }, [jsonpCdn, coreJs, runtime]).entry;
    } else {
      entry = injectEntry({ entry }, jsonpCdn).entry;
    }

    return entry;
  }

  partial.entry = makeEntry();

  return partial;
}

module.exports = makeEntryPartial;
