const User = require("../models/user");
const Chat = require("../models/chat");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatMessageSchema = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    textContent: {
        type: String,
    },
    timeStamp: {
        type: Date,
    },
});

chatMessageSchema.static("saveChatMessage", async function (chatData) {
    const message = {
        sender: await User.findOne({ username: chatData.sender }),
        textContent: chatData.textContent,
        timeStamp: chatData.timeStamp,
    };
    const newMessage = new ChatMessage(message);
    const savedMessage = await newMessage.save();
    await Chat.findByIdAndUpdate(chatData.chatID, {
        $push: { messages: savedMessage },
        seenBy: [message.sender],
    });
});

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

module.exports = ChatMessage;
