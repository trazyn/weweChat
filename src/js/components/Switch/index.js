
import React, { Component } from 'react';

import blacklist from 'utils/blacklist';
import './style.global.css';

export default class Switch extends Component {
    render() {
        return (
            <span className="Switch">
                <input
                    {...blacklist(this.props, 'className', 'children')}
                    type="checkbox" />
                <span className="Switch--fake" />
            </span>
        );
    }
}
