
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import clazz from 'classname';
import moment from 'moment';

import classes from './style.css';
import Avatar from 'components/Avatar';

moment.updateLocale('en', {
    relativeTime: {
        past: '%s',
        m: 'a min',
        mm: '%d mins',
        h: 'an h',
        hh: '%d h',
        s: 'now',
        ss: '%d s',
    },
});

@inject(stores => ({
    chats: stores.home.chats,
    chatTo: stores.home.chatTo,
    selected: stores.home.user,
    messages: stores.home.messages,
    loading: stores.session.loading,
}))
@observer
export default class Chats extends Component {
    getTheLastestMessage(userid) {
        var list = this.props.messages[userid] || [];
        var res;

        list.map(e => {
            if (e.FromUserName === userid) {
                res = e;
            }
        });

        return res;
    }

    getMessageContent(message) {
        switch (message.MsgType) {
            case 1:
                // Text message
                return message.Content;

            case 3:
                // Image
                return '[Image]';
        }
    }

    hasUnreadMessage(userid) {
        var list = this.props.messages[userid] || [];
        return list.length !== (list.unread || 0);
    }

    render() {
        var { loading, chats, selected, chatTo } = this.props;

        if (loading) return false;

        return (
            <div className={classes.container}>
                <div className={classes.chats}>
                    {
                        chats.map((e, index) => {
                            var message = this.getTheLastestMessage(e.UserName) || {};

                            return (
                                <div className={clazz(classes.chat, selected && selected.UserName === e.UserName && classes.active)} key={index} onClick={ev => chatTo(e)}>
                                    <div className={classes.inner}>
                                        <div className={this.hasUnreadMessage(e.UserName) && classes.reddot}>
                                            <Avatar src={e.HeadImgUrl} />
                                        </div>

                                        <div className={classes.info}>
                                            <p className={classes.username} dangerouslySetInnerHTML={{__html: e.RemarkName || e.NickName}} />

                                            <span className={classes.message} dangerouslySetInnerHTML={{__html: this.getMessageContent(message) || 'No Message'}} />
                                        </div>
                                    </div>

                                    <span className={classes.times}>
                                        {
                                            message.CreateTime ? moment(message.CreateTime * 1000).fromNow() : ''
                                        }
                                    </span>
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        );
    }
}
