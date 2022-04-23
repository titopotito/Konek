const chatFormHtml = document.querySelector("#chat-form");
const chatInputHtml = document.querySelector("#chat-form > input");
const chatOutputBoxHtml = document.querySelector("#chat-box > div:first-child");

const socket = io();

chatFormHtml.addEventListener("submit", (e) => {
    e.preventDefault();
    const chatData = { userInput: chatInputHtml.value };
    submitMessage(chatData);
    const newMessageComponent = new MessageComponent(
        chatData.userInput,
        chatOutputBoxHtml
    );
    newMessageComponent.createAndDisplayMessageAs("sender");
    chatInputHtml.value = "";
});

socket.on("send-message", (chatData) => {
    const newMessageComponent = new MessageComponent(
        chatData.userInput,
        chatOutputBoxHtml
    );
    newMessageComponent.createAndDisplayMessageAs("receiver");
});
