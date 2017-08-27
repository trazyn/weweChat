
import React, { Component } from 'react';
import { inject } from 'mobx-react';
import { ipcRenderer } from 'electron';
import clazz from 'classname';

import classes from './style.css';
import Emoji from './Emoji';

@inject(stores => ({
    sendMessage: stores.chat.sendMessage,
    user: stores.chat.user,
    showMessage: stores.snackbar.showMessage,
    isme: () => stores.chat.user.UserName === stores.session.user.User.UserName,
    confirmSendImage: async(image) => {
        if (!stores.settings.confirmImagePaste) {
            return true;
        }

        var confirmed = await stores.confirmImagePaste.toggle(true, image);
        return confirmed;
    },
    process: stores.chat.process,
}))
export default class Input extends Component {
    async handleEnter(e) {
        var message = this.refs.input.value.trim();

        if (!message || e.charCode !== 13) return;

        if (this.props.isme()) {
            this.props.showMessage('Can\'t send message to yourself.');
            return;
        }

        var res = await this.props.sendMessage(this.props.user, {
            content: message,
            type: 1,
        });

        if (res) {
            this.refs.input.value = '';
        } else {
            this.props.showMessage('Failed to send message.');
        }
    }

    state = {
        showEmoji: false
    };

    toggleEmoji(show = !this.state.showEmoji) {
        this.setState({
            showEmoji: show,
        });
    }

    writeEmoji(emoji) {
        this.refs.input.value += `[${emoji}]`;
    }

    async handlePaste(e) {
        var args = ipcRenderer.sendSync('file-paste');

        if (args.hasImage) {
            e.preventDefault();

            if ((await this.props.confirmSendImage(args.filename)) === false) {
                return;
            }

            let parts = [
                new window.Blob([new window.Uint8Array(args.raw.data)], { type: 'image/png' })
            ];
            let file = new window.File(parts, args.filename, {
                lastModified: new Date(),
                type: 'image/png'
            });

            this.props.process(file);
        }
    }

    render() {
        var canisend = this.props.user;

        return (
            <div className={clazz(classes.home, {
                [classes.shouldSelectUser]: !canisend,
            })}>
                <div
                    className={classes.tips}>
                    You should choice a contact at first.
                </div>
                <input
                    id="messageInput"
                    type="text"
                    ref="input"
                    placeholder="Type someting to send..."
                    readOnly={!canisend}
                    onPaste={e => this.handlePaste(e)}
                    onKeyPress={e => this.handleEnter(e)} />

                <div className={classes.action}>
                    <i className="icon-ion-android-attach" onClick={e => canisend && this.refs.uploader.click()} />
                    <i
                        className="icon-ion-ios-heart"
                        style={{
                            color: 'red',
                        }}
                        onClick={e => canisend && this.toggleEmoji(true)} />

                    <input
                        type="file"
                        ref="uploader"
                        onChange={e => {
                            this.props.process(e.target.files[0]);
                            e.target.value = '';
                        }}
                        style={{
                            display: 'none',
                        }} />
                    <Emoji
                        output={emoji => this.writeEmoji(emoji)}
                        close={e => setTimeout(() => this.toggleEmoji(false), 100)}
                        show={this.state.showEmoji} />
                </div>
            </div>
        );
    }
}
