import { React } from "@xarc/react";
import { useFederatedComponent } from './useFederatedComponent';

const FederatedModule = ({ appName }) => {
    const { Component: FederatedComponent, loadRemote, errorLoading } = useFederatedComponent({ appName: appName });
    React.useEffect(() => {
        loadRemote();
    }, [])

    return (
        <>
            {/* <Header /> */}
            {/* Adding a sub route */}
            {/* <Outlet /> */}
            <React.Suspense fallback="Loading...">
                {errorLoading
                    ? `Error loading module "${module}"`
                    : FederatedComponent && <FederatedComponent />
                }
            </React.Suspense>
        </>
        
    )
}

export { FederatedModule };