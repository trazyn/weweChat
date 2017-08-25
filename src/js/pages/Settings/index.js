
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';

import classes from './style.css';
import Switch from 'components/Switch';
import Avatar from 'components/Avatar';
import helper from 'utils/helper';

@inject(stores => ({
    alwaysOnTop: stores.settings.alwaysOnTop,
    setAlwaysOnTop: stores.settings.setAlwaysOnTop,
    showOnTray: stores.settings.showOnTray,
    setShowOnTray: stores.settings.setShowOnTray,
    showNotification: stores.settings.showNotification,
    setShowNotification: stores.settings.setShowNotification,
    startup: stores.settings.startup,
    setStartup: stores.settings.setStartup,
    downloads: stores.settings.downloads,
    setDownloads: stores.settings.setDownloads,
    user: stores.session.user,
    logout: stores.session.logout,

    plugins: stores.settings.plugins,
}))
@observer
export default class Settings extends Component {
    renderPlugins(plugins) {
        return plugins.map((e, index) => {
            return (
                <div key={index} className={classes.plugin}>
                    <img src={e.icon} />

                    <div className={classes.detail}>
                        <p>
                            <span>{e.name}</span>
                            <span className={classes.version}>{e.version}</span>
                        </p>
                        <p>
                            <a href={e.link} target="_bank">View on Github</a>
                        </p>
                        <div className={classes.description}>{e.description}</div>
                    </div>

                    <Switch defaultChecked={e.enabled} />
                </div>
            );
        });
    }

    choiceDownloadDir() {
        this.refs.downloads.click();
    }

    componentDidMount() {
        this.refs.downloads.webkitdirectory = true;
    }

    render() {
        var {
            alwaysOnTop,
            setAlwaysOnTop,
            showOnTray,
            setShowOnTray,
            showNotification,
            setShowNotification,
            startup,
            setStartup,
            downloads,
            setDownloads,
            plugins,
            user,
        } = this.props;

        return (
            <div className={classes.container}>
                <div className={classes.column}>
                    <h2>Settings</h2>

                    <ul>
                        {
                            user && (
                                <li className={classes.user}>
                                    <Avatar src={this.props.user.User.HeadImgUrl} />
                                    <button onClick={e => this.props.logout()}>Logout</button>
                                </li>
                            )
                        }
                        <li className={classes.downloads}>
                            <div>
                                <input type="file" ref="downloads" onChange={e => setDownloads(e.target.files[0])} />
                                <p>Downloads</p>
                                <p onClick={e => this.choiceDownloadDir()}>{downloads}</p>
                            </div>

                            <button onClick={e => this.choiceDownloadDir()}>Change</button>
                        </li>
                        <li>
                            <label htmlFor="alwaysOnTop">
                                <span>Always on Top</span>
                                <Switch id="alwaysOnTop" checked={alwaysOnTop} onChange={e => setAlwaysOnTop(e.target.checked)} />
                            </label>
                        </li>

                        <li>
                            <label htmlFor="showOnTray">
                                <span>Show on Tray</span>
                                <Switch id="showOnTray" checked={showOnTray} onChange={e => setShowOnTray(e.target.checked)} disabled={!helper.isOsx} />
                            </label>
                        </li>

                        <li>
                            <label htmlFor="showNotification">
                                <span>Send Desktop Notifications</span>
                                <Switch id="showNotification" checked={showNotification} onChange={e => setShowNotification(e.target.checked)} />
                            </label>
                        </li>

                        <li>
                            <label htmlFor="startup">
                                <span>Launch at startup</span>
                                <Switch id="startup" checked={startup} onChange={e => setStartup(e.target.checked)} />
                            </label>
                        </li>
                    </ul>
                </div>
                <div className={classes.column}>
                    <h2>Plugins</h2>

                    {
                        this.renderPlugins(plugins)
                    }
                </div>
            </div>
        );
    }
}
