
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
                    添加好友
                    <input
                        autoFocus={true}
                        defaultValue={`你好, 我是 ${me && me.User.NickName}`}
                        ref="input"
                        type="text" />

                    <div>
                        <button onClick={e => this.addFriend()}>发送</button>
                        <button onClick={e => close()}>取消</button>
                    </div>
                </ModalBody>
            </Modal>
        );
    }
}
