
import React, { Component } from 'react';
import { inject } from 'mobx-react';
import clazz from 'classname';

import classes from './style.css';
import Emoji from './Emoji';

@inject(stores => ({
    sendMessage: stores.chat.sendMessage,
    user: stores.chat.user,
    upload: stores.chat.upload,
    showMessage: stores.snackbar.showMessage,
}))
export default class Input extends Component {
    handleEnter(e) {
        if (e.charCode !== 13) return;

        this.props.sendMessage(this.props.user, {
            content: this.refs.input.value,
            type: 1,
        });
        this.refs.input.value = '';
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

    async process(file) {
        if (!file) return;

        this.refs.uploader.value = '';

        if (file.size > 20 * 1024 * 1024) {
            this.props.showMessage('Send file not allowed to exceed 20M.');
            return;
        }

        var { mediaId, type, uploaderid } = await this.props.upload(file);

        this.props.sendMessage(this.props.user, {
            type,
            file: {
                name: file.name,
                size: file.size,
                mediaId,
                extension: file.name.split('.').slice(-1).pop()
            },
        }, false, (to, messages, message) => {
            // Sent success
            var list = messages.get(to);
            var item = list.data.find(e => e.uploaderid === uploaderid);

            Object.assign(item, message, {
                uploading: false,

                // Avoid to update image
                image: item.image,
            });

            return list;
        });
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
                    onKeyPress={e => this.handleEnter(e)} />

                <div className={classes.action}>
                    <i className="icon-ion-ios-mic" />
                    <i className="icon-ion-android-attach" onClick={e => canisend && this.refs.uploader.click()} />
                    <i className="icon-ion-ios-heart" onClick={e => canisend && this.toggleEmoji(true)} />

                    <input
                        type="file"
                        ref="uploader"
                        onChange={e => this.process(e.target.files[0])}
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
