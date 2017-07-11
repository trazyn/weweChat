
import React, { Component } from 'react';
import { inject } from 'mobx-react';

import classes from './style.css';

@inject(stores => ({
    sendMessage: stores.home.sendMessage
}))
export default class Input extends Component {
    handleEnter(e) {
        if (e.charCode !== 13) return;

        this.props.sendMessage(this.refs.input.value);
        this.refs.input.value = '';
    }

    render() {
        return (
            <div className={classes.home}>
                <input type="text" ref="input" placeholder="Type someting to sned..." onKeyPress={e => this.handleEnter(e)} />

                <div className={classes.action}>
                    <i className="icon-ion-ios-mic" />
                    <i className="icon-ion-android-attach" />
                    <i className="icon-ion-ios-heart" />
                </div>
            </div>
        );
    }
}
