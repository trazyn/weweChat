
import React, { Component } from 'react';

import classes from './style.css';

export default class Input extends Component {
    render() {
        return (
            <div className={classes.input}>
                <input type="text" placeholder="Type someting to sned..." />

                <div className={classes.action}>
                    <i className="icon-ion-ios-mic" />
                    <i className="icon-ion-android-attach" />
                    <i className="icon-ion-ios-heart" />
                </div>
            </div>
        );
    }
}
