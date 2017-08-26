
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import clazz from 'classname';

import classes from './style.css';
import Loader from 'components/Loader';
import SearchBar from './SearchBar';
import Chats from './Chats';
import ChatContent from './ChatContent';

@inject(stores => ({
    loading: stores.session.loading,
    showConversation: stores.chat.showConversation,
    toggleConversation: stores.chat.toggleConversation,
    newChat: () => stores.newchat.toggle(true),
}))
@observer
export default class Home extends Component {
    componentDidMount() {
        this.props.toggleConversation(true);
    }

    render() {
        return (
            <div className={classes.container}>
                <Loader show={this.props.loading} fullscreen={true} />
                <div className={clazz(classes.inner, {
                    [classes.hideConversation]: !this.props.showConversation
                })}>
                    <div className={classes.left}>
                        <SearchBar />
                        <Chats />

                        <div className={classes.addChat} onClick={() => this.props.newChat()}>
                            <i className="icon-ion-android-add" />
                        </div>
                    </div>

                    <div className={classes.right}>
                        <ChatContent />
                    </div>
                </div>
            </div>
        );
    }
}
