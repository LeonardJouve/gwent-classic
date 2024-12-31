import Events from "./events.ts";
import Clients from "./clients.ts";
import Matchmaking from "./matchmaking.ts";
import Rooms from "./rooms.ts";

const clients = new Clients();
const rooms = new Rooms(clients);
const matchmaking = new Matchmaking(rooms);

Deno.serve({port: Number(Deno.env.get("WEBSOCKET_PORT"))}, (req) => {
    if (req.headers.get("upgrade") != "websocket") {
        return new Response(null, {status: 501});
    }

    const {socket, response} = Deno.upgradeWebSocket(req);
    let id: string|null = null;

    socket.addEventListener("open", () => {
        id = clients.add(socket);
    });

    socket.addEventListener("close", () => {
        if (!id) return;

        matchmaking.unqueue(id);
        rooms.leave(id);
        clients.remove(id);
    });

    socket.addEventListener("message", (event) => {
        if (!id) return;

        try {
            const {type, data} = JSON.parse(event.data);
            switch (type) {
            case Events.RENAME:
                clients.rename(id, data.name);
                break;
            case Events.UPDATE_PLAYER_COUNT:
                console.log(event.data);
                break;
            case Events.MATCHMAKING_QUEUE:
                if (rooms.isClientInRoom(id)) break;
                matchmaking.queue(id);
                break;
            case Events.MATCHMAKING_UNQUEUE:
                matchmaking.unqueue(id);
                break;
            case Events.ROOM_READY:
                rooms.setReady(id);
                break;
            }
        } catch (e) {}
    });

    return response;
});

Deno.serve({port: Number(Deno.env.get("WEBSERVER_PORT"))}, async () => new Response(await Deno.readFile("client.html")));
