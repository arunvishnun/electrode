import { declareSubApp, xarcV2 } from "@xarc/react";

export const Header = declareSubApp({
  name: "header",
  getModule: () => import("./subapps/header/index.tsx"),
});

export const MainBody = declareSubApp({
  name: "main-body",
  getModule: () => import("./subapps/main-body/index.tsx"),
});

export const Footer = declareSubApp({
  name: "footer",
  getModule: () => import("./subapps/footer/index.tsx"),
});

xarcV2.debug("app.tsx");
