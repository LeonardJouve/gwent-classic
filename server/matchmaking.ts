import Clients from "./clients.ts";
import Events from "./events.ts";

export default class Matchmaking {
    private clients: Clients;
    private userInQueue: string|null;

    constructor(clients: Clients) {
        this.clients = clients;
        this.userInQueue = null;
    }

    public queue(id: string) {
        if (this.userInQueue == null) {
            this.userInQueue = id;
            return;
        }

        this.clients.send(this.userInQueue, Events.MATCHMAKING_FOUND, {opponentId: id});
        this.clients.send(id, Events.MATCHMAKING_FOUND, {opponentId: this.userInQueue});
        this.userInQueue = null;
    }

    public unqueue(id: string) {
        if (this.userInQueue != id) return;

        this.userInQueue = null;
    }
}
