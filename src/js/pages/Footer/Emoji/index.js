
import React, { Component, PropTypes } from 'react';
import clazz from 'classname';
import delegate from 'delegate';

import classes from './style.css';
import emoji from 'utils/emoji';

export default class Emoji extends Component {
    static propTypes = {
        output: PropTypes.func.isRequired,
        show: PropTypes.bool.isRequired,
        close: PropTypes.func.isRequired,
    };

    componentDidMount() {
        delegate(this.refs.container, 'a.face', 'click', e => {
            e.preventDefault();
            e.stopPropagation();

            this.props.output(e.target.title);
            this.props.close();
        });
    }

    componentDidUpdate() {
        if (this.props.show) {
            this.refs.container.focus();
        }
    }

    renderEmoji(emoji, sequence) {
        return emoji.map((e, index) => {
            var key = Object.keys(e)[0];
            return <a key={index} title={key} className={clazz('face', `qqface${index + sequence}`)}>{key}</a>;
        });
    }

    render() {
        return (
            <div
                ref="container"
                tabIndex="-1"
                className={clazz(classes.container, 'qq_face', {
                    [classes.show]: this.props.show
                })}
                onBlur={e => this.props.close()}>
                <div className={classes.row}>
                    {this.renderEmoji(emoji.slice(0, 15), 0)}
                </div>

                <div className={classes.row}>
                    {this.renderEmoji(emoji.slice(15, 30), 15)}
                </div>

                <div className={classes.row}>
                    {this.renderEmoji(emoji.slice(30, 45), 30)}
                </div>

                <div className={classes.row}>
                    {this.renderEmoji(emoji.slice(45, 60), 45)}
                </div>

                <div className={classes.row}>
                    {this.renderEmoji(emoji.slice(60, 75), 60)}
                </div>

                <div className={classes.row}>
                    {this.renderEmoji(emoji.slice(75, 90), 75)}
                </div>

                <div className={classes.row}>
                    {this.renderEmoji(emoji.slice(90, 105), 90)}
                </div>
            </div>
        );
    }
}
