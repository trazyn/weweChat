
import React, { Component, PropTypes } from 'react';
import clazz from 'classname';

import classes from './style.css';

export default class UserList extends Component {
    static propTypes = {
        max: PropTypes.number.isRequired,
        searching: PropTypes.bool.isRequired,
        search: PropTypes.func.isRequired,
        getList: PropTypes.func.isRequired,
        onChange: PropTypes.func.isRequired,
    };

    static defaultProps = {
        max: 20,
    };

    state = {
        selected: [],
        active: '',
    };

    highlight(offset) {
        var scroller = this.refs.list;
        var users = Array.from(scroller.querySelectorAll('li'));
        var index = users.findIndex(e => e.classList.contains(classes.active));

        if (index > -1) {
            users[index].classList.remove(classes.active);
        }

        index += offset;

        if (index < 0) {
            // Fallback to the last element
            index = users.length - 1;
        } else if (index > users.length - 1) {
            // Fallback to the 1th element
            index = 0;
        }

        var active = users[index];

        // Keep active item always in the viewport
        active.classList.add(classes.active);
        scroller.scrollTop = active.offsetTop + active.offsetHeight - scroller.offsetHeight;
    }

    navigation(e) {
        var keyCode = e.keyCode;
        var offset = {
            // Up
            '38': -1,
            '40': 1,
        }[keyCode];

        if (offset) {
            this.highlight(offset);
        }

        if (keyCode !== 13) {
            return;
        }

        var active = this.refs.list.querySelector(`.${classes.active}`);

        if (active) {
            let userid = active.dataset.userid;

            if (!this.state.selected.includes(userid)) {
                // Add
                this.addSelected(userid, userid);
            } else {
                // Remove
                this.removeSelected(userid, userid);
            }
            setTimeout(() => this.props.onChange(this.state.selected));
        }
    }

    timer;

    search(text) {
        clearTimeout(this.timer);

        this.timer = setTimeout(() => {
            this.props.search(text);
        }, 300);
    }

    addSelected(userid, active = this.state.active) {
        var selected = [
            userid,
            ...this.state.selected,
        ];
        var max = this.props.max;

        if (max > 0) {
            selected = selected.slice(0, this.props.max);
        }

        this.setState({
            active,
            selected,
        });
        setTimeout(() => this.props.onChange(this.state.selected));
    }

    removeSelected(userid, active = this.state.active) {
        var selected = this.state.selected;
        var index = selected.indexOf(userid);

        this.setState({
            active,
            selected: [
                ...selected.slice(0, index),
                ...selected.slice(index + 1, selected.length)
            ]
        });
        setTimeout(() => this.props.onChange(this.state.selected));
    }

    toggleSelected(userid) {
        if (!this.state.selected.includes(userid)) {
            // Add
            this.addSelected(userid);
        } else {
            // Remove
            this.removeSelected(userid);
        }

        setTimeout(() => this.refs.input.focus());
    }

    renderList() {
        var { searching, getList } = this.props;
        var list = getList();

        if (searching && list.length === 0) {
            return (
                <li className={classes.notfound}>
                    <img src="assets/images/crash.png" />
                    <h3>Can't find any people matching '{searching}'</h3>
                </li>
            );
        }

        return list.map((e, index) => {
            return (
                <li
                    key={index}
                    data-userid={e.UserName}
                    className={clazz({
                        [classes.selected]: this.state.selected.includes(e.UserName),
                        [classes.active]: this.state.active === e.UserName,
                    })}
                    onClick={ev => this.toggleSelected(e.UserName)}>
                    <img src={e.HeadImgUrl} className={classes.avatar} />
                    <span className={classes.username} dangerouslySetInnerHTML={{__html: e.RemarkName || e.NickName}} />

                    <i className="icon-ion-android-done-all" />
                </li>
            );
        });
    }

    render() {
        return (
            <div className={classes.container}>
                <input
                    ref="input"
                    type="text"
                    placeholder="Type to Search..."
                    onKeyUp={e => this.navigation(e)}
                    onInput={e => this.search(e.target.value)}
                    autoFocus={true} />

                <ul className={classes.list} ref="list">
                    {this.renderList()}
                </ul>
            </div>
        );
    }
}
