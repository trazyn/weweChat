
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import pinyin from 'han';
import clazz from 'classname';

import classes from './style.css';
import Avatar from 'components/Avatar';
import { Modal, ModalBody } from 'components/Modal';
import helper from 'utils/helper';

@inject(stores => ({
    chatTo: (userid) => {
        var user = stores.contacts.memberList.find(e => e.UserName === userid);
        stores.chat.chatTo(user);
    },
    pallet: stores.userinfo.pallet,
    show: stores.userinfo.show,
    user: stores.userinfo.user,
    remove: stores.userinfo.remove,
    toggle: stores.userinfo.toggle,
    setRemarkName: stores.userinfo.setRemarkName,
    removeMember: async(user) => {
        var roomid = (stores.members.show && stores.members.user.UserName)
            || stores.chat.user.UserName;

        await stores.userinfo.removeMember(roomid, user.UserName);
        stores.userinfo.toggle(false);
    },
    refreshContacts: async(user) => {
        var { updateUser, filter, filtered } = stores.contacts;

        stores.userinfo.updateUser(user);
        updateUser(user);
        filter(filtered.query);
    },
    showAddFriend: (user) => stores.addfriend.toggle(true, user),
    isme: () => {
        return stores.session.user
            && stores.userinfo.user.UserName === stores.session.user.User.UserName;
    },
}))
@observer
export default class UserInfo extends Component {
    state = {
        showEdit: false,
    };

    toggleEdit(showEdit = !this.state.showEdit) {
        this.setState({ showEdit });
    }

    handleClose() {
        this.toggleEdit(false);
        this.props.toggle(false);
    }

    handleError(e) {
        e.target.src = 'http://i.pravatar.cc/200';
    }

    async handleEnter(e) {
        if (e.charCode !== 13) return;

        var value = e.target.value.trim();
        var result = await this.props.setRemarkName(value, this.props.user.UserName);

        if (result.BaseResponse.Ret === 0) {
            this.props.refreshContacts({
                ...this.props.user,
                RemarkName: value,
                RemarkPYInitial: value ? (pinyin.letter(value)[0]).toUpperCase() : value,
            });
            this.toggleEdit(false);
        }
    }

    handleAction(user) {
        if (this._reactInternalInstance._context.location.pathname !== '/') {
            this._reactInternalInstance._context.router.push('/');
        }

        setTimeout(() => {
            if (helper.isContact(user) || helper.isChatRoom(user.UserName)) {
                this.props.toggle(false);
                this.props.chatTo(user.UserName);
                document.querySelector('#messageInput').focus();
            } else {
                this.props.showAddFriend(user);
            }
        });
    }

    render() {
        var { UserName, HeadImgUrl, NickName, RemarkName, Signature, City, Province } = this.props.user;
        var isFriend = helper.isContact(this.props.user);
        var pallet = this.props.pallet;
        var isme = this.props.isme();
        var background = pallet[0];
        var gradient = 'none';
        var fontColor = '#777';
        var buttonColor = '#777';

        if (background) {
            let pallet4font = pallet[1] || [0, 0, 0];
            let pallet4button = pallet[2] || [0, 0, 0];

            gradient = `
                -webkit-linear-gradient(top, rgb(${background[0]}, ${background[1]}, ${background[2]}) 5%, rgba(${background[0]}, ${background[1]}, ${background[2]}, 0) 15%),
                -webkit-linear-gradient(bottom, rgb(${background[0]}, ${background[1]}, ${background[2]}) 5%, rgba(${background[0]}, ${background[1]}, ${background[2]}, 0) 15%),
                -webkit-linear-gradient(left, rgb(${background[0]}, ${background[1]}, ${background[2]}) 5%, rgba(${background[0]}, ${background[1]}, ${background[2]}, 0) 15%),
                -webkit-linear-gradient(right, rgb(${background[0]}, ${background[1]}, ${background[2]}) 5%, rgba(${background[0]}, ${background[1]}, ${background[2]}, 0) 15%)
            `;
            background = `rgba(${background[0]}, ${background[1]}, ${background[2]}, 1)`;
            fontColor = `rgb(
                ${pallet4font[0]},
                ${pallet4font[1]},
                ${pallet4font[2]},
            )`;
            buttonColor = `rgb(
                ${pallet4button[0]},
                ${pallet4button[1]},
                ${pallet4button[2]},
            )`;
        } else {
            background = '#fff';
        }

        return (
            <Modal show={this.props.show} onCancel={() => this.handleClose()}>
                <ModalBody className={classes.container}>
                    <div
                        className={clazz(classes.hero, {
                            [classes.showEdit]: this.state.showEdit,
                            [classes.large]: !this.props.remove,
                            [classes.isme]: isme,
                        })}
                        onClick={() => {
                            var showEdit = this.state.showEdit;

                            if (showEdit) {
                                this.toggleEdit();
                            }
                        }} style={{
                            background,
                            color: fontColor,
                        }}>

                        {
                            (!isme && isFriend) && (
                                <div className={classes.edit} onClick={() => this.toggleEdit()}>
                                    <i className="icon-ion-edit" />
                                </div>
                            )
                        }

                        <div className={classes.inner}>
                            <div className={classes.mask} style={{
                                background: gradient
                            }} />
                            <Avatar src={HeadImgUrl} />
                        </div>

                        <h3 dangerouslySetInnerHTML={{__html: NickName}} />

                        {
                            !this.props.remove ? (
                                <div>
                                    <p dangerouslySetInnerHTML={{__html: Signature || 'No Signature'}} />

                                    <div className={classes.address}>
                                        <i className="icon-ion-android-map" style={{ color: fontColor }} />

                                        {City || 'UNKNOW'}, {Province || 'UNKNOW'}
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className={classes.action}
                                    style={{
                                        color: buttonColor,
                                        opacity: .6,
                                        marginTop: 20,
                                        marginBottom: -30,
                                    }}
                                    onClick={() => this.props.removeMember(this.props.user)}>
                                    Delete
                                </div>
                            )
                        }

                        <div
                            className={classes.action}
                            style={{
                                color: buttonColor,
                                opacity: .6,
                            }}
                            onClick={() => this.handleAction(this.props.user)}>
                            {helper.isChatRoom(UserName) || isFriend ? 'Send Message' : 'Add Friend'}
                        </div>
                    </div>

                    {
                        /* eslint-disable */
                        this.state.showEdit && (
                            <input
                                type="text"
                                ref="input"
                                autoFocus={true}
                                placeholder="Type the remark name"
                                defaultValue={RemarkName}
                                onKeyPress={e => this.handleEnter(e)} />
                        )
                        /* eslint-enable */
                    }
                </ModalBody>
            </Modal>
        );
    }
}
