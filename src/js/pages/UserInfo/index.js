
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import pinyin from 'han';
import clazz from 'classname';

import classes from './style.css';
import Avatar from 'components/Avatar';
import { Modal, ModalBody } from 'components/Modal';

@inject(stores => ({
    chatTo: (userid) => {
        var user = stores.contacts.memberList.find(e => e.UserName === userid);
        stores.home.chatTo(user);
    },
    pallet: stores.userinfo.pallet,
    show: stores.userinfo.show,
    user: stores.userinfo.user,
    toggle: stores.userinfo.toggle,
    setRemarkName: stores.userinfo.setRemarkName,
    refreshContacts: async(user) => {
        var { updateUser, filter, filtered } = stores.contacts;

        stores.userinfo.updateUser(user);
        updateUser(user);
        filter(filtered.query);
    },

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

    handleAction(userid) {
        if (this.props.user.isFriend) {
            this.props.toggle(false);
            this.props.chatTo(userid);
        } else {

        }
    }

    render() {
        var { HeadImgUrl, UserName, NickName, RemarkName, Signature, City, Province, isFriend } = this.props.user;
        var pallet = this.props.pallet;
        var isme = this.props.isme();
        var background = pallet[0];
        var gradient = 'none';
        var fontColor = '#777';
        var buttonColor = '#777';

        if (background) {
            gradient = `
                -webkit-linear-gradient(top, rgb(${background[0]}, ${background[1]}, ${background[2]}) 5%, rgba(${background[0]}, ${background[1]}, ${background[2]}, 0) 15%),
                -webkit-linear-gradient(bottom, rgb(${background[0]}, ${background[1]}, ${background[2]}) 5%, rgba(${background[0]}, ${background[1]}, ${background[2]}, 0) 15%),
                -webkit-linear-gradient(left, rgb(${background[0]}, ${background[1]}, ${background[2]}) 5%, rgba(${background[0]}, ${background[1]}, ${background[2]}, 0) 15%),
                -webkit-linear-gradient(right, rgb(${background[0]}, ${background[1]}, ${background[2]}) 5%, rgba(${background[0]}, ${background[1]}, ${background[2]}, 0) 15%)
            `;
            background = `rgba(${background[0]}, ${background[1]}, ${background[2]}, 1)`;
            fontColor = `rgb(
                ${pallet[1][0]},
                ${pallet[1][1]},
                ${pallet[1][2]}
            )`;
            buttonColor = `rgb(
                ${pallet[2][0]},
                ${pallet[2][1]},
                ${pallet[2][2]}
            )`;
        } else {
            background = '#fff';
        }

        return (
            <Modal show={this.props.show} onCancel={() => this.handleClose()}>
                <ModalBody className={classes.container}>
                    <div
                        className={clazz(classes.hero, this.state.showEdit && classes.showEdit)}
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

                        <p dangerouslySetInnerHTML={{__html: Signature || 'No Signature'}} />

                        <div className={classes.address}>
                            <i className="icon-ion-android-map" style={{ color: fontColor }} />

                            {City || 'UNKNOW'}, {Province || 'UNKNOW'}
                        </div>

                        <div
                            className={classes.action}
                            style={{
                                color: buttonColor,
                                opacity: .6,
                            }}
                            onClick={() => this.handleAction(UserName)}>
                            {isFriend ? 'Send Message' : 'Add Friend'}
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
