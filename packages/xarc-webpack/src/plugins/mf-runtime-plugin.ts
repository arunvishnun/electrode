import { ConcatSource } from "webpack-sources";

class MFRuntimePlugin {
  __fileName: string;
  __runtimeFilename: string;
  constructor(
    filename: string = "remoteEntry.js",
    runtimeFilename: string = "runtime.bundle"
  ) {
    this.__fileName = filename;
    this.__runtimeFilename = runtimeFilename;
  }

  apply(compiler) {
    compiler.hooks.thisCompilation.tap("MFRuntimePlugin", (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: "MFRuntimePlugin",
          stage: compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        (assets) => {
          const remoteEntry = assets[this.__fileName];
          const runtime = Object.keys(assets).filter((asset) =>
            asset.startsWith(this.__runtimeFilename)
          )[0];

          // remoteEntry is generated when something is exposed, if nothing is exposed, make it noop.
          if (remoteEntry && runtime) {
            const mergedRuntime = new ConcatSource(
              assets[runtime],
              remoteEntry
            );
            assets[this.__fileName] = mergedRuntime;
          }
        }
      );
    });
  }
}

export default MFRuntimePlugin;
