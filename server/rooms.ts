import Battles from "./battles.ts";
import Clients from "./clients.ts";
import Events from "./events.ts";

type Room = Record<string, boolean>;

export default class Rooms {
    private clients: Clients;
    private battles: Battles;
    private rooms: Room[];

    constructor(clients: Clients, battles: Battles) {
        this.clients = clients;
        this.battles = battles;
        this.rooms = [];
    }

    public create(firstPlayer: string, secondPlayer: string) {
        this.rooms.push({
            [firstPlayer]: false,
            [secondPlayer]: false,
        });

        this.clients.send(firstPlayer, Events.MATCHMAKING_FOUND, null);
        this.clients.send(secondPlayer, Events.MATCHMAKING_FOUND, null);
    }

    public isClientInRoom(id: string): boolean {
        return this.rooms.some((room) => id in room);
    }

    private getClientRoom(id: string): Room|null {
        return this.rooms.find((room) => id in room) ?? null;
    }

    private removeRoom(room: Room) {
        this.rooms.splice(this.rooms.indexOf(room), 1);
    }

    public leave(id: string) {
        const room = this.getClientRoom(id);
        if (!room) return;

        Object.keys(room).forEach((player) => {
            if (player === id) return;

            this.clients.send(player, Events.MATCH_WON, null);
        });

        this.removeRoom(room);
    }

    public setReady(id: string) {
        const room = this.getClientRoom(id);
        if (!room) return;

        room[id] = true;

        if (Object.values(room).every(Boolean)) {
            const [firstPlayer, secondPlayer] = Object.keys(room);
            this.battles.create(firstPlayer, secondPlayer);
        }

        this.removeRoom(room);
    }
}
