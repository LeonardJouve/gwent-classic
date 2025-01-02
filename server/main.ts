import {serveDir} from "jsr:@std/http/file-server";

import Events from "../static/Events.js";
import Clients from "./clients.ts";
import Matchmaking from "./matchmaking.ts";
import Rooms from "./rooms.ts";

const clients = new Clients();
const rooms = new Rooms(clients);
const matchmaking = new Matchmaking(rooms);

Deno.writeTextFileSync("./static/Env.js", `
window.BIND = "${Deno.env.get("BIND")}";
window.WEBSOCKET_PORT = ${Deno.env.get("WEBSOCKET_PORT")};
`);

Deno.serve({port: Number(Deno.env.get("WEBSOCKET_PORT"))}, (req) => {
    if (req.headers.get("upgrade") != "websocket") {
        return new Response(null, {status: 501});
    }

    const {socket, response} = Deno.upgradeWebSocket(req);
    let id: string|null = null;

    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
        const cookies = Object.fromEntries(cookieHeader.split("; ").map(cookie => cookie.split("=")));
        id = cookies["client_id"];
    }

    socket.addEventListener("open", () => {
        id = clients.add(socket, id);
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
            case Events.MATCHMAKING_QUEUE:
                matchmaking.queue(id);
                break;
            case Events.ROOM_READY:
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
