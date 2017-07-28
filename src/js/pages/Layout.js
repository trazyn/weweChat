
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { ipcRenderer } from 'electron';

import Header from './Header';
import Footer from './Footer';
import Login from './Login';
import UserInfo from './UserInfo';
import AddFriend from './AddFriend';

@inject(stores => ({
    isLogin: () => !!stores.session.auth,
}))
@observer
export default class Layout extends Component {
    render() {
        if (!this.props.isLogin()) {
            return <Login />;
        }

        ipcRenderer.send('logined');

        return (
            <div>
                <Header location={this.props.location} />
                <div style={{
                    height: 'calc(100vh - 100px)',
                    overflow: 'hidden',
                    overflowY: 'auto',
                    background: `rgba(255,255,255,.8)`,
                }}>
                    {this.props.children}
                </div>
                <Footer location={this.props.location} />
                <UserInfo />
                <AddFriend />
            </div>
        );
    }
}
