const createMessageComponent = function (message) {
    const messageContainerComponent = document.createElement("div");
    const usernameComponent = document.createElement("strong");
    const messageComponent = document.createElement("p");

    usernameComponent.innerText = `${message.username}:`;
    messageComponent.innerText = message.content;
    messageContainerComponent.appendChild(usernameComponent);
    messageContainerComponent.appendChild(messageComponent);
    messageContainerComponent.classList = ["message-container"];

    return messageContainerComponent;
};

const appendMessage = function (message) {
    chatbox.appendChild(createMessageComponent(message));
};
