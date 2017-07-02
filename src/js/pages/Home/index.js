
import React, { Component } from 'react';

import styles from './style.css';

export default class Home extends Component {
    componentDidMount() {
        console.log('Home');
    }

    render() {
        return (
            <div className={styles.title}>
                Home
                <i className="icon icon-translate" />
            </div>
        );
    }
}
