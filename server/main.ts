import {serveDir} from "jsr:@std/http/file-server";

import Clients from "./clients.ts";
import Matchmaking from "./matchmaking.ts";
import Rooms from "./rooms.ts";
import events from "./events.ts";

const clients = new Clients();
const rooms = new Rooms(clients);
const matchmaking = new Matchmaking(rooms);

Deno.writeTextFileSync("./static/Env.js", `
const Env = {
    BIND: "${Deno.env.get("BIND")}",
    WEBSOCKET_PORT: ${Deno.env.get("WEBSOCKET_PORT")},
};
`);

Deno.writeTextFileSync("./static/Events.js", `
const Events = {
    ${Object.entries(events).map(([key, value]) => `${key}: "${value}",`).join("\n    ")}
};
`);

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
            case events.MATCHMAKING_QUEUE:
                if (data.name) {
                    clients.rename(id, data.name);
                }
                matchmaking.queue(id);
                break;
            case events.MATCH_READY:
                rooms.setReady(id);
                break;
            }
        } catch (e) {
            console.error(e);
        }
    });

    return response;
});

Deno.serve({port: Number(Deno.env.get("WEBSERVER_PORT"))}, async (req) => {
    if (new URL(req.url).pathname === "/") {
        return new Response(null, {
            status: 302,
            headers: {Location: "/index.html"},
        });
    }

    return await serveDir(req, {fsRoot: "./static"});
});
