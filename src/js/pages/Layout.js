
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { ipcRenderer, remote } from 'electron';

import classes from './Layout.css';
import Header from './Header';
import Footer from './Footer';
import Login from './Login';
import UserInfo from './UserInfo';
import AddFriend from './AddFriend';
import NewChat from './NewChat';
import Members from './Members';
import AddMember from './AddMember';
import BatchSend from './BatchSend';
import Forward from './Forward';
import ConfirmImagePaste from './ConfirmImagePaste';
import Loader from 'components/Loader';
import Snackbar from 'components/Snackbar';
import Offline from 'components/Offline';

@inject(stores => ({
    isLogin: () => !!stores.session.auth,
    loading: stores.session.loading,
    message: stores.snackbar.text,
    show: stores.snackbar.show,
    process: stores.chat.process,
    reconnect: stores.session.checkTimeout,
    close: () => stores.snackbar.toggle(false),
    canidrag: () => !!stores.chat.user && !stores.batchsend.show,
}))
@observer
export default class Layout extends Component {
    state = {
        offline: false,
    };

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
        var canidrag = this.props.canidrag;

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

        window.addEventListener('offline', () => {
            this.setState({
                offline: true,
            });
        });

        window.addEventListener('online', () => {
            // Reconnect to wechat
            this.props.reconnect();
            this.setState({
                offline: false,
            });
        });

        if (window.process.platform === 'win32') {
            document.body.classList.add('isWin');
        }

        window.ondragover = e => {
            if (canidrag()) {
                this.refs.holder.classList.add(classes.show);
                this.refs.viewport.classList.add(classes.blur);
            }

            // If not st as 'copy', electron will open the drop file
            e.dataTransfer.dropEffect = 'copy';
            return false;
        };

        window.ondragleave = () => {
            if (!canidrag()) return false;

            this.refs.holder.classList.remove(classes.show);
            this.refs.viewport.classList.remove(classes.blur);
        };

        window.ondragend = e => {
            return false;
        };

        window.ondrop = e => {
            var files = e.dataTransfer.files;
            e.preventDefault();
            e.stopPropagation();

            if (files.length && canidrag()) {
                Array.from(files).map(e => this.props.process(e));
            }

            this.refs.holder.classList.remove(classes.show);
            this.refs.viewport.classList.remove(classes.blur);
            return false;
        };
    }

    render() {
        var { isLogin, loading, show, close, message, location } = this.props;

        if (!window.navigator.onLine) {
            return (
                <Offline show={true} style={{
                    top: 0,
                    paddingTop: 30
                }} />
            );
        }

        if (!isLogin()) {
            return <Login />;
        }

        ipcRenderer.send('logined');

        return (
            <div>
                <Snackbar
                    close={close}
                    show={show}
                    text={message} />

                <Loader show={loading} />
                <Header location={location} />
                <div className={classes.container} ref="viewport">
                    {this.props.children}
                </div>
                <Footer location={location} ref="footer" />
                <UserInfo />
                <AddFriend />
                <NewChat />
                <Members />
                <BatchSend />
                <AddMember />
                <ConfirmImagePaste />
                <Forward />

                <Offline show={this.state.offline} />;

                <div className={classes.dragDropHolder} ref="holder">
                    <div className={classes.inner}>
                        <div>
                            <img src="assets/images/filetypes/image.png" />
                            <img src="assets/images/filetypes/word.png" />
                            <img src="assets/images/filetypes/pdf.png" />
                            <img src="assets/images/filetypes/archive.png" />
                            <img src="assets/images/filetypes/video.png" />
                            <img src="assets/images/filetypes/audio.png" />
                        </div>

                        <i className="icon-ion-ios-cloud-upload-outline" />

                        <h2>Drop your file here</h2>
                    </div>
                </div>
            </div>
        );
    }
}
