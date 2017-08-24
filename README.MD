# weweChat

[![Build Status](https://travis-ci.org/trazyn/weweChat.svg?branch=master)](https://travis-ci.org/trazyn/weweChat)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg)](https://github.com/trazyn/weweChat/pulls)

Unofficial WeChat client built with React, MobX and Electron.

API from [https://web.wechat.com/](https://web.wechat.com/)

## Feature
- Work on desktop
- On macOS, window vibrancy effect
- Desktop notifications

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
```
$ npm run package
```
After that, you will see the binary in `./release` folder

### TODO
- [ ] Windows support
- [ ] Linux support
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
- [ ] Show QQ emoji
- [x] Search chat set
- [x] Search and create chat room
- [x] Desktop notification
- [x] Keep online
- [x] Logout
- [ ] Theme
- [ ] Send image from clipboard
- [ ] ~~加入 Siri，像 Siri 学习撩妹~~

### License
MIT License

