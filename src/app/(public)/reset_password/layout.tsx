import React, {Suspense} from 'react';
import Page from "./page";

const Layout = () => {
    return (
        <Suspense>
            <Page />
        </Suspense>
    );
}

export default Layout;
