
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import clazz from 'classname';

import classes from './style.css';
import Avatar from 'components/Avatar';

@inject(stores => ({
    chats: stores.home.chats,
    chatTo: stores.home.chatTo,
    selected: stores.home.user,
    loading: stores.session.loading,
}))
@observer
export default class Chats extends Component {
    render() {
        var { loading, chats, selected, chatTo } = this.props;

        if (loading) return false;

        return (
            <div className={classes.container}>
                <div className={classes.chats}>
                    {
                        chats.map((e, index) => {
                            return (
                                <div className={clazz(classes.chat, selected && selected.UserName === e.UserName && classes.active)} key={index} onClick={ev => chatTo(e)}>
                                    <div className={classes.inner}>
                                        <Avatar src={e.HeadImgUrl} />

                                        <div className={classes.info}>
                                            <p className={classes.username} dangerouslySetInnerHTML={{__html: e.RemarkName || e.NickName}} />

                                            <span className={classes.message} dangerouslySetInnerHTML={{__html: e.PYQuanPin || 'NO Message'}} />
                                        </div>
                                    </div>

                                    <span className={classes.times}>11 mins</span>
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        );
    }
}
