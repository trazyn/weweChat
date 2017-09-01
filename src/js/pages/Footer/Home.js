
import React, { Component } from 'react';
import { inject } from 'mobx-react';

import MessageInput from 'components/MessageInput';

@inject(stores => ({
    sendMessage: stores.chat.sendMessage,
    user: stores.chat.user,
    showMessage: stores.snackbar.showMessage,
    me: stores.session.user,
    confirmSendImage: async(image) => {
        if (!stores.settings.confirmImagePaste) {
            return true;
        }

        var confirmed = await stores.confirmImagePaste.toggle(true, image);
        return confirmed;
    },
    process: stores.chat.process,
}))
export default class Message extends Component {
    render() {
        var { sendMessage, showMessage, user, me = {}, confirmSendImage, process } = this.props;

        return (
            <MessageInput {...{
                sendMessage,
                showMessage,
                user: user ? [user] : [],
                me: me.User,
                confirmSendImage,
                process,
            }} />
        );
    }
}
