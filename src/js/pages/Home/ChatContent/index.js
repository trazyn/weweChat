
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { ipcRenderer } from 'electron';
import clazz from 'classname';
import moment from 'moment';
import axios from 'axios';

import classes from './style.css';
import Avatar from 'components/Avatar';
import helper from 'utils/helper';
import { Modal, ModalBody } from 'components/Modal';

@inject(stores => ({
    user: stores.home.user,
    messages: stores.home.messages,
    loading: stores.session.loading,
    showUserinfo: (isme) => {
        stores.userinfo.toggle(true, isme ? stores.session.user.User : stores.home.user);
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

            user = from.MemberList.find(e => e.UserName === matchs[0]);
            message.Content = matchs[1];
        }

        return { message, user };
    },
    addFriend: stores.home.addFriend,
    me: stores.session.user,
}))
@observer
export default class ChatContent extends Component {
    state = {
        showFriendRequest: false,
        userid: '',
    };

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
                    </div>
                `;

                if (!contact.isFriend) {
                    html += `
                        <i class="icon-ion-android-add" data-userid="${contact.UserName}" />
                    `;
                }

                return html;
        }
    }

    addFriend() {
        this.props.addFriend(this.state.userid, this.refs.input.value);
        this.toggleFriendRequest(false);
    }

    renderMessages(list, from) {
        return list.data.map((e, index) => {
            var { message, user } = this.props.parseMessage(e, from);

            return (
                <div className={clazz(classes.message, {
                    [classes.isme]: message.isme,
                    [classes.isText]: message.MsgType === 1 && !message.location,
                    [classes.isLocation]: message.MsgType === 1 && message.location,
                    [classes.isImage]: message.MsgType === 3,
                    [classes.isEmoji]: message.MsgType === 47,
                    [classes.isVoice]: message.MsgType === 34,
                    [classes.isContact]: message.MsgType === 42,
                })} key={index}>
                    <div>
                        <Avatar src={message.isme ? message.HeadImgUrl : user.HeadImgUrl} className={classes.avatar} onClick={ev => this.props.showUserinfo(message.isme)} />

                        <div className={classes.content}>
                            <p dangerouslySetInnerHTML={{__html: this.getMessageContent(message)}} />

                            <span className={classes.times}>{ moment(message.CreateTime * 1000).fromNow() }</span>
                        </div>
                    </div>
                </div>
            );
        });
    }

    toggleFriendRequest(show = !this.state.showFriendRequest, userid) {
        this.setState({
            showFriendRequest: show,
            userid,
        });
    }

    async handleClick(e) {
        var target = e.target;

        if (target.tagName === 'IMG'
            && target.classList.contains('open-image')) {
            // Get image from cache and convert to base64
            var response = await axios.get(target.src, { responseType: 'arraybuffer' });
            var base64 = new window.Buffer(response.data, 'binary').toString('base64');

            ipcRenderer.send('open-image', target.dataset, base64);

            return;
        }

        if (target.tagName === 'DIV'
            && target.classList.contains('play-voice')) {
            var audio = target.querySelector('audio');

            audio.onplay = () => target.classList.add(classes.playing);
            audio.onended = () => target.classList.remove(classes.playing);
            audio.play();

            return;
        }

        if (target.tagName === 'IMG'
            && target.classList.contains('open-map')) {
            ipcRenderer.send('open-map', target.dataset.map);
        }

        if (target.tagName === 'DIV'
            && target.classList.contains('is-friend')) {
            this.props.showContact(target.dataset.userid);
        }

        if (target.tagName === 'I'
            && target.classList.contains('icon-ion-android-add')) {
            this.toggleFriendRequest(true, target.dataset.userid);
        }
    }

    componentDidUpdate() {
        var viewport = this.refs.viewport;

        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }

    render() {
        var { loading, me, user, messages } = this.props;

        if (loading) return false;

        return (
            <div className={clazz(classes.container, { [classes.notfound]: !user })} onClick={e => this.handleClick(e)}>
                {
                    user ? (
                        <div>
                            <header>
                                <div className={classes.info}>
                                    <p dangerouslySetInnerHTML={{__html: user.RemarkName || user.NickName}} />

                                    <span dangerouslySetInnerHTML={{__html: user.Signature || 'No Signature'}} />
                                </div>

                                <i className="icon-ion-android-more-vertical" />
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

                <Modal show={this.state.showFriendRequest} fullscreen={true}>
                    <ModalBody className={classes.friendRequest}>
                        Send friend request first

                        <input type="text" defaultValue={`Hallo, im ${me && me.User.NickName}`} autoFocus={true} ref="input" />

                        <div>
                            <button onClick={e => this.addFriend()}>Send</button>

                            <button onClick={e => this.toggleFriendRequest(false)}>Cancel</button>
                        </div>
                    </ModalBody>
                </Modal>
            </div>
        );
    }
}
