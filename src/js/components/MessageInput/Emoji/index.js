
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import clazz from 'classname';
import delegate from 'delegate';

import classes from './style.css';
import { emoji } from 'utils/emoji';

export default class Emoji extends Component {
    static propTypes = {
        output: PropTypes.func.isRequired,
        show: PropTypes.bool.isRequired,
        close: PropTypes.func.isRequired,
    };

    componentDidMount() {
        delegate(this.refs.container, 'a.qqemoji', 'click', e => {
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

    renderEmoji(emoji) {
        return emoji.map((e, index) => {
            var { key, className } = e;
            return (
                <a
                    className={className}
                    key={index}
                    title={key} />
            );
        });
    }

    render() {
        return (
            <div
                ref="container"
                tabIndex="-1"
                className={clazz(classes.container, {
                    [classes.show]: this.props.show
                })}
                onBlur={e => this.props.close()}>
                <div className={classes.row}>
                    {this.renderEmoji(emoji.slice(0, 15))}
                </div>

                <div className={classes.row}>
                    {this.renderEmoji(emoji.slice(15, 30))}
                </div>

                <div className={classes.row}>
                    {this.renderEmoji(emoji.slice(30, 45))}
                </div>

                <div className={classes.row}>
                    {this.renderEmoji(emoji.slice(45, 60))}
                </div>

                <div className={classes.row}>
                    {this.renderEmoji(emoji.slice(60, 75))}
                </div>

                <div className={classes.row}>
                    {this.renderEmoji(emoji.slice(75, 90))}
                </div>

                <div className={classes.row}>
                    {this.renderEmoji(emoji.slice(90, 105))}
                </div>
            </div>
        );
    }
}
