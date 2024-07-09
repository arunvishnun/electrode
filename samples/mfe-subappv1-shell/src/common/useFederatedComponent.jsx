
import { React } from "@xarc/react";
// import { ui as uiConfig } from "@walmart/electrode-ui-config";
import { useDynamicScript } from './useDynamicScript';
import loadComponent from './load-component';

const componentCache = new Map();
const defaultConfig = {
  url: '',
  scope: '',
  module: '',
}

// TODO: get the URL from env configurations
const baseUrl = 'https://dev.walmart.com'
// const baseUrl = 'https://gtpjs-demo-dev-v2-federation-app1.walmart.com'

export const useFederatedComponent = ({ appName }) => {

    const [{ module, scope, url }, setConfig] = React.useState(defaultConfig);
    const loadRemote = () => {
      fetch(`${baseUrl}/api/cdn-manifest`)
        .then(results => results.json())
        .then((response) => {
            const app = response[appName];
            const config = {
              url: app.cdnUrls[app.activeVersion],
              scope: app.name,
              module: app.module
            }
            setConfig(config);
        });
    }
    
    const key = `${url}-${scope}-${module}`;
    const [Component, setComponent] = React.useState(null);
  
    const { ready, errorLoading } = useDynamicScript(url);
    React.useEffect(() => {
      if (Component) setComponent(null);
      // Only recalculate when key changes
    }, [key]);
  
    React.useEffect(() => {
      console.log(`React.useEffect in useFederatedComponent hook Scope ${scope}; Module ${module}`)
      if (ready && !Component) {
        const Comp = React.lazy(loadComponent(scope, module));
        componentCache.set(key, Comp);
        setComponent(Comp);
      }
      // key includes all dependencies (scope/module)
    }, [Component, ready, key]);
  
    return { 
      errorLoading, 
      Component,
      loadRemote,
      module
    };
  };