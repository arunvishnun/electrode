import { SSR_PIPELINES } from "./utils";
import { SubAppRenderPipeline } from "../subapp";

/** To get start subapp object
 *
 * @returns an object with process method which can start subapp process
 */
export function startSubApp(): any {
  return {
    process(context): string {
      const { scriptNonceAttr = "", request } = context.user;

      const asyncProcess = async () => {
        const pipelines: SubAppRenderPipeline[] = request[SSR_PIPELINES];

        for (const pipeline of pipelines) {
          if (!pipeline.isPrepared()) {
            await pipeline.waitForPrepare();
          }
        }

        // we must only do this after all pipeline's prepare has been awaited
        // TODO: implement grouping like subapp version 1 supports
        for (const pipeline of pipelines) {
          pipeline.executeRender();
        }
      };

      asyncProcess();

      //
      return `<!-- Starting SubApp -->
<script${scriptNonceAttr}>
  window.addEventListener("subappsConfigReady", () => {
    if (xarcV2 && typeof xarcV2.start === "function") {
      xarcV2.start();
    } else {
      console.error("xarcV2.start is not defined or not a function.");
    }
  });
</script>
`;
    }
  };
}
