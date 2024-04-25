/**
 *
 * NOTE: this file is actually maintained centrally in a directory in our repo.
 *
 * There are many duplicate copies of it in each opt- package, but not as a
 * npm module, because the opt- package needs this upfront for the npm script
 * prepare.  They each copy it from the central one.
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';
import url from 'url';

/**
 * Determines if two versions have the same major version number.
 * @param {string} verA - Version string A.
 * @param {string} verB - Version string B.
 * @returns {boolean} True if both versions share the same major version.
 */
function isSameMajorVersion(verA, verB) {
    let majorA = verA.match(/[\~\^]{0,1}(\d+)\.(\d+)\.(\d+)/);
    if (majorA) {
        majorA = majorA.slice(1, 4);
        const majorB = verB.split(".");
        if (majorB[0] !== majorA[0] || (majorB[0] === "0" && majorB[1] !== majorA[1])) {
            return false;
        }
    }
    return true;
}

/**
 * Looks up the application directory starting from the npm INIT_CWD environment variable.
 * Searches upwards until a package.json is found or the root is reached.
 * @returns {Promise<string|undefined>} The directory path of the application or undefined.
 */
async function lookupAppDirByInitCwd() {
    let lookupDir = process.env.INIT_CWD;
    if (!lookupDir) return undefined;

    let count = 0;
    while (count < 100) {
        const pkgFile = path.join(lookupDir, "package.json");
        try {
            await import(url.pathToFileURL(pkgFile).href);
            return lookupDir;
        } catch (err) {
            //
        }
        const upDir = path.join(lookupDir, "..");
        if (upDir === lookupDir) return undefined;
        lookupDir = upDir;
        count++;
    }
    return undefined;
}

/**
 * Finds the application directory by checking for the first
 * node_modules in the path string and trimming
 * any node_modules path components found.
 * For example, /home/userid/myapp/node_modules/electrode-archetype-opt-react
 * would yield app dir as /home/userid/myapp
 * @param {string} cwd - The current working directory.
 * @returns {string} The determined application directory.
 */
function findAppDir(cwd) {
    if (cwd.indexOf("node_modules") > 0) {
        const splits = cwd.split("node_modules");
        return path.dirname(path.join(splits[0], "x")); // remove trailing slash
    }
    return cwd;
}

/**
 * Reads and parses the package.json file in the specified directory.
 */
function checkAppPackage(appDir) {
    try {
        return JSON.parse(fs.readFileSync(path.join(appDir, "package.json"), { encoding: "utf-8" }));
    } catch (e) {
        return {};
    }
}

/**
 * Performs the xarc optimization check based on the package.json configurations.
 * @returns {Promise<object>} The result object containing pass status and message.
 */
async function xarcOptCheck() {
    const cwd = process.env.PWD || process.cwd();
    const appDir = await lookupAppDirByInitCwd() || findAppDir(cwd);
    const appPkg = checkAppPackage(appDir);
    const myPkg = JSON.parse(fs.readFileSync(path.join(__dirname, "./package.json"), { encoding: "utf-8" }));
    const myName = myPkg.name;
    const optParams = { ...myPkg.xarcOptCheck };

    assert(
        optParams.hasOwnProperty("optionalTagName"),
        `opt archetype ${myName}: package.json missing xarcOptCheck.optionalTagName`
    );

    const done = (pass, message) => {
        return Object.assign({ pass, message }, optParams);
    };

  //
  // just the package itself
  //
  if (cwd === appDir && myName === appPkg.name) {
    return done(true, "self");
  }

  assert(
    optParams.hasOwnProperty("optionalTagName"),
    `opt archetype ${myName}: package.json missing xarcOptCheck.optionalTagName`
  );

  const optionalTagName = optParams.optionalTagName;

  let foundOOO = [];

  //
  // If a workspace detected, then we don't know how dependencies are setup, so
  // skip checking.
  //
  if (!appPkg.workspaces && optParams.onlyOneOf) {
    // first, user's package.json cannot have multiple packages from onlyOneOf list
    ["dependencies", "devDependencies", "optionalDependencies"].forEach(x => {
      if (appPkg[x]) {
        foundOOO = foundOOO.concat(optParams.onlyOneOf.filter(n => appPkg[x].hasOwnProperty(n)));
      }
    });

    if (foundOOO.length > 1) {
      return done(
        false,
        `
  ERROR
  ERROR: you can have *only* ONE of these packages in your package.json dependencies/devDependencies/optionalDependencies.
  ERROR: ${foundOOO.join(", ")}
  ERROR
  `
      );
    }

    // If found a mutually excluding package but it's not this one, then skip installing this.
    if (foundOOO.length > 0 && foundOOO.indexOf(myName) < 0) {
      return done(
        false,
        `Found ${foundOOO[0]} in your package.json and \
it excludes this package ${myName} - skip installing`
      );
    }
  }

  return done(true);
}

if (require.main === module) {
    xarcOptCheck().then(result => {
        if (result.pass) {
            if (result.message) {
                console.log(result.message);
            }
        } else {
            console.error(result.message);
        }
        process.exit(result.pass ? 0 : 1);
    });
}

export { isSameMajorVersion };