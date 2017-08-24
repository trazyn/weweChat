
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Transition from 'react-addons-css-transition-group';

export default class TransitionPortal extends Component {
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
