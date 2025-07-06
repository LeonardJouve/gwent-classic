import Board from "./board";
import card_dict from "./cards";
import Game from "./game";
import Players from "./players";
import type Row from "./row";
import type {ClientSideSocket, Play, SocketData} from "./types/socket";
import UI from "./ui";
import { sleepUntil } from "./utils";

export default class ClientSocket {
    private socketData: SocketData;
    private socket: ClientSideSocket;
    static curr: ClientSocket;

    constructor(socket: ClientSideSocket, socketData: SocketData) {
        this.socket = socket;
        this.socketData = socketData;
        this.setListeners();
        ClientSocket.setCurrent(this);
    }

    static setCurrent(curr: ClientSocket) {
        this.curr = curr;
    }

    setListeners() {
        this.socket.on("redraw", this.handleRedraw.bind(this));
        this.socket.on("played", this.handlePlayed.bind(this));
        this.socket.on("ask_start", this.handleAskStart.bind(this));
        this.socket.on("start", this.handleStart.bind(this));
        this.socket.on("ready", this.handleReady.bind(this));
    }

    handleReady() {
        console.log("ready");
        Game.curr.startRound();
    }

    ended() {
        this.socket.emit("ended");
    }

    play(play: Play) {
        console.log("play", play);
        this.socket.emit("play", play);
    }

    async handleAskStart(callback: (start: boolean) => void) {
        await UI.curr.popup("Go First", () => {
            callback(true);
        }, "Let Opponent Start", () => {
            callback(false);
        }, "Would you like to go first?", "The Scoia'tael faction perk allows you to decide who will get to go first.");
    }

    async handlePlayed(play: Play) {
        console.log("played", play);

        if (play.pass) {
            await Players.curr.player_op.passRound();
            return;
        }

        const card = Players.curr.player_op.deck.findCard((card) => card.name === card_dict[play.card].name);
        if (!card) throw new Error("Could not find played card");

        if (card.row === "leader") {
            await Players.curr.player_op.activateLeader();
            return;
        }

        if (card.name === "Scorch") {
            await Players.curr.player_op.playScorch(card);
            return;
        }

        const row = play.rowName ? Board.curr.getRow(card, play.rowName, Players.curr.player_op) as Row : null;

        if (row) {
            Players.curr.player_op.playCardToRow(card, row);
        } else {
            Players.curr.player_op.playCard(card);
        }
    }

    async handleRedraw(onReady: () => void) {
        await sleepUntil(() => Players.curr.player_me.hand.cards.length > 0);
        console.log("queue carousel");
        await UI.curr.queueCarousel(Players.curr.player_me.hand, 2, async (c, i) => await Players.curr.player_me.deck.swap(c, c.removeCard(i)), c => true, true, true, "Choose up to 2 cards to redraw.");
        onReady();
        console.log("redraw");
        UI.curr.enablePlayer(false);
    }

    handleStart(id: string) {
        Game.curr.firstPlayer = this.socketData.id === id ? Players.curr.player_me : Players.curr.player_op;
        console.log("start", id, this.socketData.id, Game.curr.firstPlayer === Players.curr.player_me);
        Game.curr.startGame();
    }
}
