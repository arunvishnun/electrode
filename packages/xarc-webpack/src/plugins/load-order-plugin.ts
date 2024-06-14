import * as fs from 'fs';
import * as path from "path";

class EnsureLoadOrderPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync("EnsureLoadOrderPlugin", (compilation, callback) => {
      const entryFiles = Object.values(compiler.options.entry).flat();

      // Find runtime and remote entry files
      const runtimeFilename = Object.keys(compilation.assets).find(asset => asset.includes("runtime"));
      const remoteEntryFilename = Object.keys(compilation.assets).find(asset => asset.includes("remoteEntry"));

      if (!runtimeFilename || !remoteEntryFilename) {
        console.error("Runtime or remote entry file not found.");
        callback();
        return;
      }

      entryFiles.forEach((entryFile: any) => {
        const entryFilePath = path.resolve(compiler.context, entryFile);
        const runtimeImport = `import('./${runtimeFilename}').then(() => import('./${remoteEntryFilename}')).then(() => console.log('Runtime and remote entry loaded')).catch(err => console.error('Error loading runtime or remote entry:', err));`;

        if (fs.existsSync(entryFilePath)) {
          const originalContent = fs.readFileSync(entryFilePath, "utf-8");
          const modifiedContent = `${runtimeImport}\n${originalContent}`;

          compilation.assets[path.basename(entryFilePath)] = {
            source: () => modifiedContent,
            size: () => modifiedContent.length,
          };
        } else {
          console.error(`Entry file ${entryFilePath} does not exist.`);
        }
      });

      callback();
    });
  }
}

export default EnsureLoadOrderPlugin;