
import React, { Component } from 'react';

import classes from './style.css';
import Input from './Input';
import Filter from './Filter';
import Placeholder from './Placeholder';

export default class Footer extends Component {
    componentWillReceiveProps(nextProps) {
        console.log(nextProps);
    }

    state = {
        showInput: true,
        showFilter: false,
        showPlaceholder: false,
    };

    toggleState(key) {
        var state = Object.assign({}, this.state);

        for (let key in state) {
            state[key] = false;
        }

        state[key] = true;

        this.setState(state);
    }

    render() {
        var { showInput, showFilter, showPlaceholder } = this.state;

        return (
            <footer className={classes.footer}>
                <nav ref="nav">
                    <span className={showInput && classes.active} onClick={() => this.toggleState('showInput')}>
                        <i className="icon-ion-android-chat" />
                    </span>

                    <span className={showFilter && classes.active} onClick={() => this.toggleState('showFilter')}>
                        <i className="icon-ion-ios-book-outline" />
                    </span>

                    <span className={showPlaceholder && classes.active} onClick={() => this.toggleState('showPlaceholder')}>
                        <i className="icon-ion-android-more-vertical" />
                    </span>
                </nav>

                <div className={classes.right}>
                    {
                        showInput && (<Input />)
                    }
                    {
                        showFilter && (<Filter />)
                    }
                    {
                        showPlaceholder && (<Placeholder />)
                    }
                </div>
            </footer>
        );
    }
}
