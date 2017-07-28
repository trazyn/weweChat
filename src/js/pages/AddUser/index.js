
import React, { Component } from 'react';
import { Modal, ModalBody } from 'components/Modal';
import { inject, observer } from 'mobx-react';

import classes from './style.css';

@inject(stores => ({
    me: stores.session.user,
    show: stores.adduser.show,
    close: () => stores.adduser.toggle(false),
    sendRequest: stores.adduser.sendRequest,
}))
@observer
export default class AddUser extends Component {
    sendRequest() {
        this.props.sendRequest(this.refs.input.value);
        this.props.close();
    }

    render() {
        var { me, show, close } = this.props;

        return (
            <Modal show={show} fullscreen={true}>
                <ModalBody className={classes.container}>
                    Send friend request first

                    <input type="text" defaultValue={`Hallo, im ${me && me.User.NickName}`} autoFocus={true} ref="input" />

                    <div>
                        <button onClick={e => this.sendRequest()}>Send</button>

                        <button onClick={e => close()}>Cancel</button>
                    </div>
                </ModalBody>
            </Modal>
        );
    }
}
