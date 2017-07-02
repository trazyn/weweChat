
import React, { Component } from 'react';

export default class Layout extends Component {
    render() {
        return (
            <div>
                <h2>
                    Hhahh ...
                </h2>
                {this.props.children}
            </div>
        );
    }
}
