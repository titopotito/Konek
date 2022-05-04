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
