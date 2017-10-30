
import React from 'react';
import { withRouter, Route } from 'react-router-dom';

import { Layout, Settings, Contacts, Home } from './pages';

const Main = withRouter(props => <Layout {...props} />);

export default () => {
    /* eslint-disable */
    return (
        <Main>
            <Route exact path="/" component={Home} />
            <Route path="/contacts" component={Contacts} />
            <Route path="/settings" component={Settings} />
        </Main>
    );
    /* eslint-enable */
};
