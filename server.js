const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");

const User = require("./models/user");
const Chat = require("./models/chat");
const ChatMessage = require("./models/chatMessage");

const app = express();
const server = createServer(app);
const io = new Server(server);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
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
    const user = await User.findById(req.session._id);
    res.render("index", { username: user.username });
});

app.get("/chat", isLoggedIn, async (req, res) => {
    const hostURL = req.headers.host;
    const user = await User.findById(req.session._id);
    const chatList = await Chat.getChatList(user);
    const chat = null;
    res.render("chat", { hostURL, chatList, chat, user });
});

app.get("/chat/:chatID", isLoggedIn, async (req, res) => {
    const hostURL = req.headers.host;
    const user = await User.findById(req.session._id);
    const chatList = await Chat.getChatList(user);
    const { chatID } = req.params;
    const chat = await Chat.getChat(chatID);
    res.render("chat", { hostURL, chatList, chat, user });
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

    socket.on("submit-message", (chatData) => {
        socket.broadcast.emit("send-message", chatData);
    });

    // socket.on("join-room", (room) => {
    //     console.log(`${socket.id} has joined room ${room}`);
    //     socket.join(room);
    // });

    // socket.on("leave-room", (room) => {
    //     socket.leave(room);
    //     console.log(`${socket.id} has left room ${room}`);
    // });
});

// TO DO FOR CHAT APPLICATION:
// - USE OF CLIENT ASYNC CALL FOR RETREIVING CHAT
// - GROUPING OF LOGIC
// - SENDING AND SAVING
// - FORMATTING AND DISPLAYING DATE TIME
// - UI DESIGN/RESPONSIVENESS
