
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { ipcRenderer } from 'electron';
import clazz from 'classname';
import moment from 'moment';
import axios from 'axios';

import classes from './style.css';
import Avatar from 'components/Avatar';

@inject(stores => ({
    user: stores.home.user,
    messages: stores.home.messages,
    loading: stores.session.loading,
    showUserinfo: () => {
        stores.userinfo.toggle(true, stores.home.user);
    },
    showContact: (userid) => {
        var user = stores.contacts.memberList.find(e => e.UserName === userid);
        stores.userinfo.toggle(true, user);
    }
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
                    return `<img src="${emoji.cdnurl}" />`;
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
                        <i class="icon-ion-android-add" />
                    `;
                }

                return html;
        }
    }

    renderMessages(list, from) {
        return list.data.map((e, index) => {
            return (
                <div className={clazz(classes.message, {
                    [classes.isme]: e.isme,
                    [classes.isText]: e.MsgType === 1 && !e.location,
                    [classes.isLocation]: e.MsgType === 1 && e.location,
                    [classes.isImage]: e.MsgType === 3,
                    [classes.isEmoji]: e.MsgType === 47,
                    [classes.isVoice]: e.MsgType === 34,
                    [classes.isContact]: e.MsgType === 42,
                })} key={index}>
                    <div>
                        <Avatar src={e.isme ? e.HeadImgUrl : from.HeadImgUrl} className={classes.avatar} onClick={e => this.props.showUserinfo()} />

                        <div className={classes.content}>
                            <p dangerouslySetInnerHTML={{__html: this.getMessageContent(e)}} />

                            <span className={classes.times}>{ moment(e.CreateTime * 1000).fromNow() }</span>
                        </div>
                    </div>
                </div>
            );
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
    }

    componentDidUpdate() {
        var viewport = this.refs.viewport;

        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }

    render() {
        var { loading, user, messages } = this.props;

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
            </div>
        );
    }
}
