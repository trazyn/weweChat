
import React, { Component, PropTypes } from 'react';
import Transition from 'react-addons-css-transition-group';
import clazz from 'classname';

import './style.css';

export default class Button extends Component {
    static PropTypes = {
        show: PropTypes.bool
    };

    renderContent() {
        if (!this.props.show) {
            return;
        }

        return (
            <div className={clazz('Loader', this.props.className)}>
                <svg className="Loader-circular">
                    <circle className="Loader-path" cx="50" cy="50" r="20" fill="none" strokeWidth="5" strokeMiterlimit="10" />
                </svg>
            </div>
        );
    }

    render() {
        return (
            <div>
                <Transition transitionName="Loader" transitionEnterTimeout={200} transitionLeaveTimeout={200}>
                    {this.renderContent()}
                </Transition>
            </div>
        );
    }
}
