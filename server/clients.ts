import events from "./events.ts";

type Client = {
    socket: WebSocket;
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
            name: "Guest",
        };

        this.updatePlayerCount();

        return id;
    }

    public remove(id: string) {
        Reflect.deleteProperty(this.clients, id);
        this.updatePlayerCount();
    }

    private updatePlayerCount() {
        this.broadcast(events.UPDATE_PLAYER_COUNT, {count: Object.keys(this.clients).length});
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

        client.socket.send(JSON.stringify({
            type,
            data,
        }));
    }
}
