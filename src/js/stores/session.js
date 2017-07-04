
/* eslint-disable no-eval */
import axios from 'axios';
import { observable, action } from 'mobx';

import storage from 'utils/storage';

class Session {
    @observable auth;
    @observable code;
    @observable avatar;

    @action async getCode() {
        var response = await axios.get('https://login.wx.qq.com/jslogin?appid=wx782c26e4c19acffb&redirect_uri=https%3A%2F%2Fwx.qq.com%2Fcgi-bin%2Fmmwebwx-bin%2Fwebwxnewloginpage&fun=new&lang=en_US&_=1499075647264');
        var code = response.data.match(/[A-Za-z_\-\d]{10}==/)[0];

        self.code = code;
        self.check();
        return code;
    }

    @action async check() {
        var response = await axios.get('https://login.web.wechat.com/cgi-bin/mmwebwx-bin/login', {
            params: {
                loginicon: true,
                uuid: self.code,
                tip: 0,
                r: +new Date(),
            }
        });

        eval(response.data);

        switch (window.code) {
            case 200:
                let authAddress = window.redirect_uri;

                // Set your weChat network route, otherwise you will got a code '1102'
                axios.defaults.baseURL = authAddress.match(/^https:\/\/(.*?)\//)[0];

                delete window.redirect_uri;
                delete window.code;
                delete window.userAvatar;

                // Login success, create session
                let response = await axios.get(authAddress, {
                    params: {
                        fun: 'new',
                        version: 'v2',
                    }
                });
                let auth = {
                    baseURL: axios.defaults.baseURL,
                    skey: response.data.match(/<skey>(.*?)<\/skey>/)[1],
                    passTicket: response.data.match(/<pass_ticket>(.*?)<\/pass_ticket>/)[1],
                    wxsid: response.data.match(/<wxsid>(.*?)<\/wxsid>/)[1],
                    wxuin: response.data.match(/<wxuin>(.*?)<\/wxuin>/)[1],
                };

                self.auth = auth;
                await storage.set('auth', auth);
                break;

            case 201:
                // Confirm to login
                self.avatar = window.userAvatar;
                self.check();
                break;

            default:
                // Continue call server and waite
                self.check();
        }
    }

    @action async initUser() {
        var response = await axios.post(`/cgi-bin/mmwebwx-bin/webwxinit?r=${-new Date()}&pass_ticket=${self.auth.passTicket}`, {
            BaseRequest: {
                Sid: self.auth.wxsid,
                Uin: self.auth.wxuin,
                Skey: self.auth.skey,
            }
        });

        return (self.user = response.data);
    }

    @action async hasLogin() {
        var auth = await storage.get('auth');

        axios.defaults.baseURL = auth.baseURL;
        return (self.auth = !auth);
    }
}

const self = new Session();
export default self;
