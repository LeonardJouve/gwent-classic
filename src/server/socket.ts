import type {Server as NodeServer} from "node:http";
import type {Http2SecureServer} from "node:http2";
import {Server} from "socket.io";
import Match from "./match.js";
import type {ClientToServerEvents, ServerToClientEvents, SocketData} from "../types/socket.js";

export default class SocketHandler {
    private matches: Map<string, Match>;
    private io: Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>;

    constructor (server: NodeServer|Http2SecureServer) {
        this.matches = new Map<string, Match>();

        this.io = new Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>(server, {serveClient: false});
        this.handleConnections();
    }

    addMatch(matchId: string, playerIds: string[]) {
        this.matches.set(matchId, new Match(playerIds, () => this.matches.delete(matchId)))
    }

    handleConnections() {
        this.io.on("connection", (socket) => {
            socket.data = {
                id: socket.handshake.auth.id,
                username: socket.handshake.auth.username,
                deck: socket.handshake.auth.deck,
                matchId: socket.handshake.auth.matchId,
            };

            this.matches.get(socket.data.matchId)?.addSocket(socket);
        });
    }
}

