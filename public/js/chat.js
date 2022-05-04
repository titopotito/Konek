const chatFormHtml = document.querySelector("#chat-form");
const chatInputHtml = document.querySelector("#chat-form > input");
const chatOutputBoxHtml = document.querySelector("#chat-box > div:first-child");

const socket = io();

chatFormHtml.addEventListener("submit", (e) => {
    e.preventDefault();
    const userInput = chatInputHtml.value;
    submitMessage(userInput);
    const newMessageComponent = new MessageComponent(
        userInput,
        chatOutputBoxHtml
    );
    newMessageComponent.createAndDisplayMessageAs("sender");
    chatInputHtml.value = "";
    autoScrollDown(chatOutputBoxHtml);
});

socket.on("send-message", (chatData) => {
    const newMessageComponent = new MessageComponent(
        chatData.textContent,
        chatOutputBoxHtml
    );
    newMessageComponent.createAndDisplayMessageAs("receiver");
    autoScrollDown(chatOutputBoxHtml);
});

autoScrollDown(chatOutputBoxHtml);
