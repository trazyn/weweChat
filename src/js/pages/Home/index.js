
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';

import classes from './style.css';
import Loader from 'components/Loader';
import SearchBar from './SearchBar';
import Chats from './Chats';
import ChatContent from './ChatContent';

@inject(stores => ({
    loading: stores.session.loading,
}))
@observer
export default class Home extends Component {
    render() {
        return (
            <div className={classes.container}>
                <Loader show={this.props.loading} fullscreen={true} />
                <div className={classes.inner}>
                    <div className={classes.left}>
                        <SearchBar />
                        <Chats />

                        <div className={classes.addChat}>
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
