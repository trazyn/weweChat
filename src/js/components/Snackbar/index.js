
import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import Transition from 'react-addons-css-transition-group';

import './style.global.css';

class TransitionPortal extends Component {
    ele;

    componentDidMount() {
        this.ele = document.createElement('div');
        document.body.appendChild(this.ele);
        this.componentDidUpdate();
    }

    componentDidUpdate() {
        ReactDOM.render(<Transition {...this.props}>{this.props.children}</Transition>, this.ele);
    }

    componentWillUnmount() {
        document.body.removeChild(this.ele);
    }

    render() {
        return null;
    }
}

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
                <div className="Snackbar-text">{this.props.text}</div>
                <div className="Snackbar-action" onClick={() => this.props.close()}>UNDO</div>
            </div>
        );
    }

    render() {
        return (
            <TransitionPortal transitionEnterTimeout={0} transitionLeaveTimeout={150} transitionName="Snackbar">
                {this.renderContent()}
            </TransitionPortal>
        );
    }
}
