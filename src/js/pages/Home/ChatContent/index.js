
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { ipcRenderer, remote } from 'electron';
import clazz from 'classname';
import moment from 'moment';
import axios from 'axios';

import classes from './style.css';
import Avatar from 'components/Avatar';
import helper from 'utils/helper';
import { parser as emojiParse } from 'utils/emoji';
import { on, off } from 'utils/event';

@inject(stores => ({
    user: stores.chat.user,
    sticky: stores.chat.sticky,
    empty: stores.chat.empty,
    removeChat: stores.chat.removeChat,
    messages: stores.chat.messages,
    loading: stores.session.loading,
    reset: () => {
        stores.chat.user = false;
    },
    isFriend: (id) => {
        var user = stores.contacts.memberList.find(e => e.UserName === id) || {};
        return helper.isContact(user);
    },
    showUserinfo: async(isme, user) => {
        var caniremove = helper.isChatRoomOwner(stores.chat.user);

        if (isme) {
            user = stores.session.user.User;
        } else {
            stores.contacts.memberList.find(e => {
                // Try to find contact in your contacts
                if (e.UserName === user.UserName) {
                    return (user = e);
                }
            });
        }

        stores.userinfo.toggle(true, user, caniremove);
    },
    getMessage: (messageid) => {
        var list = stores.chat.messages.get(stores.chat.user.UserName);
        return list.data.find(e => e.MsgId === messageid);
    },
    deleteMessage: (messageid) => {
        stores.chat.deleteMessage(stores.chat.user.UserName, messageid);
    },
    showMembers: (user) => {
        if (helper.isChatRoom(user.UserName)) {
            stores.members.toggle(true, user);
        }
    },
    showContact: (userid) => {
        var user = stores.contacts.memberList.find(e => e.UserName === userid);
        stores.userinfo.toggle(true, user);
    },
    showForward: (message) => stores.forward.toggle(true, message),
    parseMessage: (message, from) => {
        var isChatRoom = message.isme ? false : helper.isChatRoom(message.FromUserName);
        var user = from;

        message = Object.assign({}, message);

        if (isChatRoom) {
            let matchs = message.Content.split(':<br/>');

            // Get the newest chat room infomation
            from = stores.contacts.memberList.find(e => from.UserName === e.UserName);
            user = from.MemberList.find(e => e.UserName === matchs[0]);
            message.Content = matchs[1];
        }

        // If user is null, that mean user has been removed from this chat room
        return { message, user };
    },
    showAddFriend: (user) => stores.addfriend.toggle(true, user),
    recallMessage: stores.chat.recallMessage,
    downloads: stores.settings.downloads,
    remeberConversation: stores.settings.remeberConversation,
    showConversation: stores.chat.showConversation,
    toggleConversation: stores.chat.toggleConversation,
}))
@observer
export default class ChatContent extends Component {
    getMessageContent(message) {
        var uploading = message.uploading;

        switch (message.MsgType) {
            case 1:
                if (message.location) {
                    return `
                        <img class="open-map unload" data-map="${message.location.href}" src="${message.location.image}" />
                        <label>${message.location.label}</label>
                    `;
                }
                // Text message
                return emojiParse(message.Content);
            case 3:
                // Image
                let image = message.image;

                if (uploading) {
                    return `
                        <div>
                            <img class="open-image unload" data-id="${message.MsgId}" src="${image.src}" data-fallback="${image.fallback}" />
                            <i class="icon-ion-android-arrow-up"></i>
                        </div>
                    `;
                }
                return `<img class="open-image unload" data-id="${message.MsgId}" src="${image.src}" data-fallback="${image.fallback}" />`;
            case 34:
                /* eslint-disable */
                // Voice
                let voice = message.voice;
                let times = message.VoiceLength;
                let width = 40 + 7 * (times / 2000);
                let seconds = 0;
                /* eslint-enable */

                if (times < 60 * 1000) {
                    seconds = Math.ceil(times / 1000);
                }

                return `
                    <div class="play-voice" style="width: ${width}px" data-voice="${voice.src}">
                        <i class="icon-ion-android-volume-up"></i>
                        <span>
                            ${seconds || '60+'}"
                        </span>

                        <audio controls="controls">
                            <source src="${voice.src}" />
                        </audio>
                    </div>
                `;
            case 47:
            case 49 + 8:
                // External emoji
                let emoji = message.emoji;

                if (emoji) {
                    if (uploading) {
                        return `
                            <div>
                                <img class="unload disabledDrag" src="${emoji.src}" data-fallback="${emoji.fallback}" />
                                <i class="icon-ion-android-arrow-up"></i>
                            </div>
                        `;
                    }
                    return `<img src="${emoji.src}" class="unload disabledDrag" data-fallback="${emoji.fallback}" />`;
                }
                return `
                    <div class="${classes.invalidEmoji}">
                        <div></div>
                        <span>无法解析的Emoji表情，请在手机端查看！</span>
                    </div>
                `;

            case 42:
                // Contact Card
                let contact = message.contact;
                let isFriend = this.props.isFriend(contact.UserName);
                let html = `
                    <div class="${clazz(classes.contact, { 'is-friend': isFriend })}" data-userid="${contact.UserName}">
                        <img src="${contact.image}" class="unload disabledDrag" />

                        <div>
                            <p>${contact.name}</p>
                            <p>${contact.address}</p>
                        </div>
                `;

                if (!isFriend) {
                    html += `
                        <i class="icon-ion-android-add" data-userid="${contact.UserName}"></i>
                    `;
                }

                html += '</div>';

                return html;

            case 43:
                // Video message
                let video = message.video;

                if (uploading) {
                    return `
                        <div>
                            <video preload="metadata" controls src="${video.src}"></video>

                            <i class="icon-ion-android-arrow-up"></i>
                        </div>
                    `;
                }

                if (!video) {
                    console.error('无法解析的视频文件: %o', message);

                    return `
                        接收到无法解析的视频未见，请查看系统日志。
                    `;
                }

                return `
                    <video preload="metadata" poster="${video.cover}" controls src="${video.src}" />
                `;

            case 49 + 2000:
                // Money transfer
                let transfer = message.transfer;

                return `
                    <div class="${classes.transfer}">
                        <h4>转账消息</h4>
                        <span>💰 ${transfer.money}</span>
                        <p>如需收钱，请打开手机微信确认收款。</p>
                    </div>
                `;

            case 49 + 6:
                // File message
                let file = message.file;
                let download = message.download;

                /* eslint-disable */
                return `
                    <div class="${classes.file}" data-id="${message.MsgId}">
                        <img src="assets/images/filetypes/${helper.getFiletypeIcon(file.extension)}" class="disabledDrag" />

                        <div>
                            <p>${file.name}</p>
                            <p>${helper.humanSize(file.size)}</p>
                        </div>

                        ${
                            uploading
                                ? '<i class="icon-ion-android-arrow-up"></i>'
                                : (download.done ? '<i class="icon-ion-android-more-horizontal is-file"></i>' : '<i class="icon-ion-android-arrow-down is-download"></i>')
                        }
                    </div>
                `;
                /* eslint-enable */

            case 49 + 17:
                // Location sharing...
                return `
                    <div class="${classes.locationSharing}">
                        <i class="icon-ion-ios-location"></i>
                        位置分享，请到手机端查看。
                    </div>
                `;
        }
    }

