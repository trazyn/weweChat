
import helper from './helper';

export default message => {
    var isChatRoom = helper.isChatRoom(message.FromUserName);
    var content = message.Content;

    if (isChatRoom) {
        content = message.Content.split(':<br/>')[1];
    }

    switch (message.MsgType) {
        case 1:
            if (message.location) return '[Location]';
            // Text message
            return content;

        case 3:
            // Image
            return '[Image]';

        case 34:
            // Image
            return '[Voice]';

        case 42:
            // Contact Card
            return '[Contact Card]';

        case 47:
            // Emoji
            return '[Emoji]';
    }
};
