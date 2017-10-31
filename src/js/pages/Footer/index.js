
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import clazz from 'classname';

import classes from './style.css';
import Home from './Home';
import Contacts from './Contacts';
import Settings from './Settings';

export default class Footer extends Component {
    render() {
        var pathname = this.props.location.pathname;
        var component = {
            '/': Home,
            '/contacts': Contacts,
            '/settings': Settings,
        }[pathname];

        return (
            <footer className={classes.footer}>
                <nav>
                    <Link
                        className="link"
                        tabIndex="-1"
                        to="/">
                        <span className={clazz({
                            [classes.active]: pathname === '/'
                        })}>
                            <i className="icon-ion-android-chat" />
                        </span>
                    </Link>

                    <Link
                        className="link"
                        tabIndex="-1"
                        to="/contacts">
                        <span className={clazz({
                            [classes.active]: pathname === '/contacts'
                        })}>
                            <i className="icon-ion-ios-book-outline" />
                        </span>
                    </Link>

                    <Link
                        className="link"
                        tabIndex="-1"
                        to="/settings">
                        <span className={clazz({
                            [classes.active]: pathname === '/settings'
                        })}>
                            <i className="icon-ion-android-more-vertical" />
                        </span>
                    </Link>
                </nav>

                <div className={classes.right}>
                    {
                        React.createElement(component)
                    }
                </div>
            </footer>
        );
    }
}
