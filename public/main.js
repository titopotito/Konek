const messageForm = document.querySelector("#message-form-container > form");
const chatbox = document.querySelector("#chatbox");
const socket = io();

messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const content = messageForm.firstElementChild.value;
    const message = {
        content: content,
        username: "James",
    };
    socket.emit("send-message", message);
    appendMessage({ content: content, username: "You" });
    messageForm.firstElementChild.value = "";
});

socket.on("broadcast-message", (message) => {
    appendMessage(message);
});
