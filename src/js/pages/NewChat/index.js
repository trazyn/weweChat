
import React, { Component } from 'react';
import { Modal, ModalBody } from 'components/Modal';
import { inject, observer } from 'mobx-react';
import clazz from 'classname';

import classes from './style.css';

@inject(stores => ({
    show: stores.newchat.show,
    query: stores.newchat.query,
    getList: () => {
        var { newchat, contacts } = stores;

        if (newchat.query) {
            return newchat.list;
        }

        return contacts.memberList;
    },
    getUser: (userid) => {
        return stores.contacts.memberList.find(e => e.UserName === userid);
    },
    search: stores.newchat.search,
    createChatRoom: stores.newchat.createChatRoom,
    close: () => {
        stores.newchat.reset();
        stores.newchat.toggle(false);
    },
    chatTo: (user) => stores.chat.chatTo(user),
}))
@observer
export default class NewChat extends Component {
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
        var userid = active.dataset.userid;

        if (!this.state.selected.includes(userid)) {
            // Add
            this.addSelected(userid, userid);
        } else {
            // Remove
            this.removeSelected(userid, userid);
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

        // Max 20 users
        selected = selected.slice(0, 20);

        this.setState({
            active,
            selected,
        });
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

    async chat() {
        var selected = this.state.selected;

        if (selected.length === 1) {
            this.props.chatTo(this.props.getUser(selected[0]));
        } else {
            // Create a chat room
            let user = await this.props.createChatRoom(selected);
            this.props.chatTo(user);
        }

        this.close();
        setTimeout(() => {
            document.querySelector('#messageInput').focus();
        });
    }

    close() {
        this.props.close();
        this.setState({
            selected: [],
            active: '',
        });
    }

    renderList() {
        var { show, query, getList } = this.props;

        if (!show) {
            return false;
        }

        var list = getList();

        if (query && list.length === 0) {
            return (
                <li className={classes.empty}>
                    <img src="assets/images/crash.png" />
                    <h3>Can't find any people matching '{query}'</h3>
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
                    <span className={classes.userName} dangerouslySetInnerHTML={{__html: e.RemarkName || e.NickName}} />

                    <i className="icon-ion-android-done-all" />
                </li>
            );
        });
    }

    render() {
        return (
            <Modal show={this.props.show} fullscreen={true}>
                <ModalBody className={classes.container}>
                    New Chat ({this.state.selected.length} / 20)

                    <div className={classes.avatars}>
                        {
                            this.state.selected.map((e, index) => {
                                var user = this.props.getUser(e);
                                return <img src={user.HeadImgUrl} key={index} onClick={ev => this.removeSelected(e)} />;
                            })
                        }
                    </div>

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

                    <div>
                        <button onClick={e => this.chat()} disabled={!this.state.selected.length}>Chat</button>

                        <button onClick={e => this.close()}>Cancel</button>
                    </div>
                </ModalBody>
            </Modal>
        );
    }
}
