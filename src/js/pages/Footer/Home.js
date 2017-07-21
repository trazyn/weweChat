
import React, { Component } from 'react';
import { inject } from 'mobx-react';

import classes from './style.css';
import Emoji from './Emoji';

@inject(stores => ({
    sendMessage: stores.home.sendMessage
}))
export default class Input extends Component {
    handleEnter(e) {
        if (e.charCode !== 13) return;

        this.props.sendMessage(this.refs.input.value);
        this.refs.input.value = '';
    }

    state = {
        showEmoji: false
    };

    toggleEmoji(show = !this.state.showEmoji) {
        this.setState({
            showEmoji: show,
        });
    }

    writeEmoji(emoji) {
        this.refs.input.value += `[${emoji}]`;
    }

    render() {
        return (
            <div className={classes.home}>
                <input type="text" ref="input" placeholder="Type someting to sned..." onKeyPress={e => this.handleEnter(e)} />

                <div className={classes.action}>
                    <i className="icon-ion-ios-mic" />
                    <i className="icon-ion-android-attach" />
                    <i className="icon-ion-ios-heart" onClick={e => this.toggleEmoji(true)} />

                    <Emoji
                        output={emoji => this.writeEmoji(emoji)}
                        close={e => setTimeout(() => this.toggleEmoji(false), 100)}
                        show={this.state.showEmoji} />
                </div>
            </div>
        );
    }
}
