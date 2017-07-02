
import React from 'react';
import { IndexRoute, Route } from 'react-router';

import { Layout, Home } from './pages';

export default () => {
    return (
        <Route path="/" component={Layout}>
            <IndexRoute component={Home} />
        </Route>
    );
};
