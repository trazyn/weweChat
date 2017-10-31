
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import classes from './style.css';

@inject(stores => ({
    avatar: stores.session.avatar,
    code: stores.session.code,
    getCode: stores.session.getCode,
}))
@observer
export default class Login extends Component {
    componentDidMount() {
        this.props.getCode();
    }

    renderUser() {
        return (
            <div className={classes.inner}>
                {
                    <img
                        className="disabledDrag"
                        src={this.props.avatar} />
                }

                <p>Scan successful</p>
                <p>Confirm login on mobile WeChat</p>
            </div>
        );
    }

    renderCode() {
        var { code } = this.props;

        return (
            <div className={classes.inner}>
                {
                    code && (<img className="disabledDrag" src={`https://login.weixin.qq.com/qrcode/${code}`} />)
                }

                <a href={window.location.pathname + '?' + +new Date()}>Refresh the QR Code</a>

                <p>Scan to log in to WeChat</p>
                <p>Log in on phone to use WeChat on Web</p>
            </div>
        );
    }

    render() {
        return (
            <div className={classes.container}>
                {
                    this.props.avatar ? this.renderUser() : this.renderCode()
                }
            </div>
        );
    }
}
