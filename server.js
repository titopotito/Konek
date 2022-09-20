const express = require("express"),
    { createServer } = require("http"),
    { Server } = require("socket.io"),
    mongoose = require("mongoose"),
    session = require("express-session"),
    path = require("path"),
    { v4: uuid } = require("uuid");

const User = require("./models/user"),
    Chat = require("./models/chat"),
    ChatMessage = require("./models/chatMessage");

const app = express(),
    httpServer = createServer(app),
    io = new Server(httpServer);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: "test", resave: false, saveUninitialized: false }));

const { PeerServer } = require("peer"),
    peerServer = PeerServer({
        port: 9000,
        path: "/r",
    });

main().catch((err) => console.log(err));

async function main() {
    await mongoose.connect("mongodb://localhost:27017/watchApp");
    console.log("Connection with Mongo Database established...");
}

function isLoggedIn(req, res, next) {
    return req.session._username ? next() : res.redirect("/login");
}

app.get("/", isLoggedIn, async (req, res) => {
    const { _username } = req.session;
    res.render("index", { username: _username });
});

app.get("/r", isLoggedIn, async (req, res) => {
    res.redirect(`r/${uuid()}`);
});

app.get("/r/:id", isLoggedIn, async (req, res) => {
    const urls = {
        host: req.headers.host,
        path: req.originalUrl,
    };
    res.render("room", { roomID: req.params.id, userID: req.session._id, urls });
});

app.get("/chat", isLoggedIn, async (req, res) => {
    const { _username } = req.session;
    const user = await User.findOne({ username: _username });
    const chatList = await Chat.getChatList(user);
    const urls = {
        host: req.headers.host,
        path: req.originalUrl,
    };
    res.render("chat", { urls, chatList, user });
});

app.get("/chat/new", isLoggedIn, async (req, res) => {
    const { _username } = req.session;
    const user = await User.findOne({ username: _username });
    const chatList = await Chat.getChatList(user);
    const urls = {
        host: req.headers.host,
        path: req.originalUrl,
    };
    res.render("chat", { urls, chatList, user });
});

app.post("/chat/new", isLoggedIn, async (req, res) => {
    const { _username } = req.session;
    const { usernames } = req.body;
    const user = await User.findOne({ username: _username });
    const chatMembers = await User.find({ username: { $in: usernames } });
    chatMembers.push(user);

    const chat = await Chat.findOne({
        members: { $all: chatMembers, $size: chatMembers.length },
    });

    if (!chat) {
        const newChat = new Chat({
            members: chatMembers,
            messages: [],
        });
        const savedChat = await newChat.save();
        const chatID = savedChat._id;
        return res.json({ chatID });
    }

    const chatID = chat._id;
    res.json({ chatID });
});

app.get("/chat/:chatID", isLoggedIn, async (req, res) => {
    const { _username } = req.session;
    const { chatID } = req.params;
    const user = await User.findOne({ username: _username });
    const chat = await Chat.getChat(chatID, user);
    const chatList = await Chat.getChatList(user);
    const urls = {
        host: req.headers.host,
        path: req.originalUrl,
    };
    res.render("chat", { urls, chatList, chat, user });
});

app.get("/login", (req, res) => {
    return req.session._username ? res.redirect("/") : res.render("login");
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const authObject = await User.isAuthenticated(username, password);
    if (authObject.id) {
        req.session._username = authObject.username;
        req.session._id = authObject.id;
        return res.redirect("/");
    }
    res.redirect("/login");
});

app.post("/logout", (req, res) => {
    req.session._username = null;
    res.redirect("login");
});

app.get("/_get-client-username", (req, res) => {
    const { _username } = req.session;
    res.json({ username: _username });
});

httpServer.listen(8000, (req, res) => {
    console.log("Server is listening at port 8000");
});

io.on("connection", (socket) => {
    console.log(`Socket ${socket.id} has connected...`);

    socket.on("assign-username-to-socket", (username) => {
        socket.data.username = username;
    });

    socket.on("send-message", async (chatData) => {
        await ChatMessage.saveChatMessage(chatData);
        const chatID = chatData.chatID;
        const username = chatData.sender;
        const sockets = await io.fetchSockets();
        const socketIDs = await Chat.getChatMateSocketIDs(chatID, sockets, username);
        socketIDs.forEach((socketID) => socket.to(socketID).emit("receive-message", chatData));
    });

    socket.on("search-users", async ({ userInput }) => {
        const users = await User.searchUser(userInput);
        socket.emit("display-search-result", { users });
    });

    socket.on("get-chat", async ({ usernames }) => {
        const user = await User.findOne({ username: usernames.slice(-1)[0] });
        const chatMembers = await User.find({ username: { $in: usernames } });
        const chat = await Chat.getChatByMembers(chatMembers, user);
        socket.emit("display-chat", { user, chat });
    });

    socket.on("update-seen-by", async ({ chatID, username }) => {
        const user = await User.findOne({ username });
        const chat = await Chat.findById(chatID);
        await Chat.updateSeenBy(chat, user);
        socket.emit("update-chat-list-item", {
            chatID,
            isSender: true,
        });
    });

    socket.on("get-chat-messages", async ({ chatID, username, index }) => {
        const user = await User.findOne({ username });
        const chatMessages = await Chat.getChatMessages(chatID, index);
        socket.emit("load-chat-messages", { chatMessages, user });
    });

    socket.on("join-room", (roomID, userID) => {
        socket.join(roomID);
        socket.to(roomID).emit("user-connected", userID);

        socket.on("disconnect", () => {
            socket.to(roomID).emit("user-disconnected", userID);
        });
    });
});

// TO DO FOR CHAT APPLICATION:
// - UI DESIGN/RESPONSIVENESS
// - FIX CHAT SCROLL
