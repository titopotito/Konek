const express = require("express"),
    { createServer } = require("http"),
    { Server } = require("socket.io"),
    mongoose = require("mongoose"),
    session = require("express-session"),
    path = require("path"),
    { v4: uuid } = require("uuid"),
    flash = require("connect-flash");

const User = require("./models/user"),
    Chat = require("./models/chat"),
    ChatMessage = require("./models/chatMessage"),
    FriendRequest = require("./models/friendRequest");

const app = express(),
    httpServer = createServer(app),
    io = new Server(httpServer);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: "test", resave: false, saveUninitialized: false }));
app.use(flash());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.warning = req.flash("warning");
    res.locals.error = req.flash("error");
    next();
});

const { PeerServer } = require("peer"),
    peerServer = PeerServer({
        port: 9000,
        path: "/r",
    });

main().catch((err) => console.log(err));

async function main() {
    await mongoose.connect("mongodb://0.0.0.0:27017/watchApp");
    console.log("Connection with Mongo Database established...");
}

function isLoggedIn(req, res, next) {
    return req.session._username ? next() : res.redirect("/login");
}

async function initData(req, res, next) {
    const { _username } = req.session;
    const user = await User.findOne({ username: _username });
    const chatList = await Chat.getChatList(user);
    const urls = {
        host: req.headers.host,
        path: req.originalUrl,
    };

    req.contextData = { urls, chatList, user };
    return next();
}

app.get("/", isLoggedIn, initData, async (req, res) => {
    res.render("index", { ...req.contextData });
});

// ROOM ROUTE /////////////////////////////////////////////////////////////////////////////////////
// ROOM ROUTE /////////////////////////////////////////////////////////////////////////////////////
// ROOM ROUTE /////////////////////////////////////////////////////////////////////////////////////
// ROOM ROUTE /////////////////////////////////////////////////////////////////////////////////////

app.get("/r", isLoggedIn, async (req, res) => {
    req.session.isMovieHost = true;
    res.redirect(`r/${uuid()}`);
});

app.get("/r/:id", isLoggedIn, async (req, res) => {
    const urls = {
        host: req.headers.host,
        path: req.originalUrl,
    };
    res.render("room", {
        roomID: req.params.id,
        userID: req.session._id,
        urls,
        isMovieHost: req.session.isMovieHost,
    });
});

// FRIENDS ROUTE /////////////////////////////////////////////////////////////////////////////////////
// FRIENDS ROUTE /////////////////////////////////////////////////////////////////////////////////////
// FRIENDS ROUTE /////////////////////////////////////////////////////////////////////////////////////
// FRIENDS ROUTE /////////////////////////////////////////////////////////////////////////////////////

app.get("/friends", isLoggedIn, initData, async (req, res) => {
    res.render("friends/", { ...req.contextData });
});

app.get("/friends/requests", isLoggedIn, initData, async (req, res) => {
    const friendRequests = await FriendRequest.find({ requestee: req.contextData.user }).populate(
        "requestor"
    );
    res.render("friends/requests", { ...req.contextData, friendRequests });
});

app.get("/friends/sentRequests", isLoggedIn, initData, async (req, res) => {
    const sentRequests = await FriendRequest.find({ requestor: req.contextData.user }).populate(
        "requestee"
    );
    res.render("friends/sentRequests", { ...req.contextData, sentRequests });
});

app.get("/friends/requests/add", isLoggedIn, initData, async (req, res) => {
    res.render("friends/add", { ...req.contextData });
});

app.post("/friends/requests/add/:requestID", isLoggedIn, async (req, res) => {
    const { requestID } = req.params;
    const friendRequest = await FriendRequest.findById(requestID);
    await User.updateOne(
        { _id: friendRequest.requestee._id },
        { $push: { friends: friendRequest.requestor } }
    );

    await User.updateOne(
        { _id: friendRequest.requestor._id },
        { $push: { friends: friendRequest.requestee } }
    );

    await FriendRequest.deleteOne({ _id: friendRequest._id });
    return res.redirect("/friends/requests");
});

app.post("/friends/requests/delete/:requestID", isLoggedIn, async (req, res) => {
    const { requestID } = req.params;
    const friendRequest = await FriendRequest.findById(requestID);
    await FriendRequest.deleteOne({ _id: friendRequest._id });
    return res.redirect("/friends/requests");
});

app.post("/friends/sendFriendRequest", isLoggedIn, async (req, res) => {
    const { _username } = req.session;
    const { requesteeUsername } = req.body;
    const requestor = await User.findOne({ username: _username });
    const requestee = await User.findOne({ username: requesteeUsername });
    if (!requestee) {
        req.flash("error", "User does not exist.");
        return res.redirect("/");
    }

    const isFriends = requestor.friends.includes(requestee);
    if (isFriends) {
        req.flash("warning", "You are already friends with this user.");
        return res.redirect("/");
    }

    const hasPendingFriendRequest = await FriendRequest.findOne({
        requestor: requestor,
        requestee: requestee,
    });
    if (hasPendingFriendRequest) {
        req.flash("warning", "Already have pending friend request for this user.");
        return res.redirect("/");
    }

    await FriendRequest.sendFriendRequest(requestor, requestee);
    req.flash("success", "Friend request sent.");

    return res.redirect("/");
});

app.get("/chat/new", isLoggedIn, initData, async (req, res) => {
    res.render("chat/new", { ...req.contextData });
});

// CHAT ROUTE /////////////////////////////////////////////////////////////////////////////////////
// CHAT ROUTE /////////////////////////////////////////////////////////////////////////////////////
// CHAT ROUTE /////////////////////////////////////////////////////////////////////////////////////
// CHAT ROUTE /////////////////////////////////////////////////////////////////////////////////////

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

app.get("/chat/:chatID", isLoggedIn, initData, async (req, res) => {
    const { chatID } = req.params;
    const chat = await Chat.getChat(chatID, req.contextData.user);
    res.render("chat/chat", { ...req.contextData, chat });
});

app.get("/login", (req, res) => {
    return req.session._username ? res.redirect("/") : res.render("login");
});

// LOGIN LOGOUT ROUTE /////////////////////////////////////////////////////////////////////////////////////
// LOGIN LOGOUT ROUTE /////////////////////////////////////////////////////////////////////////////////////
// LOGIN LOGOUT ROUTE /////////////////////////////////////////////////////////////////////////////////////
// LOGIN LOGOUT ROUTE /////////////////////////////////////////////////////////////////////////////////////

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const authObject = await User.isAuthenticated(username, password);
    if (authObject) {
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

// SOCKETS /////////////////////////////////////////////////////////////////////////////////////
// SOCKETS /////////////////////////////////////////////////////////////////////////////////////
// SOCKETS /////////////////////////////////////////////////////////////////////////////////////
// SOCKETS /////////////////////////////////////////////////////////////////////////////////////

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

    socket.on("send-screen-video-stream", (userID) => {
        socket.emit("send-screen-video-stream", userID);
    });
});

// TO DO FOR CHAT APPLICATION:
// - UI DESIGN/RESPONSIVENESS
// - FIX CHAT SCROLL
