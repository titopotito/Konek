const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = createServer(app);
const io = new Server(server);
let username = "";

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    if (username === "") {
        res.redirect("login");
    }
    const hostURL = req.headers.host;
    res.render("index", { hostURL, username });
});

app.post("/", (req, res) => {
    username = req.body.username;
    res.redirect("/");
});

app.get("/login", (req, res) => {
    res.render("login");
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
