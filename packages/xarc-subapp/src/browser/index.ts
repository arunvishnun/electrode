/* eslint-env browser */
/* eslint-disable no-console, @typescript-eslint/ban-ts-comment */
/* global window */
import {
  __declareSubApp,
  envHooks,
  SubAppContainer,
  SubAppOptions,
  SubAppDef,
  SubAppMountInfo
} from "../subapp/index";

import { ClientRenderPipeline } from "./client-render-pipeline";

import { xarcV2 } from "./xarcv2";

//
// re-exports
//

export * from "../subapp/index";
export { xarcV2 };
export { ClientRenderPipeline };
/**
 * Get the subapp container
 *
 * @returns subapp container
 */
export function getContainer(): SubAppContainer {
  const w: any = window;

  if (!w._subapps) {
    w._subapps = new SubAppContainer({});
  }

  return w._subapps;
}

/**
 * Setup event hooks
 *
 */
export function _setupEnvHooks(): void {
  if (!envHooks.getContainer) {
    envHooks.getContainer = getContainer;
  }
}

const clientOverrideMethods: Partial<SubAppDef> = {
  _start({ csrData }) {
    xarcV2.debug("subapp _start - creating pipeline and calling start", this.name);
    if (csrData.inlineId) {
      const ix = this._renderPipelines.findIndex(p => p.csrData.inlineId === csrData.inlineId);
      if (ix >= 0) {
        xarcV2.debug("subapp _start - removing existing inline pipeline", this.name);
        this._renderPipelines.slice(ix, 1);
      }
    }
    const pipeline = this._pipelineFactory({ csrData });
    this._renderPipelines.push(pipeline);
    return pipeline.start();
  }
};

const _dynamics = [];

/**
 * Declare a subapp.
 *
 * **NOTE**: A webpack plugin will statically analyze the code to extract the subapp info
 *   so options must be a literal object in place.  It cannot be a variable declared elsewhere.
 *
 * GOOD:
 *
 * ```js
 * export const subapp1 = declareSubApp({
 *   name: "Subapp1",
 *   getModule: () => import("subapp1")
 * })
 * ```
 *
 * BAD:
 *
 * ```js
 * const subappInfo = { name: "Subapp1", getModule: () => import("subapp1")};
 * export const subapp1 = declareSubApp(subappInfo);
 * ```
 *
 * @param options - options
 * @returns subapp definition
 *
 */
export function declareSubApp(options: SubAppOptions): SubAppDef {
  const w = window as any;
  w._wml = w._wml || {};
  w._wml._subappsConfig = w._wml._subappsConfig || { promises: [] };
  const IS_STANDALONE_MFE = true;

  _setupEnvHooks();

  const existDef = getContainer().get(options.name);

  const def = __declareSubApp(options, clientOverrideMethods);

  // transfer render pipelines from exist definition for hot reload support
  if (existDef) {
    def._renderPipelines = existDef._renderPipelines;
  }

  if (IS_STANDALONE_MFE) {
    const modulePromise = def
      ._getModule()
      .then(() => {
        console.log(`Module for ${options.name} loaded.`);
      })
      .catch(err => {
        console.error(`Error loading module for ${options.name}:`, err);
      });

    w._wml._subappsConfig.promises.push(modulePromise);

    // Trigger an event when all promises are resolved
    Promise.all(w._wml._subappsConfig.promises)
      .then(() => {
        const event = new Event("subappsConfigReady");
        window.dispatchEvent(event);
      })
      .catch(err => {
        console.error("Error resolving _subappsConfig promises:", err);
      });
  }

  // Preload module synchronously
  if (typeof def._getModule === "function") {
    def._getModule().catch(err => {
      console.error(`Error preloading module for ${options.name}:`, err);
    });
  }

  // @ts-ignore
  if (module.hot) {
    def._mount = function (info: SubAppMountInfo) {
      // TODO: need to attach pipeline to component
      xarcV2.debug("subapp _mount for", info.subapp.name, info, info.component.constructor.name);
      const pipelines = this._renderPipelines;
      for (const pipeline of pipelines) {
        pipeline._mount(info);
      }
      // dynamic import components are just plain components without the subapp
      // rendering features so there are no pipelines for them so need to track
      // them here in order to reload them.
      if (info.type === "dynamic" && _dynamics.indexOf(info) < 0) {
        _dynamics.push(info);
      }
    };

    def._unmount = function (info: SubAppMountInfo) {
      xarcV2.debug("subapp _unmount for", info.subapp.name, info, info.component.constructor.name);
      const pipelines = this._renderPipelines;
      for (const pipeline of pipelines) {
        pipeline._unmount(info);
      }
      const ix = _dynamics.indexOf(info);
      if (ix >= 0) {
        _dynamics.splice(ix, 1);
      }
    };

    def._reload = function (subAppName: string, _modName?: string) {
      xarcV2.debug("subapp _reload", subAppName);
      // get the potentially new subapp definition
      const subapp = getContainer().get(subAppName);
      // transfer render pipelines over
      subapp._renderPipelines = this._renderPipelines;
      // reload its module and reload all pipelines
      return subapp
        ._getModule()
        .then(() => {
          const pipelines = this._renderPipelines;
          const promises = pipelines.map(pipeline => pipeline._reload(subAppName, _modName));
          return Promise.all(promises);
        })
        .then(() => {
          _dynamics.forEach(dyn => {
            if (dyn.subapp.name === subAppName) {
              dyn.component.reload(def._module);
            }
          });
        });
    };
  }

  return def;
}

export const IS_BROWSER = true;
