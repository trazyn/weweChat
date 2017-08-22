
import React, { Component } from 'react';
import { Modal, ModalBody } from 'components/Modal';
import { inject, observer } from 'mobx-react';

import classes from './style.css';
import UserList from 'components/UserList';
import helper from 'utils/helper';

@inject(stores => ({
    show: stores.newchat.show,
    searching: stores.newchat.query,
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
    };

    async chat() {
        var selected = this.state.selected;

        if (selected.length === 1) {
            this.props.chatTo(this.props.getUser(selected[0]));
        } else {
            // You can not create a chat room by another chat room
            let user = await this.props.createChatRoom(selected.filter(e => !helper.isChatRoom(e)));
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
        });
    }

    renderList() {
        var self = this;
        var { show, searching, search, getList } = this.props;

        if (!show) {
            return false;
        }

        return (
            <UserList {...{
                ref: 'users',

                search,
                getList,
                searching,

                onChange(selected) {
                    self.setState({
                        selected,
                    });
                }
            }} />
        );
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
                                return <img src={user.HeadImgUrl} key={index} onClick={ev => this.refs.users.removeSelected(e)} />;
                            })
                        }
                    </div>

                    {this.renderList()}

                    <div>
                        <button onClick={e => this.chat()} disabled={!this.state.selected.length}>Chat</button>

                        <button onClick={e => this.close()}>Cancel</button>
                    </div>
                </ModalBody>
            </Modal>
        );
    }
}
