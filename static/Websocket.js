const socket = new WebSocket(`ws://${Env.BIND}:${Env.WEBSOCKET_PORT}`);

let listenersOnce = [];
const listeners = [{
    event: Events.UPDATE_PLAYER_COUNT,
    listener: updatePlayerCount,
}];

socket.addEventListener("open", () => {
    toggleOnline();
});

socket.addEventListener("close", () => {
    toggleOnline();
});

socket.addEventListener("message", (event) => {
    try {
        const data = JSON.parse(event.data);
        listenersOnce = listenersOnce.filter((listener) => handleListener(listener, data));
        listeners.forEach((listener) => handleListener(listener, data));
    } catch (e) {
        console.error(e);
    }
});

function handleListener({event, listener}, {type, data}) {
    if (event !== type) return true;
    listener(data);

    return false;
}

function send(type, data) {
    socket.send(JSON.stringify({
        type,
        data,
    }));
}

function toggleClass(element, className) {
    if (element.className.includes(" " + className)) {
        element.className = element.className.replace(" " + className, "");
    } else {
        element.className += " " + className;
    }
}

function updatePlayerCount(data) {
    const nrPlayerOnline = document.getElementById("player-count");
    if (!nrPlayerOnline) return;

    nrPlayerOnline.textContent = data.count;
}

function toggleOnline() {
    const serverStatus = document.getElementById("server-status");
    if (!serverStatus) return;

    toggleClass(serverStatus, "online");
}

function listenOnce(event, listener) {
    listenersOnce.push({event, listener});
}

function addListener(event, listener) {
    listeners.push({event, listener});
}
