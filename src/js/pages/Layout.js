
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { ipcRenderer, remote } from 'electron';

import Loader from 'components/Loader';
import Snackbar from 'components/Snackbar';
import Header from './Header';
import Footer from './Footer';
import Login from './Login';
import UserInfo from './UserInfo';
import AddFriend from './AddFriend';
import NewChat from './NewChat';
import Members from './Members';
import AddMember from './AddMember';
import Forward from './Forward';

@inject(stores => ({
    isLogin: () => !!stores.session.auth,
    loading: stores.session.loading,

    message: stores.snackbar.text,
    show: stores.snackbar.show,
    close: () => stores.snackbar.toggle(false),
}))
@observer
export default class Layout extends Component {
    componentDidMount() {
        var templates = [
            {
                label: 'Undo',
                role: 'undo',
            }, {
                label: 'Redo',
                role: 'redo',
            }, {
                type: 'separator',
            }, {
                label: 'Cut',
                role: 'cut',
            }, {
                label: 'Copy',
                role: 'copy',
            }, {
                label: 'Paste',
                role: 'paste',
            }, {
                type: 'separator',
            }, {
                label: 'Select all',
                role: 'selectall',
            },
        ];
        var menu = new remote.Menu.buildFromTemplate(templates);

        document.body.addEventListener('contextmenu', e => {
            e.preventDefault();

            let node = e.target;

            while (node) {
                if (node.nodeName.match(/^(input|textarea)$/i) || node.isContentEditable) {
                    menu.popup(remote.getCurrentWindow());
                    break;
                }
                node = node.parentNode;
            }
        });
    }

    render() {
        if (!this.props.isLogin()) {
            return <Login />;
        }

        ipcRenderer.send('logined');

        return (
            <div>
                <Snackbar
                    close={this.props.close}
                    show={this.props.show}
                    text={this.props.message} />

                <Loader show={this.props.loading} />
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
                <NewChat />
                <Members />
                <AddMember />
                <Forward />
            </div>
        );
    }
}
