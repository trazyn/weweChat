
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import clazz from 'classname';
import moment from 'moment';

import classes from './style.css';
import Avatar from 'components/Avatar';

@inject(stores => ({
    user: stores.home.user,
    messages: stores.home.messages,
    loading: stores.session.loading,
    showUserinfo: () => {
        stores.userinfo.toggle(stores.home.user);
    },
}))
@observer
export default class ChatContent extends Component {
    getMessageContent(message) {
        switch (message.MsgType) {
            case 1:
                // Text message
                return message.Content;
            case 3:
                // Image
                let images = message.images;
                return `<img src="${images.src}" />`;
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
                    <div style="width: ${width}px" data-voice="${voice.src}">
                        <i class="icon-ion-android-volume-up"></i>
                        <span>
                            ${seconds || '60+'}"
                        </span>
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
        }
    }

    renderMessages(list, from) {
        return list.data.map((e, index) => {
            return (
                <div className={clazz(classes.message, {
                    [classes.isme]: e.isme,
                    [classes.isText]: e.MsgType === 1,
                    [classes.isImage]: e.MsgType === 3,
                    [classes.isEmoji]: e.MsgType === 47,
                    [classes.isVoice]: e.MsgType === 34,
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

    componentDidUpdate() {
        var viewport = this.refs.viewport;

        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }

    render() {
        var { loading, user, messages } = this.props;

        if (loading) return false;

        if (!user) {
            return (
                <div className={clazz(classes.container, classes.notfound)}>
                    <div className={classes.inner}>
                        <img src="assets/images/noselected.png" />
                        <h1>No Chat selected.</h1>
                    </div>
                </div>
            );
        }

        return (
            <div className={classes.container}>
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
        );
    }
}
