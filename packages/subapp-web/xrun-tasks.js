const xrun = require("@xarc/run");
const { loadTasks } = require("@xarc/module-dev");
// const xsh = require("xsh");

loadTasks({ xrun });
const { concurrent, exec } = xrun;

// xrun.load("user", {
//     build: () => {
//         xsh.$.rm("-rf", "dist*");
//         return concurrent(
//             [
//                 'BABEL_ENV=-src-dev babel src -d dist/dev --delete-dir-on-start --source-maps',
//                 'BABEL_ENV=-src-minify babel src -d dist/min --no-comments --delete-dir-on-start',
//                 'BABEL_ENV=-src-node babel src -d dist/node --delete-dir-on-start --source-maps'
//             ].map(command => exec(command))
//         );
//     }
// })