# weweChat

<img src="https://github.com/trazyn/weweChat/blob/master/resource/128x128.png" />

> Icon by [octiviotti](https://octiviotti.deviantart.com/)

[![Build Status](https://travis-ci.org/trazyn/weweChat.svg?branch=master)](https://travis-ci.org/trazyn/weweChat)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg)](https://github.com/trazyn/weweChat/pulls)

Unofficial WeChat client built with React, MobX and Electron.

API from [https://web.wechat.com/](https://web.wechat.com/)

## [CHANGELOG](https://github.com/trazyn/weweChat/blob/master/CHANGELOG.MD)

## Feature
- Work on desktop
- On macOS, window vibrancy effect
- Block message recall(Default settings is not block)
- Desktop notifications
- Keyboard shortcuts supported
- Send image by paste
  ![preview](https://raw.githubusercontent.com/trazyn/weweChat/master/screenshots/pasteconfirmation.png)
- Drag to send file
  ![preview](https://raw.githubusercontent.com/trazyn/weweChat/master/screenshots/dragdrop.png)
- Batch send message
  ![preview](https://raw.githubusercontent.com/trazyn/weweChat/master/screenshots/batchsend.png)
- Send GIF emoji
  ![preview](https://raw.githubusercontent.com/trazyn/weweChat/master/screenshots/sendgif.gif)

## Install
Download the last version on the [website](https://github.com/trazyn/weweChat/releases/latest) or below.

#### Mac(10.9+)
[Download](https://github.com/trazyn/weweChat/releases/download/1.0.0/wewechat-1.0.0-mac.dmg) the `.dmg` file.
Or use [Homebrew-Cask](https://caskroom.github.io/):
```
$ brew cask install wewechat
```

#### Linux
[Download](https://github.com/trazyn/weweChat/releases/download/)
Centos/RHEL please download `.rpm` packages.
Debian/Ubuntu please download `.deb` pacages.
Other linux distribution please download `.AppImage` packages.

Install deb package for Debian / Ubuntu:
```
$ sudo dpkg -i wewechat-1.0.0-amd64.deb
```

Install rpm package for Centos/RHEL:
```
$ sudo yum localinstall wewechat-1.0.0-x86_64.rpm
```

Install AppImage package for other linux distribution:
```
$ chmod u+x wewechat-1.0.0-x86_64.AppImage
$ ./wewechat-1.0.0-x86_64.AppImage
```

#### Windows
[Download](https://github.com/trazyn/weweChat/releases/download/1.0.0/wewechat-1.0.0-win-setup.exe) the `.exe` file.

## Screenshot
![preview](https://raw.githubusercontent.com/trazyn/weweChat/master/screenshots/0.png)
![preview](https://raw.githubusercontent.com/trazyn/weweChat/master/screenshots/1.png)
![preview](https://raw.githubusercontent.com/trazyn/weweChat/master/screenshots/2.png)
![preview](https://raw.githubusercontent.com/trazyn/weweChat/master/screenshots/3.png)
![preview](https://raw.githubusercontent.com/trazyn/weweChat/master/screenshots/4.png)

## Development
```
$ npm install
$ npm run dev
```

Generate the binary:
* For Linux
```
$ npm run package-linux
```
Maybe you will install some depends packages.
* For Mac
```
$ npm run package-mac
```
After that, you will see the binary in `./release` folder

## Keyboard shortcuts

Description            | Keys
-----------------------| -----------------------
New conversation       | <kbd>Cmd</kbd> <kbd>N</kbd>
Search conversations   | <kbd>Cmd</kbd> <kbd>F</kbd>
Hide conversation      | <kbd>Shift</kbd> <kbd>Cmd</kbd> <kbd>M</kbd>
Jump to conversation   | <kbd>Cmd</kbd> <kbd>0</kbd> ... <kbd>9</kbd>
Next conversation      | <kbd>Cmd</kbd> <kbd>J</kbd>
Previous conversation  | <kbd>Cmd</kbd> <kbd>K</kbd>
Batch message          | <kbd>Cmd</kbd> <kbd>B</kbd>
Toggle Full Screen     | <kbd>Shift</kbd> <kbd>Cmd</kbd> <kbd>F</kbd>
Insert QQ emoji        | <kbd>Cmd</kbd> <kbd>I</kbd>
Preferences            | <kbd>Cmd</kbd> <kbd>,</kbd>

### TODO
- [x] Windows support
- [x] Linux support
- [x] Sticky on top
- [x] Delete chat session
- [x] Mark as Read
- [x] Chat Room
  - [x] Show correct contact
  - [x] Show members
  - [x] Add / Remove member
  - [x] Create chat room
- [x] Receive message
  - [x] Text
  - [x] Image
  - [x] Voice
  - [x] Location
  - [x] Sticker
  - [x] Contact Card
  - [x] Video
  - [x] Money Transger
  - [x] Location sharing
  - [x] Download File
- [x] Send message
  - [x] Text
  - [x] File
  - [x] Image
  - [x] Video
  - [x] Recall
- [x] Forward text message
- [x] Forward emoji
- [x] Forward image
- [x] Forward file
- [x] Forward video
- [x] Show QQ emoji
- [x] Search chat set
- [x] Search and create chat room
- [x] Desktop notification
- [x] Keep online
- [x] Logout
- [x] Autosart at login
- [ ] Theme
- [x] Send image from clipboard
- [x] Drag to send file
- [x] Batch send message
- [ ] Mention a user
- [ ] Chat bot

### FAQ
- `Mac` 上如何修改图标，请参考 #39（另外问下，有没屌大的或者胸大的帮忙设计一个图标啊）
- 关于历史记录的问题请参考 #30


### License
MIT License

