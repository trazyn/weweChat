
import React, { Component } from 'react';

import classes from './style.css';

export default class SearchBar extends Component {
    render() {
        return (
            <div className={classes.container}>
                <i className="icon-ion-ios-search-strong" />
                <input type="text" placeholder="Saerch ..." />
            </div>
        );
    }
}
