import {z} from "zod/v4";
import type {Request, Response} from "express";
import type SocketHandler  from "./socket";
import type {Deck, SocketData} from "./socket";

interface QueueItem {
    id: string;
    username: string;
    deck: Deck;
    resolve: (data: SocketData) => void;
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

const Input = z.union([
    z.object({
        id: z.string(),
        username: z.string(),
        deck:  z.object({
            faction: z.string(),
            leader: z.number(),
            cards: z.array(z.object({
                index: z.number(),
                count: z.number(),
            })),
        }),
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
    }

    tryFindMatch() {
        if (this.queue.size() >= 2) {
            const items = [this.queue.dequeue()!, this.queue.dequeue()!];
            const matchId = crypto.randomUUID();

            this.socketHandler.addMatch(matchId, items.map(({id}) => id));

            items.forEach((item) => {
                item.resolve({
                    ...item,
                    matchId,
                });
            });
        }
    }

    async handle(req: Request, res: Response) {
        try {
            const input = Input.parse(req.body);

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
