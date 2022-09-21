const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const peers = {};
const hostPeer = createHostPeer();
const myPeer = new Peer(PEER_ID, {
    port: 9000,
    host: "/localhost",
    path: "/r",
});

// ///////////////////////////////////////////////////////////////

navigator.mediaDevices
    .getUserMedia({
        video: true,
        audio: true,
    })
    .then((stream) => {
        const myVideo = document.createElement("video");
        myVideo.muted = true;
        displayCameraVideoStream(myVideo, stream);

        myPeer.on("call", (call) => {
            call.answer(stream);
            call.on("stream", (userVideoStream) => {
                if (call.metadata.type === "cameraVideo") {
                    const video = document.createElement("video");
                    displayCameraVideoStream(video, userVideoStream);
                }
                if (call.metadata.type === "screenVideo") {
                    const video = document.getElementById("main-vid");
                    displayScreenVideoStream(video, userVideoStream);
                }
            });
        });

        socket.on("user-connected", (userID) => {
            setTimeout(() => {
                connectToNewUser(userID, stream);
            }, 3000);
        });
    });

// /////////////////////////////////////////////////////////////////////////////////

if (hostPeer) {
    navigator.mediaDevices.getDisplayMedia({ cursor: true }).then((stream) => {
        const video = document.getElementById("main-vid");
        video.srcObject = stream;
        video.addEventListener("loadedmetadata", () => {
            video.play();
        });
        socket.on("send-screen-video-stream", (userID) => {
            setTimeout(() => {
                const options = { metadata: { type: "screenVideo" } };
                hostPeer.call(userID, stream, options);
            }, 3000);
        });
    });
}

// ////////////////////////////////////////////////////////////////////////////////////////////

myPeer.on("open", (userID) => {
    socket.emit("join-room", ROOM_ID, userID);
});

socket.on("user-disconnected", (userID) => {
    if (peers[userID]) peers[userID].close();
});

// /////////////////////////////////////////////////////////////////////////////////////////////

function connectToNewUser(userID, stream) {
    const options = { metadata: { type: "cameraVideo" } };
    const call = myPeer.call(userID, stream, options);
    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
        displayCameraVideoStream(video, userVideoStream);
    });
    call.on("close", () => {
        video.remove();
    });

    peers[userID] = call;

    socket.emit("send-screen-video-stream", userID);
}

function displayCameraVideoStream(video, stream) {
    video.srcObject = stream;
    video.classList = ["chat-mate-vid"];
    video.addEventListener("loadedmetadata", () => {
        video.play();
    });
    videoGrid.append(video);
}

function displayScreenVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    });
}

function createHostPeer() {
    if (IS_MOVIE_HOST) {
        const hostPeer = new Peer("0host", {
            port: 9000,
            host: "localhost",
            path: "/r",
        });
        return hostPeer;
    }
    return null;
}
