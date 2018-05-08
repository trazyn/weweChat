
import React, { Component } from 'react';

import classes from './style.css';

export default class Header extends Component {
    getTitle() {
        switch (this.props.location.pathname) {
            case '/contacts':
                return '联系人 - 微信';

            case '/settings':
                return '设置 - 微信';

            default:
                return '微信';
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
