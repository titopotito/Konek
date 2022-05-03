const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatSchema = new Schema({
    users: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    chatMessages: [
        {
            type: Schema.Types.ObjectId,
            ref: "ChatMessage",
        },
    ],
});

chatSchema.static("getChatList", async function (user) {
    const chatList = await Chat.find(
        {
            users: { $in: [user._id] },
        },
        {
            chatMessages: { $slice: -1 },
        }
    )
        .populate("users")
        .populate("chatMessages");

    const newChatList = chatList.map((chat) => {
        return {
            chatMates: extractChatMatesFromChat(chat, user),
            lastChatMessage: chat.chatMessages[0].textContent,
            timeStamp: chat.chatMessages[0].timeStamp,
        };
    });

    return newChatList;
});

const extractChatMatesFromChat = (chat, user) => {
    return chat.users.filter((item) => item.username !== user.username);
};

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
