
import React, { Component } from 'react';

import classes from './style.css';

export default class Header extends Component {
    getTitle() {
        switch (this.props.location.pathname) {
            case '/contacts':
                return 'Contacts - WeWeChat';

            case '/settings':
                return 'Settings - WeWeChat';

            default:
                return 'WeWeChat';
        }
    }

    render() {
        return (
            <header className={classes.container}>
                <h1>{this.getTitle()}</h1>
            </header>
        );
    }
}
