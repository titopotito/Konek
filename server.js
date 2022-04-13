const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = createServer(app);
const io = new Server(server);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    const hostURL = req.headers.host;
    res.render("index", { hostURL });
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
