import {serveDir} from "jsr:@std/http/file-server";

import Events from "../static/Events.js";
import Clients from "./clients.ts";
import Matchmaking from "./matchmaking.ts";
import Rooms from "./rooms.ts";
import Battles from "./battles.ts";

const clients = new Clients();
const battles = new Battles(clients);
const rooms = new Rooms(clients, battles);
const matchmaking = new Matchmaking(rooms);

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
        battles.leave(id);
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
                if (rooms.isClientInRoom(id) || battles.isClientInBattle(id)) break;
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

const env = `
window.BIND = "${Deno.env.get("BIND")}";
window.WEBSOCKET_PORT = ${Deno.env.get("WEBSOCKET_PORT")};
`;

Deno.serve({port: Number(Deno.env.get("WEBSERVER_PORT"))}, async (req) => {
    const url = new URL(req.url);
    switch (url.pathname) {
    case "/":
        return new Response(null, {
            status: 302,
            headers: {Location: "/index.html"},
        });
    case "/Env.js":
        return new Response(env, {headers: { "Content-Type": "application/javascript" }});
    }

    return await serveDir(req, {fsRoot: "./static"});
});
