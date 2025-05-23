import NixClap from "nix-clap";
import { AdminServer } from "./admin-server";
import { setupCleanupHooks } from "./cleanup";

/**
 *
 */
function startDevAdmin() {
  const parsed = new NixClap()
    .init({
      exec: {
        type: "string",
        desc: "program/js to execute as the app server"
      },
      ext: {
        type: "string",
        desc: "file extensions to watch"
      },
      watch: {
        type: "string array",
        desc: "directories and files to watch"
      },
      interactive: {
        alias: "int",
        type: "boolean",
        default: true,
        desc: "disable interactivity (no-interactive to turn off)"
      },
      port: {
        type: "number",
        default: 0,
        desc: "HTTP port to serve admin data"
      },
      useRsPack: {
        type: "boolean",
        default: true,
        desc: "Use rspack for dev server"
      }
    })
    .parse();

  const admin = new AdminServer(parsed, {});

  setupCleanupHooks();

  admin.start();
}

startDevAdmin();