    renderMessages(list, from) {
        return list.data.map((e, index) => {
            var { message, user } = this.props.parseMessage(e, from);
            var type = message.MsgType;

            if ([
                // WeChat system message
                10000,
                // Custome message
                19999
            ].includes(type)) {
                return (
                    <div
                        key={index}
                        className={clazz('unread', classes.message, classes.system)}
                        dangerouslySetInnerHTML={{__html: e.Content}} />
                );
            }

            if (!user) {
                return false;
            }

            return (
                <div className={clazz('unread', classes.message, {
                    // File is uploading
                    [classes.uploading]: message.uploading === true,

                    [classes.isme]: message.isme,
                    [classes.isText]: type === 1 && !message.location,
                    [classes.isLocation]: type === 1 && message.location,
                    [classes.isImage]: type === 3,
                    [classes.isEmoji]: type === 47 || type === 49 + 8,
                    [classes.isVoice]: type === 34,
                    [classes.isContact]: type === 42,
                    [classes.isVideo]: type === 43,

                    // App messages
                    [classes.appMessage]: [49 + 2000, 49 + 17, 49 + 6].includes(type),
                    [classes.isTransfer]: type === 49 + 2000,
                    [classes.isLocationSharing]: type === 49 + 17,
                    [classes.isFile]: type === 49 + 6,
                })} key={index}>
                    <div>
                        <Avatar
                            src={message.isme ? message.HeadImgUrl : user.HeadImgUrl}
                            className={classes.avatar}
                            onClick={ev => this.props.showUserinfo(message.isme, user)} />

                        <p className={classes.username} dangerouslySetInnerHTML={{__html: user.NickName}} />

                        <div className={classes.content}>
                            <p
                                onContextMenu={e => this.showMessageAction(message)}
                                dangerouslySetInnerHTML={{__html: this.getMessageContent(message)}} />

                            <span className={classes.times}>{ moment(message.CreateTime * 1000).fromNow() }</span>
                        </div>
                    </div>
                </div>
            );
        });
    }

