
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import classes from './style.css';

@inject(stores => ({
    show: stores.members.show,
    close: () => stores.members.toggle(false),
    user: stores.members.user,
    list: stores.members.list,
}))
@observer
export default class Members extends Component {
    render() {
        var { user, list } = this.props;

        if (!this.props.show) {
            return false;
        }

        return (
            <div className={classes.container}>
                <header>
                    <span>
                        Group '{user.NickName}' has {list.length} members
                    </span>

                    <i className="icon-ion-android-close" onClick={e => this.props.close()} />
                </header>

                <ul className={classes.list}>
                    {
                        list.map((e, index) => {
                            var pallet = e.pallet || [];
                            var frontColor = pallet[1] || [0, 0, 0];

                            return (
                                <li key={index} style={{
                                    color: `rgb(
                                        ${frontColor[0]},
                                        ${frontColor[1]},
                                        ${frontColor[2]}
                                    )`,
                                }}>
                                    <div className={classes.cover} style={{
                                        backgroundImage: `url(${e.HeadImgUrl})`,
                                    }} />
                                    <span className={classes.username} dangerouslySetInnerHTML={{ __html: e.NickName }} />
                                </li>
                            );
                        })
                    }
                </ul>
            </div>
        );
    }
}
