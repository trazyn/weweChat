
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import classes from './style.css';
import helper from 'utils/helper';

@inject(stores => ({
    show: stores.members.show,
    close: () => stores.members.toggle(false),
    user: stores.members.user,
    list: stores.members.list,
    search: stores.members.search,
    searching: stores.members.query,
    filtered: stores.members.filtered,
    showUserinfo: async(user) => {
        var me = stores.session.user.User;
        var caniremove = helper.isChatRoomOwner(stores.members.user);

        if (user.UserName === me.UserName) {
            user = me;
        } else {
            stores.contacts.memberList.find(e => {
                // Try to find contact in contacts
                if (e.UserName === user.UserName) {
                    return (user = e);
                }
            });
        }

        stores.userinfo.toggle(true, user, caniremove);
    },
    addMember: () => {
        stores.members.toggle(false);
        stores.addmember.toggle(true);
    }
}))
@observer
export default class Members extends Component {
    render() {
        var { user, searching, list, filtered } = this.props;

        if (!this.props.show) {
            return false;
        }

        return (
            <div className={classes.container}>
                <header>
                    <span dangerouslySetInnerHTML={{ __html: `分组 '${user.NickName}' 包含 ${list.length} 个成员。` }} />

                    <span>
                        <i
                            className="icon-ion-android-add"
                            onClick={e => this.props.addMember()}
                            style={{
                                marginRight: 20,
                            }} />

                        <i
                            className="icon-ion-android-close"
                            onClick={e => this.props.close()} />
                    </span>
                </header>

                <ul className={classes.list}>
                    {
                        (searching && filtered.length === 0) && (
                            <div className={classes.notfound}>
                                <img src="assets/images/crash.png" />
                                <h1>未找到匹配 '{searching}' 的联系人</h1>
                            </div>
                        )
                    }

                    {
                        (searching ? filtered : list).map((e, index) => {
                            var pallet = e.pallet || [];
                            var frontColor = pallet[1] || [0, 0, 0];

                            return (
                                <li
                                    key={index}
                                    onClick={ev => this.props.showUserinfo(e)}
                                    style={{
                                        color: `rgb(
                                            ${frontColor[0]},
                                            ${frontColor[1]},
                                            ${frontColor[2]}
                                        )`,
                                    }}>
                                    <div
                                        className={classes.cover}
                                        style={{
                                            backgroundImage: `url(${e.HeadImgUrl})`,
                                        }} />
                                    <span
                                        className={classes.username}
                                        dangerouslySetInnerHTML={{ __html: e.NickName }} />
                                </li>
                            );
                        })
                    }
                </ul>

                <div className={classes.footer}>
                    <input
                        autoFocus={true}
                        id="messageInput"
                        maxLength={30}
                        onInput={e => this.props.search(e.target.value)}
                        placeholder="输入搜索内容..."
                        ref="input"
                        type="text" />
                </div>
            </div>
        );
    }
}
