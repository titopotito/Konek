const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const User = require("./models/user");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const server = createServer(app);
const io = new Server(server);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: "test", resave: false, saveUninitialized: false }));

main().catch((err) => console.log(err));

async function main() {
    await mongoose.connect("mongodb://localhost:27017/konekApp");
    console.log("Connection with Mongo Database established...");
}

function isLoggedIn(req, res, next) {
    if (req.session._id) return next();
    res.redirect("login");
}

app.get("/", isLoggedIn, async (req, res) => {
    const hostURL = req.headers.host;
    const user = await User.findById(req.session._id);
    console.log(user);
    res.render("home", { hostURL, username: user.username });
});

app.get("/chat", (req, res) => {
    res.render("chat");
});

app.get("/login", (req, res) => {
    if (req.session._id) return res.redirect("/");
    res.render("login");
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const foundUser = await User.findOne({ username });
    if (foundUser) {
        const isCorrectPassword = await bcrypt.compare(
            password,
            foundUser.password
        );
        if (isCorrectPassword) {
            req.session._id = foundUser._id;
            return res.redirect("/");
        }
    }
    res.redirect("/login");
});

app.post("/logout", (req, res) => {
    req.session._id = null;
    res.redirect("login");
});

server.listen(8000, (req, res) => {
    console.log("Server is listening at port 8000");
});

io.on("connection", (socket) => {
    console.log(`Socket ${socket.id} has connected...`);

    socket.on("send-message", (message) => {
        socket.to(message.room).emit("broadcast-message", message);
    });

    socket.on("join-room", (room) => {
        console.log(`${socket.id} has joined room ${room}`);
        socket.join(room);
    });

    socket.on("leave-room", (room) => {
        socket.leave(room);
        console.log(`${socket.id} has left room ${room}`);
    });
});
