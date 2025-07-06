import type {Play, ServerSideSocket} from "../types/socket.js";

export default class Match {
    private sockets: ServerSideSocket[];
    private playerIds: string[];
    private onClose: () => void;

    constructor(playerIds: string[], onClose: () => void) {
        this.playerIds = [...playerIds];
        this.sockets = [];
        this.onClose = onClose;
    }

    addSocket(socket: ServerSideSocket) {
        if (this.sockets.length >= 2 || !this.playerIds.includes(socket.data.id)) return;

        this.setListeners(socket);
        this.sockets.push(socket);
        this.tryStart();
    }

    canStart(): boolean {
        return this.sockets.length === 2;
    }

    async tryStart() {
        if (!this.canStart()) return;

        let firstPlayerId = this.sockets[Math.floor(Math.random() * this.sockets.length)].data.id;

        const scoiataels = this.sockets.filter((socket) => socket.data.deck.faction === "scoiatael");
        if (scoiataels.length === 1) {
            firstPlayerId = await new Promise<string>((resolve) => scoiataels[0].emit("ask_start", (start) => {
                resolve(start ? scoiataels[0].data.id : this.sockets.find((socket) => socket.data.deck.faction !== "scoiatael")!.data.id);
            }));
        }

        this.sockets.forEach((socket) => socket.emit("start", firstPlayerId));

        await this.redraw();

        this.sockets.forEach((socket) => socket.emit("ready"));
    }

    setListeners(socket: ServerSideSocket) {
        socket.on("disconnect", this.handleDisconnect.bind(this));
        socket.on("play", this.handlePlay(socket).bind(this));
        socket.on("ended", this.handleEnded.bind(this));
    }

    async redraw() {
        return await Promise.all(this.sockets.map((socket) => new Promise<void>((resolve) => {
            socket.emit("redraw", resolve)
        })));
    }

    handleEnded() {
        this.sockets.forEach((socket) => socket.disconnect());
        this.onClose();
    }

    handlePlay(socket: ServerSideSocket) {
        return (play: Play) => this.sockets.find(({data}) => data.id !== socket.data.id)?.emit("played", play);
    }

    handleDisconnect() {
        // TODO
    }
}
