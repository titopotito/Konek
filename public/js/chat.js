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
        socket.emit("search-input", { userInput });
    });
}

if (chatFormHtml) {
    chatFormHtml.addEventListener("submit", async (e) => {
        e.preventDefault();
        const userInput = chatInputHtml.value;

        if (window.location.pathname === "/chat/new") {
            const { chatID, usernames } = await getOrCreateNewChat(userInput);
            const html = ejs.render(components.chatHeader, { usernames });
            chatHeaderHtml.innerHTML = html;
            window.history.replaceState(null, null, `/chat/${chatID}`);
        }

        const html = ejs.render(components.messageBlock.sent, {
            textContent: userInput,
        });
        chatOutputBoxHtml.insertAdjacentHTML("beforeend", html);
        chatInputHtml.value = "";
        autoScrollDown(chatOutputBoxHtml);
        submitMessage(userInput);
    });
}

if (chatOutputBoxHtml) {
    autoScrollDown(chatOutputBoxHtml);
}

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

socket.on("display-chat", async (data) => {
    const { user, chat } = data;
    if (chat) {
        const html = ejs.render(components.chatDisplay, { user, chat });
        chatOutputBoxHtml.innerHTML = html;
    } else {
        chatOutputBoxHtml.innerHTML = "";
    }
    autoScrollDown(chatOutputBoxHtml);
});

// searchUserInputHtml.addEventListener("focusout", function (e) {
//     searchUserOutputHtml.innerHTML = "";
// });

socket.on("send-message", (chatData) => {
    const { textContent } = chatData;
    const html = ejs.render(components.messageBlock.received, { textContent });
    chatOutputBoxHtml.insertAdjacentHTML("beforeend", html);
    autoScrollDown(chatOutputBoxHtml);
});
