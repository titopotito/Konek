const socket = io();

const chatHeaderHtml = document.querySelector("#chat-section > div"),
    chatFormHtml = document.querySelector("#chat-form"),
    chatInputHtml = document.querySelector("#chat-form > input"),
    chatOutputBoxHtml = document.querySelector("#chat-box > div:first-child"),
    searchUserFormHtml = document.querySelector("#search-user-form"),
    searchUserInputHtml = document.querySelector(
        "#search-user-form > div > input"
    ),
    searchUserOutputHtml = document.querySelector(
        "#search-user-form > div > ul"
    );

if (searchUserInputHtml) {
    searchUserInputHtml.addEventListener("input", function (e) {
        const userInput = this.value;
        socket.emit("search-users", { userInput });
    });
}

if (chatFormHtml) {
    chatFormHtml.addEventListener("submit", async (e) => {
        e.preventDefault();
        const userInput = chatInputHtml.value;
        if (isNewChat() && hasSelectedUsers()) {
            const { chatID, usernames } = await getOrCreateNewChat(userInput);
            displayChatHeader(usernames);
            window.history.replaceState(null, null, `/chat/${chatID}`);
        } else if (isNewChat()) {
            return;
        }
        sendMessage(userInput);
        displayMessage(userInput);
        updateChatList({
            chatID: getChatID(),
            textContent: userInput,
            isSender: true,
        });
        autoScrollDown(chatOutputBoxHtml);
    });
}

if (chatInputHtml) {
    const chatID = getChatID();
    if (chatID) {
        chatInputHtml.addEventListener("focus", async (e) => {
            const username = await getUsername();
            socket.emit("update-is-seen-by", { chatID, username });
        });
    }
}

socket.on("connect", async () => {
    const username = await getUsername();
    socket.emit("assign-username-to-socket", username);
});

socket.on("display-search-result", async (data) => {
    const { users } = data;
    const html = ejs.render(components.searchItem, { users });
    searchUserOutputHtml.innerHTML = html;

    const searchResultsHtml = document.querySelectorAll(
        "#search-user-form > div > ul > li"
    );
    searchResultsHtml.forEach((resultHtml) => {
        resultHtml.addEventListener("click", async (e) => {
            insertTag({
                username: resultHtml.lastElementChild.innerText,
                targetHtml: searchUserInputHtml.parentElement,
                position: "beforebegin",
            });
            await getChat();
        });
    });
});

autoScrollDown(chatOutputBoxHtml);

socket.on("display-chat", async (data) => {
    const { user, chat } = data;
    if (chat) {
        displayChat(user, chat);
        autoScrollDown(chatOutputBoxHtml);
    } else {
        chatOutputBoxHtml.innerHTML = "";
    }
});

socket.on("receive-message", (chatData) => {
    const { textContent, chatID } = chatData;
    if (chatID === getChatID()) {
        displayMessage(textContent, (isSender = false));
    }
    updateChatList(chatData);
    autoScrollDown(chatOutputBoxHtml);
});

socket.on("update-chat-list-item", (chatData) => {
    updateChatList(chatData);
});

// searchUserInputHtml.addEventListener("focusout", function (e) {
//     searchUserOutputHtml.innerHTML = "";
// });
