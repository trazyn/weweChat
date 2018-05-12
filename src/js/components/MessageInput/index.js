
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import clazz from 'classname';

import classes from './style.css';
import Emoji from './Emoji';

export default class MessageInput extends Component {
    static propTypes = {
        me: PropTypes.object,
        sendMessage: PropTypes.func.isRequired,
        showMessage: PropTypes.func.isRequired,
        user: PropTypes.array.isRequired,
        confirmSendImage: PropTypes.func.isRequired,
        process: PropTypes.func.isRequired,
    };

    static defaultProps = {
        me: {},
    };

    canisend() {
        var user = this.props.user;

        if (this.blocking) {
            return false;
        }

        if (user.length === 1
            && user.slice(-1).pop().UserName === this.props.me.UserName) {
            this.props.showMessage('不能给自己发送消息！');
            return false;
        }

        return true;
    }

    // Prevent duplicate message
    blocking = false;

    async handleEnter(e) {
        var message = this.refs.input.value.trim();
        var user = this.props.user;
        var batch = user.length > 1;

        if (!this.canisend()
            || !message
            || e.charCode !== 13) return;

        this.blocking = true;

        // You can not send message to yourself
        await Promise.all(
            user.filter(e => e.UserName !== this.props.me.UserName).map(async e => {
                let res = await this.props.sendMessage(e, {
                    content: message,
                    type: 1,
                }, true);

                this.refs.input.value = '';

                if (!res) {
                    await this.props.showMessage(batch ? `无法给 ${e.NickName} 发送消息！` : '无法发送消息!');
                }

                return true;
            })
        );
        this.blocking = false;
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
        var input = this.refs.input;

        input.value += `[${emoji}]`;
        input.focus();
    }

    async batchProcess(file) {
        var message;
        var batch = this.props.user.length > 1;
        var receiver = this.props.user.filter(e => e.UserName !== this.props.me.UserName);
        var showMessage = this.props.showMessage;

        if (this.canisend() === false) {
            return;
        }

        for (let user of receiver) {
            if (message) {
                await this.props.sendMessage(user, message, true)
                    .catch(ex => showMessage(`无法给 ${user.NickName} 发送消息！`));
                continue;
            }

            // Do not repeat upload file, forward the message to another user
            message = await this.props.process(file, user);

            if (message === false) {
                if (batch) {
                    showMessage(`无法给 ${user.NickName} 发送消息！`);
                    continue;
                }
                // In batch mode just show the failed message
                showMessage('无法发送图片！');
            }
        }
    }

    async handlePaste(e) {
        var args = ipcRenderer.sendSync('file-paste');

        if (args.hasImage && this.canisend()) {
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

            this.batchProcess(file);
        }
    }

    render() {
        var canisend = !!this.props.user.length;

        return (
            <div className={clazz(classes.container, this.props.className, {
                [classes.shouldSelectUser]: !canisend,
            })}>
                <div
                    className={classes.tips}>
                    请先选择一个联系人。
                </div>
                <input
                    id="messageInput"
                    onPaste={e => this.handlePaste(e)}
                    onKeyPress={e => this.handleEnter(e)}
                    placeholder="回车发送..."
                    readOnly={!canisend}
                    ref="input"
                    type="text" />

                <div className={classes.action}>
                    <i
                        className="icon-ion-android-attach"
                        id="showUploader"
                        onClick={e => canisend && this.refs.uploader.click()} />
                    <i
                        className="icon-ion-ios-heart"
                        id="showEmoji"
                        onClick={e => canisend && this.toggleEmoji(true)}
                        style={{
                            color: 'red',
                        }} />

                    <input
                        onChange={e => {
                            this.batchProcess(e.target.files[0]);
                            e.target.value = '';
                        }}
                        ref="uploader"
                        style={{
                            display: 'none',
                        }}
                        type="file" />
                    <Emoji
                        close={e => setTimeout(() => this.toggleEmoji(false), 100)}
                        output={emoji => this.writeEmoji(emoji)}
                        show={this.state.showEmoji} />
                </div>
            </div>
        );
    }
}
