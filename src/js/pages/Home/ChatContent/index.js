
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
                return message.Content;
            case 3:
                let images = message.images;
                console.log(images);
                return `<img src="${images.src}" />`;
        }
    }

    renderMessages(list, from) {
        return list.map((e, index) => {
            if (e.isme) {
                return (
                    <div className={clazz(classes.message, classes.isme)} key={index}>
                        <div>
                            <Avatar src={from.HeadImgUrl} className={classes.avatar} onClick={e => this.props.showUserinfo()} />

                            <div className={classes.content}>
                                <p dangerouslySetInnerHTML={{__html: this.getMessageContent(e)}} />

                                <span className={classes.times}>{ moment(e.CreateTime * 1000).fromNow() }</span>
                            </div>
                        </div>
                    </div>
                );
            }

            return (
                <div className={classes.message} key={index}>
                    <div>
                        <Avatar src={from.HeadImgUrl} className={classes.avatar} onClick={e => this.props.showUserinfo()} />

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
                        this.renderMessages(messages[user.UserName], user)
                    }
                </div>
            </div>
        );
    }
}
