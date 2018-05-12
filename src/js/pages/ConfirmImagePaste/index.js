
import React, { Component } from 'react';
import { Modal, ModalBody } from 'components/Modal';
import { inject, observer } from 'mobx-react';

import classes from './style.css';

@inject(stores => {
    var confirmImagePaste = stores.confirmImagePaste;

    return {
        show: confirmImagePaste.show,
        image: confirmImagePaste.image,

        ok: () => {
            confirmImagePaste.ok();
            confirmImagePaste.toggle(false);
        },
        cancel: () => {
            confirmImagePaste.cancel();
            confirmImagePaste.toggle(false);
        }
    };
})
@observer
export default class ConfirmImagePaste extends Component {
    render() {
        var { show, cancel, ok, image } = this.props;

        return (
            <Modal
                fullscreen={true}
                show={show}>
                <ModalBody className={classes.container}>
                    Send image ?

                    <img src={image} />

                    <div>
                        <button onClick={e => ok()}>发送</button>

                        <button onClick={e => cancel()}>取消</button>
                    </div>
                </ModalBody>
            </Modal>
        );
    }
}
