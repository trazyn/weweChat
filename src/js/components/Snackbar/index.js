
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './style.global.css';
import TransitionPortal from '../TransitionPortal';

export default class Snackbar extends Component {
    static propTypes = {
        show: PropTypes.bool.isRequired,
        text: PropTypes.string.isRequired,
        close: PropTypes.func.isRequired,
    };

    renderContent() {
        if (!this.props.show) {
            return false;
        }

        return (
            <div className="Snackbar">
                <div
                    className="Snackbar-text"
                    dangerouslySetInnerHTML={{__html: this.props.text}} />
                <div
                    className="Snackbar-action"
                    onClick={() => this.props.close()}>
                    DONE
                </div>
            </div>
        );
    }

    render() {
        return (
            <TransitionPortal
                transitionEnterTimeout={0}
                transitionLeaveTimeout={150}
                transitionName="Snackbar">
                {this.renderContent()}
            </TransitionPortal>
        );
    }
}
