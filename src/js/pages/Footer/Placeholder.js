
import React, { Component } from 'react';

import classes from './style.css';

export default class Placeholder extends Component {
    render() {
        return (
            <div className={classes.placeholder}>
                <button>
                    Send feedback
                    <i className="icon-ion-ios-email-outline" />
                </button>

                <button>
                    Fork on Github
                    <i className="icon-ion-social-github" />
                </button>
            </div>
        );
    }
}
