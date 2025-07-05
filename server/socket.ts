import type {Server as NodeServer} from "node:http";
import type {Http2SecureServer} from "node:http2";
import {Server, type Socket as ServerSocket} from "socket.io";
import {type Socket as ClientSocket} from "socket.io-client";
import Match from "./match";

export interface Deck {
    faction: string;
    leader: number;
    cards: {
        index: number;
        count:number;
    }[];
}

export interface SocketData {
    id: string;
    username: string;
    deck: Deck;
    matchId: string;
}

export interface Play {
    pass: boolean;
    card: number;
    rowName: string|null;
}

export interface ServerToClientEvents {
    redraw: (otherReadyListener: (onOtherReady: () => void) => void, onReady: () => void) => void;
    played: (play: Play) => void;
}

export interface ClientToServerEvents {
    play: (play: Play) => void;
    ended: () => void;
    disconnect: () => void;
}

export type ServerSideSocket = ServerSocket<ClientToServerEvents, ServerToClientEvents, never, SocketData>;
export type ClientSideSocket = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

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

