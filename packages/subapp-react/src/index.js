import { setupFramework } from "subapp-web";
import FrameworkLib from "./fe-framework-lib";

setupFramework(FrameworkLib);

export * from "subapp-web";

export { default as React } from "react";

export { default as AppContext } from "./app-context";

export { FrameworkLib };
