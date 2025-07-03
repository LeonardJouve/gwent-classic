import {type CardData } from "./cards";
import {type CardId } from "./deck";
import Player from "./player";

type PlayerData = {
    faction: string;
    leader: CardData;
    cards: CardId[];
}

export default class Players {
    static curr: Players;
    public player_me: Player;
    public player_op: Player;

    constructor() {
        this.player_me = null as unknown as Player;
        this.player_op = null as unknown as Player;
        Players.setCurrent(this);
    }

    static setCurrent(curr: Players) {
        this.curr = curr;
    }

    static setPlayers(me: PlayerData, op: PlayerData) {
        if (!Players.curr) new Players();
        Players.curr.player_me = new Player(0, "Player 1", me);
        Players.curr.player_me = new Player(1, "Player 2", op);
    }
}
