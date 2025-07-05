import type {Play, ServerSideSocket} from "./socket";

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

        await this.redraw();
    }

    setListeners(socket: ServerSideSocket) {
        socket.on("disconnect", this.handleDisconnect.bind(this));
        socket.on("play", this.handlePlay(socket).bind(this));
        socket.on("ended", this.handleEnded.bind(this));
    }

    async redraw() {
        const otherReadyListeners: (() => void)[] = [];
        return await Promise.all(this.sockets.map((socket) => new Promise<void>((resolve) => {
            socket.emit("redraw", (onOtherReady) => otherReadyListeners.push(onOtherReady), resolve)
        }))).then(() => otherReadyListeners.forEach((callback) => callback()));
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
