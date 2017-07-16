
export default message => {
    switch (message.MsgType) {
        case 1:
            if (message.location) return '[Location]';
            // Text message
            return message.Content;

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