    async handleClick(e) {
        var target = e.target;

        // Open the image
        if (target.tagName === 'IMG'
            && target.classList.contains('open-image')) {
            // Get image from cache and convert to base64
            let response = await axios.get(target.src, { responseType: 'arraybuffer' });
            let base64 = new window.Buffer(response.data, 'binary').toString('base64');

            ipcRenderer.send('open-image', {
                dataset: target.dataset,
                base64,
            });

            return;
        }

        // Play the voice message
        if (target.tagName === 'DIV'
            && target.classList.contains('play-voice')) {
            let audio = target.querySelector('audio');

            audio.onplay = () => target.classList.add(classes.playing);
            audio.onended = () => target.classList.remove(classes.playing);
            audio.play();

            return;
        }

        // Open the location
        if (target.tagName === 'IMG'
            && target.classList.contains('open-map')) {
            ipcRenderer.send('open-map', {
                map: target.dataset.map,
            });
        }

        // Show contact card
        if (target.tagName === 'DIV'
            && target.classList.contains('is-friend')) {
            this.props.showContact(target.dataset.userid);
        }

        // Add new friend
        if (target.tagName === 'I'
            && target.classList.contains('icon-ion-android-add')) {
            this.props.showAddFriend({
                UserName: target.dataset.userid
            });
        }

        // Add new friend
        if (target.tagName === 'A'
            && target.classList.contains('add-friend')) {
            this.props.showAddFriend({
                UserName: target.dataset.userid
            });
        }

        // Open file & open folder
        if (target.tagName === 'I'
            && target.classList.contains('is-file')) {
            let message = this.props.getMessage(e.target.parentElement.dataset.id);
            this.showFileAction(message.download);
        }

        // Download file
        if (target.tagName === 'I'
            && target.classList.contains('is-download')) {
            let message = this.props.getMessage(e.target.parentElement.dataset.id);
            let response = await axios.get(message.file.download, { responseType: 'arraybuffer' });
            let base64 = new window.Buffer(response.data, 'binary').toString('base64');
            let filename = ipcRenderer.sendSync(
                'file-download',
                {
                    filename: `${this.props.downloads}/${message.MsgId}_${message.file.name}`,
                    raw: base64,
                },
            );

            setTimeout(() => {
                message.download = {
                    done: true,
                    path: filename,
                };
            });
        }
    }

    showFileAction(download) {
        var templates = [
            {
                label: '打开文件',
                click: () => {
                    ipcRenderer.send('open-file', download.path);
                }
            },
            {
                label: '打开文件夹',
                click: () => {
                    let dir = download.path.split('/').slice(0, -1).join('/');
                    ipcRenderer.send('open-folder', dir);
                }
            },
        ];
        var menu = new remote.Menu.buildFromTemplate(templates);

        menu.popup(remote.getCurrentWindow());
    }

    showMessageAction(message) {
        var caniforward = [1, 3, 47, 43, 49 + 6].includes(message.MsgType);
        var templates = [
            {
                label: '删除',
                click: () => {
                    this.props.deleteMessage(message.MsgId);
                }
            },
        ];
        var menu;

        if (caniforward) {
            templates.unshift({
                label: '转发',
                click: () => {
                    this.props.showForward(message);
                }
            });
        }

        if (message.isme
            && message.CreateTime - new Date() < 2 * 60 * 1000) {
            templates.unshift({
                label: '撤回',
                click: () => {
                    this.props.recallMessage(message);
                }
            });
        }

        if (message.uploading) return;

        menu = new remote.Menu.buildFromTemplate(templates);
        menu.popup(remote.getCurrentWindow());
    }

    showMenu() {
        var user = this.props.user;
        var menu = new remote.Menu.buildFromTemplate([
            {
                label: '切换会话',
                click: () => {
                    this.props.toggleConversation();
                }
            },
            {
                type: 'separator',
            },
            {
                label: '清空内容',
                click: () => {
                    this.props.empty(user);
                }
            },
            {
                type: 'separator'
            },
            {
                label: helper.isTop(user) ? '取消置顶' : '置顶',
                click: () => {
                    this.props.sticky(user);
                }
            },
            {
                label: '删除',
                click: () => {
                    this.props.removeChat(user);
                }
            },
        ]);

        menu.popup(remote.getCurrentWindow());
    }

