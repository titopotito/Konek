const getUsername = async function () {
    const unparsedData = await fetch("/_get_username");
    const parsedData = await unparsedData.json();
    return parsedData.username;
};

const getChatID = function () {
    const path = window.location.pathname;
    const chatID = path.slice(6);
    return chatID;
};

const getChat = async function () {
    const tagsHtml = document.querySelectorAll(".tags");
    const usernames = [];
    const username = await getUsername();
    tagsHtml.forEach((tag) => usernames.push(tag.innerText));
    usernames.push(username);
    socket.emit("get-chat", { usernames });
};

const getOrCreateNewChat = async function () {
    const usernames = [];
    const tagsHtml = document.querySelectorAll(".tags");
    tagsHtml.forEach((tag) => usernames.push(tag.innerText));

    const unparsedData = await fetch("/chat/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames }),
    });

    const { chatID } = await unparsedData.json();
    return { chatID, usernames };
};

const sendMessage = async function (userInput) {
    const chatData = {
        chatID: getChatID(),
        sender: await getUsername(),
        textContent: userInput,
        timeStamp: Date.now(),
    };
    clearChatInput();
    socket.emit("send-message", chatData);
};

const displayMessage = function (textContent, isSender = true) {
    let html;
    if (isSender) {
        html = ejs.render(components.messageBlock.sent, { textContent });
    } else {
        html = ejs.render(components.messageBlock.received, {
            textContent,
        });
    }
    chatOutputBoxHtml.insertAdjacentHTML("beforeend", html);
};

const displayChat = function (user, chat) {
    const html = ejs.render(components.chatDisplay, { user, chat });
    chatOutputBoxHtml.innerHTML = html;
};

const displayChatHeader = function (usernames) {
    const html = ejs.render(components.chatHeader, {
        usernames,
    });
    chatHeaderHtml.innerHTML = html;
};

const insertTag = async function ({ username, targetHtml = window, position }) {
    const html = ejs.render(components.tags, { username });
    targetHtml.insertAdjacentHTML(position, html);
    targetHtml.previousElementSibling.lastElementChild.addEventListener(
        "click",
        async function (e) {
            e.preventDefault();
            this.parentElement.remove();
            searchUserInputHtml.focus();
            await getChat();
        }
    );
    clearSearchInput();
};

const updateChatList = function ({ chatID, textContent, isSender = false }) {
    const usernamesHtml = document.querySelectorAll(".chat-list-username");
    const chatListItemsHtml = document.querySelectorAll(".chat-list-item");
    for (let i = 0; i < chatListItemsHtml.length; i++) {
        if (
            chatListItemsHtml[i].href === `http://localhost:8000/chat/${chatID}`
        ) {
            if (textContent) {
                usernamesHtml[i].parentElement.nextElementSibling.innerText =
                    textContent;
                usernamesHtml[i].nextElementSibling.innerText = "Just Now";
            }
            if (!isSender) {
                chatListItemsHtml[i].classList.add("highlight-bg");
                usernamesHtml[i].classList.add("highlight-text");
                usernamesHtml[i].parentElement.nextElementSibling.classList.add(
                    "highlight-text"
                );
                usernamesHtml[i].nextElementSibling.classList.add(
                    "highlight-text"
                );
            } else {
                usernamesHtml[i].classList.remove("highlight-text");
                usernamesHtml[
                    i
                ].parentElement.nextElementSibling.classList.remove(
                    "highlight-text"
                );
                usernamesHtml[i].nextElementSibling.classList.remove(
                    "highlight-text"
                );
            }
        }
    }
};

const isNewChat = function () {
    return window.location.pathname === "/chat/new" ? true : false;
};

const hasSelectedUsers = function () {
    const tagsHtml = document.querySelectorAll(".tags");
    return tagsHtml.length ? true : false;
};

const clearSearchInput = function () {
    searchUserOutputHtml.innerHTML = "";
    searchUserInputHtml.value = "";
    searchUserInputHtml.focus();
};

const clearChatInput = () => (chatInputHtml.value = "");

const autoScrollDown = function (targetHtml) {
    if (targetHtml) targetHtml.scrollTop = targetHtml.scrollHeight;
};
