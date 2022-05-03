const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatRoomSchema = new Schema({
    users: [
        {
            type: Schema.Types.ObjectId,
            ref: "Users",
        },
    ],
    chatMessages: [
        {
            type: Schema.Types.ObjectId,
            ref: "ChatMessage",
        },
    ],
});

const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);

module.exports = ChatRoom;
