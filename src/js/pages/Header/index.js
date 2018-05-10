import React, {Component} from 'react';
import classes from './style.css';

const ipcRenderer = require('electron').ipcRenderer;

export default class Header extends Component {
    getTitle() {
        switch (this.props.location.pathname) {
            case '/contacts':
                return '联系人 - 微信';

            case '/settings':
                return '设置 - 微信';

            default:
                return '微信';
        }
    }

    render() {
        return (
            <header className={classes.container}>
                <h1>{this.getTitle()}</h1>
                <section className={classes.btnSection}>
                    <button className={classes.btn + ' ' + classes.min} onClick={() => ipcRenderer.send('min')}>-</button>
                    <button className={classes.btn + ' ' + classes.max} onClick={() => ipcRenderer.send('unmax')}>∨</button>
                    <button className={classes.btn + ' ' + classes.max} onClick={() => ipcRenderer.send('max')}>∧</button>
                    <button className={classes.btn + ' ' + classes.danger} onClick={() => ipcRenderer.send('close')}>x</button>
                </section>
            </header>
        );
    }
}
