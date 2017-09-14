
import React, { Component, PropTypes } from 'react';
import clazz from 'classname';

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
                className={clazz('Avatar', 'fade fadein', this.props.className)}
                src={this.props.src}
                onLoad={e => this.handleLoad(e)}
                onError={e => this.handleError(e)} />
        );
    }
}
