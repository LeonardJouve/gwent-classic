import Events from "./Events.js";

const socket = new WebSocket("ws://100.96.219.102:2001");

socket.addEventListener("open", () => {
    addListeners();
    setOnline();
});

socket.addEventListener("close", () => {
    removeListeners();
    setOffline();
});

socket.addEventListener("message", (event) => {
    try {
        const {type, data} = JSON.parse(event.data);
        switch (type) {
        case Events.UPDATE_PLAYER_COUNT: {
            updateNrPlayer(data.count);
            break;
        }
        case Events.MATCHMAKING_FOUND:
            window.location.pathname = '/gwent.html';
            break;
        }
    } catch (e) {
        console.error(e);
    }
});

function send(type, data) {
    socket.send(JSON.stringify({
        type,
        data,
    }));
}

function handleRename() {
    const name = document.getElementById("name");
    if (!name) return;

    send(Events.RENAME, {name: name.value});
}

function handleMatchmaking() {
    const matchmaking = document.getElementById("matchmaking");
    if (!matchmaking) return;

    if (matchmaking.className.includes(" queued")) {
        matchmaking.className = matchmaking.className.replace(" queued", "");
    } else {
        matchmaking.className += " queued"
    }

    send(Events.MATCHMAKING_QUEUE, null);
}

function addListeners() {
    const name = document.getElementById("name");
    const matchmaking = document.getElementById("matchmaking");
    if (!name || !matchmaking) return;

    name.addEventListener("blur", handleRename);
    matchmaking.addEventListener("click", handleMatchmaking);
}

function removeListeners() {
    const name = document.getElementById("name");
    const matchmaking = document.getElementById("matchmaking");
    if (!name || !matchmaking) return;

    name.removeEventListener("blur", handleRename);
    matchmaking.removeEventListener("click", handleMatchmaking);
}

function updateNrPlayer(count) {
    const nrPlayerOnline = document.getElementById("nr-player-online");
    if (!nrPlayerOnline) return;

    nrPlayerOnline.textContent = count;
}

function setOffline() {
    const serverStatus = document.getElementById("server-status");
    if (!serverStatus) return;

    serverStatus.className = "status-offline";
    serverStatus.textContent = "Offline";

    const playerOnline = document.getElementById("player-online");
    const playerOnlineBreak = document.getElementById("player-online-break");
    if (!playerOnline || !playerOnlineBreak) return;

    playerOnline.remove();
    playerOnlineBreak.remove();
}

function setOnline() {
    const container = document.getElementById("teaser-landing");
    const serverStatus = document.getElementById("server-status");
    const serverStatusContainer = document.getElementById("server-status-container");
    if (!container || !serverStatus || !serverStatusContainer) return;

    serverStatus.className = "status-online";
    serverStatus.textContent = "Online";

    const nrOnline = document.createElement("span");
    nrOnline.className = "nr-player-online";
    nrOnline.id = "nr-player-online";
    nrOnline.textContent = "0";

    const playerOnline = document.createElement("span");
    playerOnline.textContent = "Player online: ";
    playerOnline.id = "player-online";
    playerOnline.appendChild(nrOnline);

    const playerOnlineBreak = document.createElement("br");
    playerOnlineBreak.id = "player-online-break";

    container.insertBefore(playerOnlineBreak, serverStatusContainer);
    container.insertBefore(playerOnline, playerOnlineBreak);
}
