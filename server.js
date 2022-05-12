const express = require("express"),
    { createServer } = require("http"),
    { Server } = require("socket.io"),
    mongoose = require("mongoose"),
    session = require("express-session"),
    path = require("path");

const User = require("./models/user"),
    Chat = require("./models/chat"),
    ChatMessage = require("./models/chatMessage");

const app = express(),
    server = createServer(app),
    io = new Server(server);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: "test", resave: false, saveUninitialized: false }));

main().catch((err) => console.log(err));

async function main() {
    await mongoose.connect("mongodb://localhost:27017/watchApp");
    console.log("Connection with Mongo Database established...");
}

function isLoggedIn(req, res, next) {
    return req.session._id ? next() : res.redirect("/login");
}

app.get("/", isLoggedIn, async (req, res) => {
    const { username } = await User.findById(req.session._id);
    res.render("index", { username });
});

app.get("/chat", isLoggedIn, async (req, res) => {
    const user = await User.findById(req.session._id);
    const chatList = await Chat.getChatList(user);
    const urls = {
        host: req.headers.host,
        path: req.originalUrl,
    };
    res.render("chat", { urls, chatList, user });
});

app.get("/chat/new", isLoggedIn, async (req, res) => {
    const user = await User.findById(req.session._id);
    const chatList = await Chat.getChatList(user);
    const urls = {
        host: req.headers.host,
        path: req.originalUrl,
    };
    res.render("chat", { urls, chatList, user });
});

app.post("/chat/new", isLoggedIn, async (req, res) => {
    const { usernames } = req.body;
    const user = await User.findById(req.session._id);
    const users = await User.find({ username: { $in: usernames } });
    users.push(user);

    const chat = await Chat.findOne({
        users: { $all: users, $size: users.length },
    });

    if (!chat) {
        const newChat = new Chat({
            users: users,
            chatMessages: [],
        });
        const savedChat = await newChat.save();
        const chatID = savedChat._id;
        return res.json({ chatID });
    }

    const chatID = chat._id;
    res.json({ chatID });
});

app.get("/chat/:chatID", isLoggedIn, async (req, res) => {
    const user = await User.findById(req.session._id);
    const { chatID } = req.params;
    const chat = await Chat.getChat(chatID, user);
    const chatList = await Chat.getChatList(user);
    const urls = {
        host: req.headers.host,
        path: req.originalUrl,
    };
    res.render("chat", { urls, chatList, chat, user });
});

app.get("/login", (req, res) => {
    return req.session._id ? res.redirect("/") : res.render("login");
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const userID = await User.isAuthenticated(username, password);
    if (userID) {
        req.session._id = userID;
        return res.redirect("/");
    }
    res.redirect("/login");
});

app.post("/logout", (req, res) => {
    req.session._id = null;
    res.redirect("login");
});

app.get("/_get_username", isLoggedIn, async (req, res) => {
    const user = await User.findById(req.session._id);
    const { username } = user;
    res.json({ username });
});

server.listen(8000, (req, res) => {
    console.log("Server is listening at port 8000");
});

io.on("connection", (socket) => {
    console.log(`Socket ${socket.id} has connected...`);

    socket.on("assign-username-to-socket", (username) => {
        socket.data.username = username;
    });

    socket.on("send-message", async (chatData) => {
        await ChatMessage.saveChatMessage(chatData);
        const sockets = await io.fetchSockets();
        const chatMateSocketIDs = await Chat.getChatMateSocketIDs(
            chatData,
            sockets
        );
        chatMateSocketIDs.forEach((socketID) =>
            socket.to(socketID).emit("receive-message", chatData)
        );
    });

    socket.on("search-users", async (inputData) => {
        const { userInput } = inputData;
        const users = await User.searchUser(userInput);
        socket.emit("display-search-result", { users });
    });

    socket.on("get-chat", async (data) => {
        const { usernames } = data;
        const user = await User.findOne({ username: usernames.slice(-1)[0] });
        const users = await User.find({ username: { $in: usernames } });
        const chat = await Chat.getChatByUsers(users);
        socket.emit("display-chat", { user, chat });
    });

    socket.on("update-is-seen-by", async ({ chatID, username }) => {
        const user = await User.findOne({ username });
        const chat = await Chat.findById(chatID);
        await Chat.updateIsSeenBy(chat, user);
        socket.emit("update-chat-list-item", {
            chatID,
            textContent: chat.textContent,
            isSender: true,
        });
    });
});

// TO DO FOR CHAT APPLICATION:
// - FIX BROADCASTING OF MESSAGE (SHOULD ONLY TO SPECIFIC USER)
// - UI DESIGN/RESPONSIVENESS
