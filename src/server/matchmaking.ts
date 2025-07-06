import {z} from "zod/v4";
import {DeckSchema, type Deck} from "../types/socket.js";
import type {Request, Response} from "express";
import type SocketHandler  from "./socket.js";
import type {SocketData} from "../types/socket.js";

interface QueueItem {
    id: string;
    username: string;
    deck: Deck;
    resolve: (data: {me: SocketData; opponent: SocketData}) => void;
}

class Queue {
    private items: QueueItem[];

    constructor() {
        this.items = [];
    }

    enqueue(item: QueueItem) {
        this.items.push(item);
    }

    dequeue(): QueueItem | undefined {
        return this.items.shift();
    }

    size(): number {
        return this.items.length;
    }

    remove(id: QueueItem["id"]): void {
        this.items = this.items.filter((item) => id !== item.id);
    }

    contains(id: QueueItem["id"]): boolean {
        return this.items.find((item) => item.id === id) !== undefined;
    }
}

const MatchmakingInput = z.union([
    z.object({
        id: z.string(),
        username: z.string(),
        deck:  DeckSchema,
        abort: z.optional(z.literal(false)),
    }),
    z.object({
        abort: z.literal(true),
        id: z.string(),
    }),
]);

export default class MatchmakingHandler {
    private socketHandler: SocketHandler;
    private queue: Queue;

    constructor(socketHandler: SocketHandler) {
        this.socketHandler = socketHandler;
        this.queue = new Queue();
    }

    tryFindMatch() {
        if (this.queue.size() >= 2) {
            const items = [this.queue.dequeue()!, this.queue.dequeue()!];
            const matchId = crypto.randomUUID();

            this.socketHandler.addMatch(matchId, items.map(({id}) => id));

            items.forEach((item, i) => {
                item.resolve({
                    me : {
                        ...item,
                        matchId,
                    },
                    opponent: {
                        ...items[i + 1 % items.length],
                        matchId,
                    },
                });
            });
        }
    }

    async handle(req: Request, res: Response) {
        try {
            const input = MatchmakingInput.parse(req.body);

            if (input.abort === true) {
                if (!this.queue.contains(input.id)) {
                    res.status(400).json({error: "Not in the queue"});
                    return;
                }

                this.queue.remove(input.id);
                res.status(200).json({message: "ok"});
                return;
            }

            if (this.queue.contains(input.id)) {
                res.status(400).json({error: "Already in the queue"});
                return;
            }

            this.queue.enqueue({
                ...input,
                resolve: (data) => res.status(200).json(data),
            });

            this.tryFindMatch();
        } catch (error) {
            res.status(400).json({error});
        }
    }
}
