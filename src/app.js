
import React, { Component } from 'react';
import { render } from 'react-dom';
import { Provider } from 'mobx-react';
import { Router, hashHistory } from 'react-router';
import ElectronCookies from '@exponent/electron-cookies';
import { ipcRenderer } from 'electron';

import './global.css';
import './assets/fonts/icomoon/style.css';
import 'utils/albumcolors';
import getRoutes from './js/routes';
import stores from './js/stores';

ElectronCookies.enable({
    origin: 'https://wx.qq.com',
});

class App extends Component {
    async componentWillMount() {
        await stores.session.hasLogin();
        await stores.settings.init();
        await stores.search.getHistory();
    }

    canisend() {
        return this.refs.navigator.state.location.pathname === '/'
            && stores.chat.user;
    }

    componentDidMount() {
        // Hide the tray icon
        ipcRenderer.on('hide-tray', () => {
            stores.settings.setShowOnTray(false);
        });

        // Chat with user
        ipcRenderer.on('message-chatto', (event, args) => {
            var user = stores.contacts.memberList.find(e => e.UserName === args.id);

            this.refs.navigator.router.push('/');
            setTimeout(stores.chat.chatTo(user));
        });

        // Show the user info
        ipcRenderer.on('show-userinfo', (event, args) => {
            var user = stores.contacts.memberList.find(e => e.UserName === args.id);
            stores.userinfo.toggle(true, user);
        });

        // Shwo the settings page
        ipcRenderer.on('show-settings', () => {
            this.refs.navigator.router.push('/settings');
        });

        // Show a modal to create a new conversation
        ipcRenderer.on('show-newchat', () => {
            this.refs.navigator.router.push('/');
            stores.newchat.toggle(true);
        });

        // Show the conversation pane
        ipcRenderer.on('show-conversations', () => {
            if (this.canisend()) {
                stores.chat.toggleConversation();
            }
        });

        // Search in currently conversation list
        ipcRenderer.on('show-search', () => {
            this.refs.navigator.router.push('/');
            stores.chat.toggleConversation(true);

            setTimeout(() => document.querySelector('#search').focus());
        });

        // Show the home page
        ipcRenderer.on('show-messages', () => {
            this.refs.navigator.router.push('/');
            stores.chat.toggleConversation(true);
        });

        // Insert the qq emoji
        ipcRenderer.on('show-emoji', () => {
            if (this.canisend()) {
                document.querySelector('#showEmoji').click();
            }
        });

        // Show contacts page
        ipcRenderer.on('show-contacts', () => {
            this.refs.navigator.router.push('/contacts');
        });

        // Go to next conversation
        ipcRenderer.on('show-next', () => {
            this.refs.navigator.router.push('/');
            stores.chat.toggleConversation(true);
            setTimeout(stores.chat.chatToNext);
        });

        // Go to the previous conversation
        ipcRenderer.on('show-previous', () => {
            this.refs.navigator.router.push('/');
            stores.chat.toggleConversation(true);
            setTimeout(stores.chat.chatToPrev);
        });

        // When the system resume reconnet to WeChat
        ipcRenderer.on('os-resume', async() => {
            var session = stores.session;

            session.keepalive()
                .catch(ex => session.logout());
        });

        // Show the daemon error
        ipcRenderer.on('show-errors', (event, args) => {
            stores.snackbar.showMessage(args.message);
        });
    }

    render() {
        return (
            <Provider {...stores}>
                <Router history={hashHistory} ref="navigator">
                    {getRoutes()}
                </Router>
            </Provider>
        );
    }
}

render(
    <App />,
    document.getElementById('root')
);
