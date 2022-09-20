const { getTimePassed } = require("../public/js/time-utils");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatSchema = new Schema({
    members: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    messages: [
        {
            type: Schema.Types.ObjectId,
            ref: "ChatMessage",
        },
    ],
    seenBy: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
});

const filterChat = function (chat, username) {
    return {
        _id: chat._id,
        members: extractChatMembers(chat),
        chatMates: extractChatMates(chat, username),
        messages: extractChatMessages(chat),
    };
};

const filterChatList = function (chatList, username) {
    return chatList.map((chat) => {
        return {
            _id: chat._id,
            chatMates: extractChatMates(chat, username),
            lastChatMessage: chat.messages[0].textContent,
            timePassed: getTimePassed(chat.messages[0].timeStamp),
            seenBy: chat.seenBy.map((user) => user.username),
        };
    });
};

const extractChatMembers = function (chat) {
    return chat.members.map((user) => user.username);
};

const extractChatMates = function (chat, username) {
    return extractChatMembers(chat).filter((member) => member !== username);
};

const extractChatMessages = function (chat) {
    return chat.messages.map((message) => {
        return {
            _id: message._id,
            sender: message.sender.username,
            textContent: message.textContent,
            timePassed: getTimePassed(message.timeStamp),
        };
    });
};

const calcSliceParam = async function (chatID, index) {
    const chatLength = await Chat.getChatLength(chatID);
    return index + 10 <= chatLength ? [-10 - index, 10] : [-chatLength, chatLength - index];
};

chatSchema.static("getChatLength", async function (chatID) {
    const ObjectId = mongoose.Types.ObjectId;
    const foundChatArray = await Chat.aggregate([
        { $match: { _id: ObjectId(chatID) } },
        { $project: { chatLength: { $size: "$messages" } } },
    ]);
    const chatLength = foundChatArray[0].chatLength;
    return chatLength;
});

chatSchema.static("getChat", async function (chatID, user) {
    const foundChat = await Chat.findById(chatID, {
        messages: { $slice: -10 },
    })
        .populate("members")
        .populate("messages")
        .populate({ path: "messages", populate: { path: "sender" } });

    await Chat.updateSeenBy(foundChat, user);
    const chat = filterChat(foundChat, user.username);
    return chat;
});

chatSchema.static("getChatByMembers", async function (members, user) {
    const foundChat = await Chat.findOne({
        members: { $all: members, $size: members.length },
    })
        .populate("members")
        .populate("messages")
        .populate({ path: "messages", populate: { path: "sender" } });

    if (foundChat) {
        const chat = filterChat(foundChat, user.username);
        return chat;
    }
    return null;
});

chatSchema.static("getChatList", async function (user) {
    const foundChatList = await Chat.find(
        { members: { $in: [user._id] } },
        { messages: { $slice: -1 } }
    )
        .populate("members")
        .populate("messages")
        .populate("seenBy");

    const chatList = filterChatList(foundChatList, user.username);
    return chatList;
});

chatSchema.static("getChatMessages", async function (chatID, index = 0) {
    const sliceParam = await calcSliceParam(chatID, index);
    if (sliceParam[1] === 0) return null;

    const chat = await Chat.findById(chatID, {
        messages: { $slice: sliceParam },
    })
        .populate("messages")
        .populate({ path: "messages", populate: { path: "sender" } });

    const chatMessages = extractChatMessages(chat);
    return chatMessages;
});

chatSchema.static("getChatMateSocketIDs", async function (chatID, sockets, username) {
    const chat = await Chat.findById(chatID).populate("members");
    const chatMates = extractChatMates(chat, username);
    const chatMateSocketIDs = [];

    for (let socket of sockets) {
        if (chatMates.includes(socket.data.username)) {
            chatMateSocketIDs.push(socket.id);
        }
        if (chatMateSocketIDs.length === chatMates.length) break;
    }
    return chatMateSocketIDs;
});

chatSchema.static("updateSeenBy", async function (chat, user) {
    if (!chat.seenBy.includes(user._id)) {
        chat.seenBy.push(user);
        await chat.save();
    }
});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
