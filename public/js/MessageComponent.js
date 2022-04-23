class MessageComponent {
    constructor(message, parentElement = null) {
        this.message = message;
        this.parentElement = parentElement;
    }

    createHtmlComponentFor(user) {
        if (user === "sender" || user === "receiver") {
            this.htmlComponent = {
                messageBlock: document.createElement("div"),
                subMessageBlock: document.createElement("div"),
                messageBox: document.createElement("div"),
                textContent: document.createElement("p"),
                ellipsis: document.createElement("i"),
                timeEllapsed: document.createElement("span"),
            };

            if (user === "sender") {
                this.htmlComponent.messageBlock.classList = [
                    "user-message-block",
                ];
            } else {
                this.htmlComponent.senderImage = document.createElement("img");
                this.htmlComponent.senderImage.src =
                    "http://localhost:8000/images/default_user_image.jpg";
                this.htmlComponent.senderImage.classList = ["profile-picture"];
                this.htmlComponent.subMessageBlock.appendChild(
                    this.htmlComponent.senderImage
                );

                this.htmlComponent.messageBlock.classList = [
                    "chat-message-block",
                ];
            }

            this.htmlComponent.textContent.innerText = this.message;
            this.htmlComponent.timeEllapsed.innerText = "Just Now";

            this.htmlComponent.messageBox.classList = ["chat-message-box"];
            this.htmlComponent.ellipsis.classList = ["fas fa-ellipsis-h"];
            this.htmlComponent.timeEllapsed.classList = ["time-ellapsed"];

            this.htmlComponent.messageBox.appendChild(
                this.htmlComponent.textContent
            );

            this.htmlComponent.subMessageBlock.append(
                this.htmlComponent.messageBox,
                this.htmlComponent.ellipsis,
                this.htmlComponent.timeEllapsed
            );

            this.htmlComponent.messageBlock.appendChild(
                this.htmlComponent.subMessageBlock
            );

            return this.htmlComponent.messageBlock;
        }
        throw Error('Argument must be either "sender" or "receiver"');
    }

    createAndDisplayMessageAs(user) {
        if (!this.parentElement) {
            throw Error(
                `parentElement property of ${this} is ${this.parentElement}`
            );
        }
        this.parentElement.appendChild(this.createHtmlComponentFor(user));
    }
}
