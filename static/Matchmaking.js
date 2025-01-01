const Events = require("./Events.js");

const socket = new WebSocket("ws://100.91.55.35:2001");

socket.addEventListener("open", () => {
    const container = document.getElementById("teaser-landing");
    const serverStatus = document.getElementById("server-status");
    if (!container || !serverStatus) return;

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

    container.appendChild(playerOnline);
    container.appendChild(playerOnlineBreak);
});

socket.addEventListener("close", () => {
    const serverStatus = document.getElementById("server-status");
    if (!serverStatus) return;

    serverStatus.className = "status-offline";
    serverStatus.textContent = "Offline";

    const playerOnline = document.getElementById("player-online");
    const playerOnlineBreak = document.getElementById("player-online-break");
    if (!playerOnline || !playerOnlineBreak) return;
    playerOnline.remove();
    playerOnlineBreak.remove();
});

socket.addEventListener("message", (event) => {
    try {
        const {type, data} = JSON.parse(event.data);
        switch (type) {
        case Events.UPDATE_PLAYER_COUNT: {
            const nrPlayerOnline = document.getElementById("nr-player-online");
            if (!nrPlayerOnline) break;

            nrPlayerOnline.textContent = data.count;
            break;
        }}
    } catch (e) {
        console.error(e);
    }
});
