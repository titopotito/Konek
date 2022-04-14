const createMessageComponent = function (message) {
    const messageContainerComponent = document.createElement("div");
    const imageComponent = document.createElement("img");
    const wrapper = document.createElement("div");
    const usernameComponent = document.createElement("strong");
    const messageComponent = document.createElement("p");

    imageComponent.src = "http://localhost:8000/images/default_user_image.jpg";
    usernameComponent.innerText = `@${message.username}:`;
    messageComponent.innerText = message.content;
    wrapper.appendChild(usernameComponent);
    wrapper.appendChild(messageComponent);
    messageContainerComponent.appendChild(imageComponent);
    messageContainerComponent.appendChild(wrapper);
    messageContainerComponent.classList = ["message-container"];

    return messageContainerComponent;
};

const appendMessage = function (message) {
    chatbox.appendChild(createMessageComponent(message));
};
