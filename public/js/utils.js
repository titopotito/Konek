const getChatID = function () {
    const path = window.location.pathname;
    const chatID = path.slice(6);
    return chatID;
};

const getUsername = async function () {
    const unparsedData = await fetch("/_get_username");
    const parsedData = await unparsedData.json();
    return parsedData.username;
};

const submitMessage = async function (userInput) {
    const chatData = {
        chatID: getChatID(),
        sender: await getUsername(),
        textContent: userInput,
        timeStamp: Date.now(),
    };
    socket.emit("submit-message", chatData);
};

const autoScrollDown = function (targetHtml) {
    targetHtml.scrollTop = targetHtml.scrollHeight;
};

const getChat = async function () {
    const tagsHtml = document.querySelectorAll(".tags");
    const usernames = [];
    const username = await getUsername();
    tagsHtml.forEach((tag) => usernames.push(tag.innerText));
    usernames.push(username);
    socket.emit("get-chat", { usernames });
};

const getOrCreateNewChat = async function (userInput) {
    const usernames = [];
    const tagsHtml = document.querySelectorAll(".tags");
    tagsHtml.forEach((tag) => usernames.push(tag.innerText));

    const unparsedData = await fetch("/chat/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput, usernames }),
    });
    const { chatID, users } = await unparsedData.json();
    if (users) socket.emit("join-room", { chatID, users });
    return { chatID, usernames, userInput };
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

const clearSearchInput = function () {
    searchUserOutputHtml.innerHTML = "";
    searchUserInputHtml.value = "";
    searchUserInputHtml.focus();
};
