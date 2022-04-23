const getUsername = async function () {
    const unparsedData = await fetch("/_get_username");
    const parsedData = await unparsedData.json();
    return parsedData.username;
};

const submitMessage = async function (chatData) {
    const username = await getUsername();
    chatData.username = username;
    socket.emit("submit-message", chatData);
};
