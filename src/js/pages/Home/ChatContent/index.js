
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { ipcRenderer } from 'electron';
import clazz from 'classname';
import moment from 'moment';
import axios from 'axios';

import classes from './style.css';
import Avatar from 'components/Avatar';
import helper from 'utils/helper';

@inject(stores => ({
    user: stores.chat.user,
    messages: stores.chat.messages,
    loading: stores.session.loading,
    showUserinfo: async(isme, user) => {
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

        stores.userinfo.toggle(true, user);
    },
    showContact: (userid) => {
        var user = stores.contacts.memberList.find(e => e.UserName === userid);
        stores.userinfo.toggle(true, user);
    },
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
}))
@observer
export default class ChatContent extends Component {
    getMessageContent(message) {
        switch (message.MsgType) {
            case 1:
                if (message.location) {
                    return `
                        <img class="open-map" data-map="${message.location.href}" src="${message.location.image}" />
                        <label>${message.location.label}</label>
                    `;
                }
                // Text message
                return message.Content;
            case 3:
                // Image
                let images = message.images;
                return `<img class="open-image" data-id="${message.MsgId}" src="${images.src}" />`;
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
                // External emoji
                let emoji = message.emoji;

                if (emoji) {
                    return `<img src="${emoji.src}" />`;
                }
                return `
                    <div class="${classes.invalidEmoji}">
                        <div></div>
                        <span>Send an emoji, view it on mobile</span>
                    </div>
                `;

            case 42:
                // Contact Card
                let contact = message.contact;
                let html = `
                    <div class="${clazz(classes.contact, { 'is-friend': contact.isFriend })}" data-userid="${contact.UserName}">
                        <img src="${contact.image}" />

                        <div>
                            <p>${contact.name}</p>
                            <p>${contact.address}</p>
                        </div>
                `;

                if (!contact.isFriend) {
                    html += `
                        <i class="icon-ion-android-add" data-userid="${contact.UserName}"></i>
                    `;
                }

                html += '</div>';

                return html;

            case 43:
                // Video message
                let video = message.video;

                return `
                    <video preload="metadata" poster="${video.cover}" controls src="${video.src}" />
                `;

            case 49 + 2000:
                // Money transfer
                let transfer = message.transfer;

                return `
                    <div class="${classes.transfer}">
                        <h4>Money Transfer</h4>
                        <span>💰 ${transfer.money}</span>
                        <p>如需收钱，请打开手机微信确认收款。</p>
                    </div>
                `;

            case 49 + 6:
                // File message
                let file = message.file;

                return `
                    <div class="${classes.file}">
                        <img src="assets/images/filetypes/${helper.getFiletypeIcon(file.extension)}" />

                        <div>
                            <p>${file.name}</p>
                            <p>${helper.humanSize(file.size)}</p>
                        </div>

                        <i class="icon-ion-android-arrow-down"></i>
                    </div>
                `;

            case 49 + 17:
                // Location sharing...
                return `
                    <div class="${classes.locationSharing}">
                        <i class="icon-ion-ios-location"></i>
                        Location sharing, Please check your phone.
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
                        className={clazz(classes.message, classes.system)}
                        dangerouslySetInnerHTML={{__html: e.Content}} />
                );
            }

            if (!user) {
                return false;
            }

            return (
                <div className={clazz(classes.message, {
                    [classes.isme]: message.isme,
                    [classes.isText]: type === 1 && !message.location,
                    [classes.isLocation]: type === 1 && message.location,
                    [classes.isImage]: type === 3,
                    [classes.isEmoji]: type === 47,
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

                        <div className={classes.content}>
                            <p dangerouslySetInnerHTML={{__html: this.getMessageContent(message)}} />

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
            var response = await axios.get(target.src, { responseType: 'arraybuffer' });
            var base64 = new window.Buffer(response.data, 'binary').toString('base64');

            ipcRenderer.send('open-image', target.dataset, base64);

            return;
        }

        // Play the voice message
        if (target.tagName === 'DIV'
            && target.classList.contains('play-voice')) {
            var audio = target.querySelector('audio');

            audio.onplay = () => target.classList.add(classes.playing);
            audio.onended = () => target.classList.remove(classes.playing);
            audio.play();

            return;
        }

        // Open the location
        if (target.tagName === 'IMG'
            && target.classList.contains('open-map')) {
            ipcRenderer.send('open-map', target.dataset.map);
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
            && target.classList.contains('addFriend')) {
            this.props.showAddFriend({
                UserName: target.dataset.userid
            });
        }
    }

    showMenu() {

    }

    componentDidUpdate() {
        var viewport = this.refs.viewport;

        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }

    render() {
        var { loading, user, messages } = this.props;
        var title = user.RemarkName || user.NickName;

        if (loading) return false;

        return (
            <div className={clazz(classes.container, { [classes.notfound]: !user })} onClick={e => this.handleClick(e)}>
                {
                    user ? (
                        <div>
                            <header>
                                <div className={classes.info}>
                                    <p title={title} dangerouslySetInnerHTML={{__html: title}} />

                                    <span className={classes.signature} dangerouslySetInnerHTML={{__html: user.Signature || 'No Signature'}} />
                                </div>

                                <i className="icon-ion-android-more-vertical" onClick={() => this.showMenu()} />
                            </header>

                            <div className={classes.messages} ref="viewport">
                                {
                                    this.renderMessages(messages.get(user.UserName), user)
                                }
                            </div>
                        </div>
                    ) : (
                        <div className={classes.inner}>
                            <img src="assets/images/noselected.png" />
                            <h1>No Chat selected.</h1>
                        </div>
                    )
                }
            </div>
        );
    }
}
