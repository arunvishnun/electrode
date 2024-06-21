import { React, AppContext, loadSubApp } from "subapp-react";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import { Products } from "../components/products";
import { Navigation } from "../components/navigation";
import { Deals } from "../components/deals";

const Home = () => {
  return (
    <AppContext.Consumer>
      {({ isSsr, ssr, subApp }) => {
        return (
          <div className="container-fluid text-center">
            <p>HOME</p>
            <div>SubApp name: {subApp ? subApp.name : "Not Available from context"}</div>
            <div>
              IS_SSR: {`${Boolean(isSsr)}`} HAS_REQUEST: {ssr && ssr.request ? "yes" : "no"}
            </div>
          </div>
        );
      }}
    </AppContext.Consumer>
  );
};

const Stores = () => `Stores`;
const Contact = () => `Contact`;

const MainBody = props => {
  return (
    <div>
      <Navigation />
      <Routes>
        <Route path="/" exact element={<Home />} {...props} />
        <Route path="/products" element={<Products />} {...props} />
        <Route path="/deals" element={<Deals />} {...props} />
        <Route path="/stores" element={<Stores />} {...props} />
        <Route path="/contact" element={<Contact />} {...props} />
      </Routes>
    </div>
  );
};

export default loadSubApp({
  name: "MainBody",
  Component: MainBody,
  useRactRouter: true,
  StartComponent: props => {
    return (
      <BrowserRouter>
        <Component {...props} />
      </BrowserRouter>
    );
  },
});
