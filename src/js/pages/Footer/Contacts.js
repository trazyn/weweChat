
import React, { Component } from 'react';
import { inject } from 'mobx-react';

import classes from './style.css';
import Switch from 'components/Switch';

@inject(stores => ({
    filter: stores.contacts.filter,
    showGroup: stores.contacts.showGroup,
    toggleGroup: stores.contacts.toggleGroup,
}))
export default class Filter extends Component {
    // Improve filter performance
    timer;

    doFilter(text = '') {
        text = text.trim();

        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.props.filter(text);
        }, 300);
    }

    handleShowGroup(e) {
        this.props.toggleGroup(e.target.checked);
        this.doFilter(this.refs.filter.value);
    }

    componentWillUnmount() {
        this.props.filter();
    }

    render() {
        return (
            <div className={classes.contacts}>
                <input
                    onInput={e => this.doFilter(e.target.value)}
                    placeholder="输入搜索内容..."
                    ref="filter"
                    type="text" />

                <div className={classes.action}>
                    <label htmlFor="showGroup">
                        <span className={classes.options}>显示分组</span>
                        <Switch
                            defaultChecked={this.props.showGroup}
                            id="showGroup"
                            onClick={e => this.handleShowGroup(e)} />
                    </label>
                </div>
            </div>
        );
    }
}
