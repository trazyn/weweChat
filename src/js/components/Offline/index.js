
import React, { Component, PropTypes } from 'react';

import classes from './style.css';

export default class Avatar extends Component {
    static propTypes = {
        show: PropTypes.bool.isRequired,
    };

    static defaultProps = {
        show: false,
    };

    render() {
        if (!this.props.show) return false;

        return (
            <div className={classes.container}>
                <div>
                    <img src="assets/images/offline.png" className="disabledDrag" />
                    <h1>Oops, seems like you are offline!</h1>
                    <button onClick={e => window.location.reload()}>Reload</button>
                </div>
            </div>
        );
    }
}
