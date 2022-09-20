const socket = io();
const clientUsername = document.querySelector("#client-data").dataset.clientUsername;
const clientId = document.querySelector("#client-data").dataset.clientId;
const chatID = getChatID();

const chatHeaderHtml = document.querySelector("#chat-section > div"),
    chatFormHtml = document.querySelector("#chat-form"),
    chatInputHtml = document.querySelector("#chat-form > input"),
    chatOutputBoxHtml = document.querySelector("#chat-box > div:first-child"),
    searchUserFormHtml = document.querySelector("#search-user-form"),
    searchUserInputHtml = document.querySelector("#search-user-form > div > input"),
    searchUserOutputHtml = document.querySelector("#search-user-form > div > ul");

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
            const { chatID, usernames } = await getOrCreateNewChat();
            displayChatHeader(usernames);
            window.history.replaceState(null, null, `/chat/${chatID}`);
        } else if (isNewChat()) {
            return;
        }
        sendMessage(userInput);
        displayMessage(userInput);
        updateChatList({
            chatID: chatID,
            textContent: userInput,
            isSender: true,
        });
        autoScrollDown(chatOutputBoxHtml);
    });
}

if (chatInputHtml) {
    if (chatID !== null) {
        chatInputHtml.addEventListener("focus", async (e) => {
            const username = await getUsername();
            socket.emit("update-seen-by", { chatID, username });
        });
    }
}

if (chatOutputBoxHtml) {
    chatOutputBoxHtml.addEventListener("scroll", async (e) => {
        if (chatOutputBoxHtml.scrollTop === 0 && chatID !== null) {
            const username = await getUsername();
            const index = chatOutputBoxHtml.childElementCount;
            socket.emit("get-chat-messages", { chatID, username, index });
        }
    });
}

autoScrollDown(chatOutputBoxHtml);

socket.on("connect", async () => {
    const username = await getUsername();
    socket.emit("assign-username-to-socket", username);
});

socket.on("display-search-result", async (data) => {
    const { users } = data;
    const html = ejs.render(components.searchItem, { users });
    searchUserOutputHtml.innerHTML = html;

    const searchResultsHtml = document.querySelectorAll("#search-user-form > div > ul > li");
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
    if (chatData.chatID === chatID) {
        displayMessage(chatData.textContent, (isSender = false));
    }
    updateChatList(chatData);
    autoScrollDown(chatOutputBoxHtml);
});

socket.on("update-chat-list-item", (chatData) => {
    updateChatList(chatData);
});

socket.on("load-chat-messages", ({ chatMessages, user }) => {
    if (chatMessages) {
        const firstElement = chatOutputBoxHtml.firstElementChild;
        const html = ejs.render(components.chatMessages, { chatMessages, user });
        chatOutputBoxHtml.insertAdjacentHTML("afterbegin", html);
        firstElement.scrollIntoView();
    } else {
        console.log("Reached end of chat.");
    }
});

// searchUserInputHtml.addEventListener("focusout", function (e) {
//     searchUserOutputHtml.innerHTML = "";
// });
