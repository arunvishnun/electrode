import { React, loadSubApp } from "subapp-react";
import { BrowserRouter } from "react-router-dom";
// import LoadSubapp from "../common/load-subapp";
import { FederatedModule } from "../common/FederatedModule";


const MainBody = props => {
  return (
    <div>
      Some content!
      <FederatedModule 
        remote="mfe-subappv1-remote" // remote apps names
        module="Deals" // can be subapp or a component that is exposed by mfe-subappv1-remote
        fallback={<Spinner />} // can provide a custom component. If not, should show `loading...`
        
        />
      {/* <LoadSubapp 
        dynamic 
        subappId="v1-federation-demo-subapp" 
        name="Demo" 
        key="demo" 
        remote={true} 
        fallback={<Spinner />} 
        {...props} 
      /> */}
    </div>
  );
};


export default loadSubApp({
  name: "MainBody",
  Component: MainBody,
  useReactRouter: true,

  StartComponent: props => {
    return (
      <BrowserRouter>
        <MainBody {...props} />
      </BrowserRouter>
    );
  },
});
