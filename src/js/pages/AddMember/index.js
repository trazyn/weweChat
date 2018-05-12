
import React, { Component } from 'react';
import { Modal, ModalBody } from 'components/Modal';
import { inject, observer } from 'mobx-react';

import classes from './style.css';
import UserList from 'components/UserList';
import helper from 'utils/helper';

@inject(stores => ({
    show: stores.addmember.show,
    searching: stores.addmember.query,
    getList: () => {
        var { addmember, contacts } = stores;

        if (addmember.query) {
            return addmember.list;
        }

        return contacts.memberList.filter(
            e => !helper.isChatRoom(e.UserName)
                && !helper.isFileHelper(e)
                && e.UserName !== stores.session.user.User.UserName
        );
    },
    addMember: async(userids) => {
        var roomid = stores.chat.user.UserName;

        return stores.addmember.addMember(roomid, userids);
    },
    getUser: (userid) => {
        return stores.contacts.memberList.find(e => e.UserName === userid);
    },
    search: stores.addmember.search,
    close: () => {
        stores.addmember.reset();
        stores.addmember.toggle(false);
    },
}))
@observer
export default class AddMember extends Component {
    state = {
        selected: [],
    };

    close() {
        this.props.close();
        this.setState({
            selected: [],
        });
    }

    async add(userids) {
        await this.props.addMember(userids);
        this.close();
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
                max: -1,

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
            <Modal
                fullscreen={true}
                onCancel={e => this.close()}
                show={this.props.show}>
                <ModalBody className={classes.container}>
                    添加组员

                    <div className={classes.avatars}>
                        {
                            this.state.selected.map((e, index) => {
                                var user = this.props.getUser(e);
                                return (
                                    <img
                                        key={index}
                                        onClick={ev => this.refs.users.removeSelected(e)}
                                        src={user.HeadImgUrl} />
                                );
                            })
                        }
                    </div>

                    {this.renderList()}

                    <div>
                        <button
                            disabled={!this.state.selected.length}
                            onClick={e => this.add(this.state.selected)}>
                            添加
                        </button>

                        <button onClick={e => this.close()}>取消</button>
                    </div>
                </ModalBody>
            </Modal>
        );
    }
}
