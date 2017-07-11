
import React, { Component } from 'react';

import blacklist from 'utils/blacklist';
import './style.global.css';

export default class Switch extends Component {
    render() {
        return (
            <span className="Switch">
                <input type="checkbox" {...blacklist(this.props, 'className', 'children')} />
                <span className="Switch--fake" />
            </span>
        );
    }
}
