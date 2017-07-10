
import React from 'react';
import { IndexRoute, Route } from 'react-router';

import { Layout, Settings, Contacts, Home } from './pages';

export default () => {
    return (
        <Route path="/" component={Layout}>
            <IndexRoute component={Home} />
            <Route path="/contacts" component={Contacts} />
            <Route path="/settings" component={Settings} />
        </Route>
    );
};
