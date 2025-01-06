import Events from "../static/Events.js";

type Client = {
    socket: WebSocket|null;
    name: string;
};

export default class Clients {
    private clients: Record<string, Client>;

    constructor() {
        this.clients = {};
    }

    public add(socket: WebSocket): string {
        const id = crypto.randomUUID();

        this.clients[id] = {
            socket,
            name: this.clients[id]?.name ?? "Guest",
        };

        this.updatePlayerCount();

        return id;
    }

    public remove(id: string) {
        this.clients[id].socket = null;
        this.updatePlayerCount();
    }

    private updatePlayerCount() {
        this.broadcast(Events.UPDATE_PLAYER_COUNT, {count: Object.values(this.clients).filter(({socket}) => socket !== null).length});
    }

    public rename(id: string, name: string) {
        const client = this.clients[id];
        if (!client) return;

        client.name = name;
    }

    public broadcast(type: string, data: Record<any, any>|null) {
        Object.keys(this.clients).forEach((client) => this.send(client, type, data));
    }

    public send(id: string, type: string, data: Record<any, any>|null) {
        const client = this.clients[id];
        if (!client) return;

        client.socket?.send(JSON.stringify({
            type,
            data,
        }));
    }
}
