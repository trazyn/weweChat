
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import clazz from 'classname';

import classes from './style.css';
import MessageInput from 'components/MessageInput';

@inject(stores => ({
    show: stores.batchsend.show,
    close: () => stores.batchsend.toggle(false),
    search: stores.batchsend.search,
    searching: stores.batchsend.query,
    contacts: stores.contacts.memberList,
    filtered: stores.batchsend.filtered,
    sendMessage: stores.chat.sendMessage,
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
@observer
export default class BatchSend extends Component {
    state = {
        selected: [],
    };

    close() {
        this.setState({
            selected: [],
        });
        this.props.close();
    }

    componentDidMount() {
        this.setState({
            selected: [],
        });
        this.props.search();
    }

    handleSelected(user) {
        var selected = this.state.selected;
        var index = selected.findIndex(e => e.UserName === user.UserName);

        if (index === -1) {
            selected.push(user);
        } else {
            selected = [
                ...selected.slice(0, index),
                ...selected.slice(index + 1, selected.length),
            ];
        }

        this.setState({
            selected,
        });
    }

    selectAll() {
        var contacts = this.props.contacts;
        var selected = this.state.selected;
        var isall = contacts.length === selected.length;

        if (isall) {
            // Unselected all user
            selected = [];
        } else {
            selected = contacts.map(e => Object.assign({}, e));
        }

        this.setState({
            selected,
        });
    }

    search(text = '') {
        text = text.trim();

        clearTimeout(this.search.timer);
        this.search.timer = setTimeout(() => {
            this.props.search(text);
        }, 300);
    }

    render() {
        var { contacts, searching, filtered, showMessage, sendMessage, me = {}, confirmSendImage, process } = this.props;

        if (!this.props.show) {
            return false;
        }

        return (
            <div className={classes.container}>
                <header>
                    <input
                        autoFocus={true}
                        onInput={e => this.search(e.target.value)}
                        placeholder="群发发送消息，请选择联系人..."
                        type="text" />

                    <span>
                        <i
                            className={clazz('icon-ion-android-done-all', {
                                [classes.active]: this.state.selected.length === contacts.length
                            })}
                            onClick={() => this.selectAll()}
                            style={{
                                marginRight: 20,
                            }} />
                        <i
                            className="icon-ion-android-close"
                            onClick={e => this.close()} />
                    </span>
                </header>

                <ul className={classes.list}>
                    {
                        (searching && filtered.length === 0) && (
                            <div className={classes.notfound}>
                                <img src="assets/images/crash.png" />
                                <h1>未找到匹配 '{searching}' 的联系人。</h1>
                            </div>
                        )
                    }

                    {
                        (searching ? filtered : contacts).map((e, index) => {
                            return (
                                <li
                                    key={index}
                                    onClick={() => this.handleSelected(e)}>
                                    <div
                                        className={classes.cover}
                                        style={{
                                            backgroundImage: `url(${e.HeadImgUrl})`,
                                        }} />
                                    <span
                                        className={classes.username}
                                        dangerouslySetInnerHTML={{ __html: e.RemarkName || e.NickName }} />

                                    {
                                        this.state.selected.find(user => user.UserName === e.UserName) && (
                                            <i className="icon-ion-android-done" />
                                        )
                                    }
                                </li>
                            );
                        })
                    }
                </ul>

                <div className={classes.footer}>
                    <MessageInput {...{
                        className: classes.input,
                        me: me.User,
                        sendMessage,
                        showMessage,
                        user: this.state.selected,
                        confirmSendImage,
                        process,
                    }} />
                </div>
            </div>
        );
    }
}
