
import React, { Component } from 'react';
import { Modal, ModalBody } from 'components/Modal';
import { inject, observer } from 'mobx-react';

import classes from './style.css';

@inject(stores => ({
    me: stores.session.user,
    show: stores.addfriend.show,
    close: () => stores.addfriend.toggle(false),
    sendRequest: stores.addfriend.sendRequest,
}))
@observer
export default class AddFriend extends Component {
    addFriend() {
        this.props.sendRequest(this.refs.input.value);
        this.props.close();
    }

    render() {
        var { me, show, close } = this.props;

        return (
            <Modal
                fullscreen={true}
                onCancel={e => close()}
                show={show}>
                <ModalBody className={classes.container}>
                    Send friend request first

                    <input
                        autoFocus={true}
                        defaultValue={`Hallo, im ${me && me.User.NickName}`}
                        ref="input"
                        type="text" />

                    <div>
                        <button onClick={e => this.addFriend()}>Send</button>

                        <button onClick={e => close()}>Cancel</button>
                    </div>
                </ModalBody>
            </Modal>
        );
    }
}
