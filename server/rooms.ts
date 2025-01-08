import Clients from "./clients.ts";
import events from "./events.ts";


type Room = Record<string, boolean>;

enum Faction {
    NORTH,
};

type Opponent = {
    name: string;
    deck: Faction;
};

export default class Rooms {
    private clients: Clients;
    private rooms: Room[];

    constructor(clients: Clients) {
        this.clients = clients;
        this.rooms = [];
    }

    public create(players: string[]) {
        this.rooms.push(players.reduce<Room>((acc, player) => {
            acc[player] = false;
            return acc;
        }, {}));

        players.forEach((player) => this.clients.send(player, events.MATCHMAKING_FOUND, null));
    }

    private getClientRoom(id: string): Room|null {
        return this.rooms.find((room) => id in room) ?? null;
    }

    private removeRoom(room: Room) {
        this.rooms.splice(this.rooms.findIndex((r) => r === room), 1);
    }

    public leave(id: string) {
        const room = this.getClientRoom(id);
        if (!room) return;

        const opponent = Object.keys(room).find((player) => player !== id);
        if (opponent) {
            this.clients.send(opponent, events.MATCH_WON, null);
        }

        this.removeRoom(room);
    }

    public setReady(id: string) {
        const room = this.getClientRoom(id);
        if (!room) return;

        room[id] = true;

        if (Object.values(room).every(Boolean)) {
            // TODO: send opponent as data
            Object.keys(room).forEach((player) => this.clients.send(player, events.MATCH_BEGIN, null));
        }
    }
}
