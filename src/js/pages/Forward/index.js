
import React, { Component } from 'react';
import { Modal, ModalBody } from 'components/Modal';
import { inject, observer } from 'mobx-react';

import classes from './style.css';
import UserList from 'components/UserList';

@inject(stores => ({
    show: stores.forward.show,
    searching: stores.forward.query,
    getList: () => {
        var { forward, contacts } = stores;

        if (forward.query) {
            return forward.list;
        }

        return contacts.memberList;
    },
    getUser: (userid) => {
        return stores.contacts.memberList.find(e => e.UserName === userid);
    },
    search: stores.forward.search,
    send: (userids) => stores.forward.send(userids),
    close: () => stores.forward.toggle(false),
}))
@observer
export default class Forward extends Component {
    state = {
        selected: [],
    };

    close() {
        this.props.close();
        this.setState({
            selected: [],
        });
    }

    send(userids) {
        userids.map(e => {
            this.props.send(e);
        });
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
            <Modal show={this.props.show} fullscreen={true} onCancel={e => this.close()}>
                <ModalBody className={classes.container}>
                    Forward Message

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
                        <button onClick={e => this.send(this.state.selected)} disabled={!this.state.selected.length}>Send Message</button>

                        <button onClick={e => this.close()}>Cancel</button>
                    </div>
                </ModalBody>
            </Modal>
        );
    }
}
