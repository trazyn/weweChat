
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'mobx-react';
import { Router, hashHistory } from 'react-router';

import './global.css';
import 'fonts/icomoon/style.css';
import getRoutes from './js/routes';
import stores from './js/stores';

render(
    <Provider {...stores}>
        <Router history={hashHistory}>
            {getRoutes()}
        </Router>
    </Provider>,

    document.getElementById('root')
);
