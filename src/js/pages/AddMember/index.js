
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

        return contacts.memberList.filter(e => !helper.isChatRoom(e.UserName));
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
                searching: !!searching,
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
            <Modal show={this.props.show} fullscreen={true}>
                <ModalBody className={classes.container}>
                    Add Members

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
                        <button onClick={e => this.add()} disabled={!this.state.selected.length}>Add</button>

                        <button onClick={e => this.close()}>Cancel</button>
                    </div>
                </ModalBody>
            </Modal>
        );
    }
}
