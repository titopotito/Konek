const messageForm = document.querySelector("#message-form-container");
const chatbox = document.querySelector("#chatbox");
const roomListComponent = document.querySelectorAll(".room-item");
const currentRoomComponent = document.querySelector("#current-room");
const usernameComponent = document.querySelector(".user-container .username");
const socket = io();
const username = usernameComponent.innerText;

let currentRoom = currentRoomComponent.innerText;

messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const content = messageForm.firstElementChild.value;
    const message = {
        content: content,
        username: username,
        room: currentRoom,
    };
    socket.emit("send-message", message);
    appendMessage({ content: content, username: "You" });
    messageForm.firstElementChild.value = "";
});

socket.on("broadcast-message", (message) => {
    appendMessage(message);
});

for (let roomComponent of roomListComponent) {
    roomComponent.addEventListener("click", (e) => {
        if (currentRoom !== "None") {
            chatbox.innerHTML = "";
            socket.emit("leave-room", currentRoom);
        }
        room = roomComponent.innerText;
        currentRoomComponent.innerText = room;
        currentRoom = room;
        console.log(`Joined ${room}`);
        socket.emit("join-room", room);
    });
}
