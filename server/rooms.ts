import Clients from "./clients.ts";
import Events from "../static/Events.js";

type Room = Record<string, boolean>;

export default class Rooms {
    private clients: Clients;
    private rooms: Record<string, Room>;

    constructor(clients: Clients) {
        this.clients = clients;
        this.rooms = {};
    }

    public create(players: string[]) {
        const id = crypto.randomUUID();
        this.rooms[id] = players.reduce<Room>((acc, player) => {
            acc[player] = false;
            return acc;
        }, {});

        players.forEach((player) => this.clients.send(player, Events.MATCHMAKING_FOUND, {id}));
    }

    private getClientRoom(id: string): Room|null {
        return Object.values(this.rooms).find((room) => id in room) ?? null;
    }

    private getRoomId(room: Room): string|null {
        return Object.entries((this.rooms)).find(([, r]) => r === room)?.[0] ?? null;
    }

    private removeRoom(room: Room) {
        const roomId = this.getRoomId(room);
        if (!roomId) return;

        Reflect.deleteProperty(this.rooms, roomId);
    }

    public leave(id: string) {
        const room = this.getClientRoom(id);
        if (!room) return;

        const opponent = Object.keys(room).find((player) => player !== id);
        if (opponent) {
            this.clients.send(opponent, Events.MATCH_WON, null);
        }

        this.removeRoom(room);
    }

    public setReady(id: string) {
        const room = this.getClientRoom(id);
        if (!room) return;

        room[id] = true;

        if (Object.values(room).every(Boolean)) {
            // TODO
        }
    }
}
