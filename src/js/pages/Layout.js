
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import Footer from './Footer';
import Login from './Login';

@inject(stores => ({
    isLogin: () => !!stores.session.auth,
}))
@observer
export default class Layout extends Component {
    render() {
        if (!this.props.isLogin()) {
            return <Login />;
        }

        return (
            <div>
                <div style={{
                    height: 'calc(100vh - 60px)',
                    overflow: 'hidden',
                    overflowY: 'auto',
                }}>
                    {this.props.children}
                </div>
                <Footer />
            </div>
        );
    }
}
