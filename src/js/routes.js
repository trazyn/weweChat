
import React from 'react';
import { IndexRoute, Route } from 'react-router';

import { Layout, Contacts } from './pages';

export default () => {
    return (
        <Route path="/" component={Layout}>
            <IndexRoute component={Contacts} />
        </Route>
    );
};
