import {z} from "zod/v4";
import type {Socket as ServerSocket} from "socket.io";
import type {Socket as ClientSocket} from "socket.io-client";

export const DeckSchema = z.object({
    faction: z.string(),
    leader: z.number(),
    cards: z.array(z.object({
        index: z.number(),
        count: z.number(),
    })),
});

export type Deck = z.infer<typeof DeckSchema>;

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
