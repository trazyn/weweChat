
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';

import classes from './style.css';

@inject(stores => ({
    history: stores.search.history,
    searching: stores.search.searching,
    toggle: stores.search.toggle,
    filter: stores.search.filter,
    result: stores.search.result,
    getPlaceholder: () => {
        stores.contacts.filter();
        return stores.contacts.filtered.result;
    },
    chat: async(user) => {
        stores.chat.chatTo(user);
        stores.search.reset();
        await stores.search.addHistory(user);
    },
    clear: (e) => {
        e.preventDefault();
        e.stopPropagation();

        stores.search.clearHistory();
        stores.search.reset();
    }
}))
@observer
export default class SearchBar extends Component {
    timer;

    filter(text = '') {
        text = text.trim();

        clearTimeout(this.filter.timer);
        this.filter.timer = setTimeout(() => {
            this.props.filter(text);
        }, 300);
    }

    handleBlur(value) {
        setTimeout(() => {
            if (!value) {
                this.props.toggle(false);
            }
        }, 500);
    }

    chatTo(user) {
        this.props.chat(user);
        this.refs.search.value = '';
        document.querySelector('#messageInput').focus();
    }

    highlight(offset) {
        var scroller = this.refs.dropdown;
        var users = Array.from(scroller.querySelectorAll(`.${classes.user}`));
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

        if (active) {
            // Keep active item always in the viewport
            active.classList.add(classes.active);
            scroller.scrollTop = active.offsetTop + active.offsetHeight - scroller.offsetHeight;
        }
    }

    navigation(e) {
        var { result, history, getPlaceholder } = this.props;

        // User press ESC
        if (e.keyCode === 27) {
            e.target.blur();
        }

        if (![
            38, // Up
            40, // Down
            13, // Enter
        ].includes(e.keyCode)) {
            return;
        }

        switch (e.keyCode) {
            case 38:
                // Up
                this.highlight(-1);
                break;

            case 40:
                // Down
                this.highlight(1);
                break;

            case 13:
                let active = this.refs.dropdown.querySelector(`.${classes.user}.${classes.active}`);

                if (!active) {
                    break;
                }
                this.chatTo([...result.friend, ...result.groups, ...history, ...getPlaceholder()].find(e => e.UserName === active.dataset.userid));
        }
    }

    renderUser(user) {
        return (
            <div className={classes.user} onClick={e => this.chatTo(user)} data-userid={user.UserName}>
                <img src={user.HeadImgUrl} />

                <div className={classes.info}>
                    <p className={classes.username} dangerouslySetInnerHTML={{__html: user.RemarkName || user.NickName}} />

                    <span className={classes.signature} dangerouslySetInnerHTML={{__html: user.Signature || 'No Signature'}} />
                </div>
            </div>
        );
    }

    renderList(list, title) {
        if (!list.length) return false;

        return (
            <div>
                <header>
                    <h3>{title}</h3>
                </header>
                {
                    list.map((e, index) => {
                        return (
                            <div key={index}>
                                {this.renderUser(e)}
                            </div>
                        );
                    })
                }
            </div>
        );
    }

    renderHistory(list) {
        return (
            <div>
                <header>
                    <h3>History</h3>

                    <a href="" onClick={e => this.props.clear(e)}>CLEAR</a>
                </header>
                {
                    list.map((e, index) => {
                        return (
                            <div key={index}>
                                {this.renderUser(e)}
                            </div>
                        );
                    })
                }
            </div>
        );
    }

    renderPlaceholder() {
        var list = this.props.getPlaceholder();

        return list.map((e, index) => {
            return (
                <div key={index}>
                    {this.renderList(e.list, e.prefix)}
                </div>
            );
        });
    }

    render() {
        var { searching, history, result } = this.props;

        return (
            <div className={classes.container}>
                <i className="icon-ion-ios-search-strong" />
                <input
                    id="search"
                    ref="search"
                    type="text"
                    placeholder="Search ..."
                    onKeyUp={e => this.navigation(e)}
                    onFocus={e => this.filter(e.target.value)}
                    onBlur={e => this.handleBlur(e.target.value)}
                    onInput={e => this.filter(e.target.value)} />

                {
                    searching && (
                        <div className={classes.dropdown} ref="dropdown">
                            {
                                !result.query && (history.length ? this.renderHistory(history) : this.renderPlaceholder())
                            }

                            {this.renderList(result.friend, 'Friend')}
                            {this.renderList(result.groups, 'Group')}
                        </div>
                    )
                }
            </div>
        );
    }
}
