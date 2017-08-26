
import React, { Component, PropTypes } from 'react';
import clazz from 'classname';

import blacklist from 'utils/blacklist';
import './style.global.css';

export default class Avatar extends Component {
    static propTypes = {
        src: PropTypes.string,
        fallback: PropTypes.string,
    };

    static defaultProps = {
        fallback: 'http://i.pravatar.cc/200',
    };

    handleError(e) {
        e.target.src = this.props.fallback;
    }

    handleLoad(e) {
        e.target.classList.remove('fadein');
    }

    render() {
        if (!this.props.src) return false;

        return (
            <img
                {...blacklist(this.props, 'fallback', 'className', 'onLoad', 'onError')}
                className={clazz('Avatar', 'fade fadein', this.props.className)}
                onLoad={e => this.handleLoad(e)}
                onError={e => this.handleError(e)} />
        );
    }
}