    handleScroll(e) {
        var tips = this.refs.tips;
        var viewport = e.target;
        var unread = viewport.querySelectorAll(`.${classes.message}.unread`);
        var rect = viewport.getBoundingClientRect();
        var counter = 0;

        Array.from(unread).map(e => {
            if (e.getBoundingClientRect().top > rect.bottom) {
                counter += 1;
            } else {
                e.classList.remove('unread');
            }
        });

        if (counter) {
            tips.innerHTML = `你有 ${counter} 条未读消息。`;
            tips.classList.add(classes.show);
        } else {
            tips.classList.remove(classes.show);
        }
    }

    scrollBottomWhenSentMessage() {
        var { user, messages } = this.props;
        var list = messages.get(user.id);

        return list.slice(-1).isme;
    }

    componentWillUnmount() {
        !this.props.remeberConversation && this.props.reset();
    }

    componentDidUpdate() {
        var viewport = this.refs.viewport;
        var tips = this.refs.tips;

        if (viewport) {
            let newestMessage = this.props.messages.get(this.props.user.UserName).data.slice(-1)[0];
            let images = viewport.querySelectorAll('img.unload');

            // Scroll to bottom when you sent message
            if (newestMessage
                    && newestMessage.isme) {
                viewport.scrollTop = viewport.scrollHeight;
                return;
            }

            // Show the unread messages count
            if (viewport.scrollTop < this.scrollTop) {
                let counter = viewport.querySelectorAll(`.${classes.message}.unread`).length;

                if (counter) {
                    tips.innerHTML = `你有 ${counter} 条未读消息。`;
                    tips.classList.add(classes.show);
                }
                return;
            }

            // Auto scroll to bottom when message has been loaded
            Array.from(images).map(e => {
                on(e, 'load', ev => {
                    off(e, 'load');
                    e.classList.remove('unload');
                    viewport.scrollTop = viewport.scrollHeight;
                    this.scrollTop = viewport.scrollTop;
                });

                on(e, 'error', ev => {
                    var fallback = ev.target.dataset.fallback;

                    if (fallback === 'undefined') {
                        fallback = 'assets/images/broken.png';
                    }

                    ev.target.src = fallback;
                    ev.target.removeAttribute('data-fallback');

                    off(e, 'error');
                });
            });

            // Hide the unread message count
            tips.classList.remove(classes.show);
            viewport.scrollTop = viewport.scrollHeight;
            this.scrollTop = viewport.scrollTop;

            // Mark message has been loaded
            Array.from(viewport.querySelectorAll(`.${classes.message}.unread`)).map(e => e.classList.remove('unread'));
        }
    }

    componentWillReceiveProps(nextProps) {
        // When the chat user has been changed, show the last message in viewport
        if (this.props.user && nextProps.user
            && this.props.user.UserName !== nextProps.user.UserName) {
            this.scrollTop = -1;
        }
    }

    render() {
        var { loading, showConversation, user, messages } = this.props;
        var title = user.RemarkName || user.NickName;
        var signature = user.Signature;

        if (loading) return false;

        return (
            <div
                className={clazz(classes.container, {
                    [classes.hideConversation]: !showConversation,
                })}
                onClick={e => this.handleClick(e)}>
                {
                    user ? (
                        <div>
                            <header>
                                <div className={classes.info}>
                                    <p
                                        dangerouslySetInnerHTML={{__html: title}}
                                        title={title} />

                                    <span
                                        className={classes.signature}
                                        dangerouslySetInnerHTML={{__html: signature || '这家伙很懒，没有签名~'}}
                                        onClick={e => this.props.showMembers(user)}
                                        title={signature} />
                                </div>

                                <i
                                    className="icon-ion-android-more-vertical"
                                    onClick={() => this.showMenu()} />
                            </header>

                            <div
                                className={classes.messages}
                                onScroll={e => this.handleScroll(e)}
                                ref="viewport">
                                {
                                    this.renderMessages(messages.get(user.UserName), user)
                                }
                            </div>
                        </div>
                    ) : (
                        <div className={clazz({
                            [classes.noselected]: !user,
                        })}>
                            <img
                                className="disabledDrag"
                                src="assets/images/noselected.png" />
                            <h1>还没有选择聊天</h1>
                        </div>
                    )
                }

                <div
                    className={classes.tips}
                    ref="tips">
                    Unread message.
                </div>
            </div>
        );
    }
}
