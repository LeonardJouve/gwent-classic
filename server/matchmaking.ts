import Rooms from "./rooms.ts";

export default class Matchmaking {
    private rooms: Rooms;
    private userInQueue: string|null;

    constructor(rooms: Rooms) {
        this.rooms = rooms;
        this.userInQueue = null;
    }

    public queue(id: string) {
        if (this.userInQueue === null) {
            this.userInQueue = id;
            return;
        }

        if (this.userInQueue === id) {
            this.unqueue(id);
            return;
        }

        this.rooms.create(this.userInQueue, id);
        this.userInQueue = null;
    }

    public unqueue(id: string) {
        if (this.userInQueue !== id) return;

        this.userInQueue = null;
    }
}
