import ability_dict, {type Ability} from "./abilities";
import Board from "./board";
import ClientSocket from "./client_socket";
import factions from "./factions";
import type Player from "./player";
import Players from "./players";
import UI from "./ui";
import {fadeIn} from "./utils";
import Weather from "./weather";

interface RoundResult {
    winner: Player|null;
    score_me: number;
    score_op: number;
}

type Effect = () => Promise<boolean>;

export default class Game {
	private endScreen: HTMLElement;
    private customize_elem: HTMLButtonElement;
    private replay_elem: HTMLButtonElement;
    public firstPlayer?: Player;
    public currPlayer: Player|null;
    public gameStart: Effect[];
    public roundStart: Effect[];
    public roundEnd: Effect[];
    public turnStart: Effect[];
    public turnEnd: Effect[];
    public roundCount: number;
    public roundHistory: RoundResult[];
    public randomRespawn: boolean;
    public doubleSpyPower: boolean;
    static curr: Game;

    constructor() {
        this.currPlayer = null;
		this.gameStart = [];
		this.roundStart = [];
		this.roundEnd = [];
		this.turnStart = [];
		this.turnEnd = [];
		this.roundCount = 0;
		this.roundHistory = [];
		this.randomRespawn = false;
		this.doubleSpyPower = false;

        this.endScreen = document.getElementById("end-screen") as HTMLElement;
        const buttons = this.endScreen.getElementsByTagName("button");
		this.customize_elem = buttons[0];
		this.replay_elem = buttons[1];
		this.customize_elem.addEventListener("click", () => this.returnToCustomization(), false);
		this.replay_elem.addEventListener("click", () => this.restartGame(), false);
		this.reset();
	}

	reset() {
		this.firstPlayer;
		this.currPlayer = null;

		this.gameStart = [];
		this.roundStart = [];
		this.roundEnd = [];
		this.turnStart = [];
		this.turnEnd = [];

		this.roundCount = 0;
		this.roundHistory = [];

		this.randomRespawn = false;
		this.doubleSpyPower = false;

		Weather.curr.reset();
		Board.curr.row.forEach(r => r.reset());
        Game.setCurrent(this);
	}

    static setCurrent(curr: Game) {
        this.curr = curr;
    }

	// Sets up player faction abilities and psasive leader abilities
	initPlayers(p1: Player, p2: Player){
		const l1 = ability_dict[p1.leader.abilities[0]];
		const l2 = ability_dict[p2.leader.abilities[0]];
		if (l1 === ability_dict["emhyr_whiteflame"] || l2 === ability_dict["emhyr_whiteflame"]){
			p1.disableLeader();
			p2.disableLeader();
		} else {
			initLeader(p1, l1);
			initLeader(p2, l2);
		}
		if (p1.deck.faction === p2.deck.faction && p1.deck.faction === "scoiatael")
			return;
		initFaction(p1);
		initFaction(p2);

		function initLeader(player: Player, leader: Ability){
			if (leader.placed)
				leader.placed(player.leader);
            // @ts-expect-error WTF is this
			Object.keys(leader).filter(key => Game.curr[key]).map(key => Game.curr[key].push(leader[key]));
		}

		function initFaction(player: Player){
			if (factions[player.deck.faction] && factions[player.deck.faction].factionAbility)
				factions[player.deck.faction].factionAbility?.(player);
		}
	}

	// Sets initializes player abilities, player hands and redraw
	async startGame() {
		UI.curr.toggleMusic_elem.classList.remove("music-customization");
		this.initPlayers(Players.curr.player_me, Players.curr.player_op);
		await Promise.all([...Array(10).keys()].map( async () => {
			await Players.curr.player_me.deck.draw(Players.curr.player_me.hand);
			await Players.curr.player_op.deck.draw(Players.curr.player_op.hand);
		}));

		await this.runEffects(this.gameStart);
		// if (!this.firstPlayer)
		// 	this.firstPlayer = await this.coinToss();
		// this.initialRedraw();
	}

	// Simulated coin toss to determine who starts game
	async coinToss(){
		this.firstPlayer = (Math.random() < 0.5) ? Players.curr.player_me : Players.curr.player_op;
		await UI.curr.notification(this.firstPlayer.tag + "-coin", 1200);
		return this.firstPlayer;
	}

	// Allows the player to swap out up to two cards from their iniitial hand
	async initialRedraw(){
		for (let i=0; i< 2; i++)
			Players.curr.player_op.controller.redraw();
		await UI.curr.queueCarousel(Players.curr.player_me.hand, 2, async (c, i) => await Players.curr.player_me.deck.swap(c, c.removeCard(i)), c => true, true, true, "Choose up to 2 cards to redraw.");
		UI.curr.enablePlayer(false);
		Game.curr.startRound();
	}

	// Initiates a new round of the game
	async startRound() {
        if (!this.firstPlayer) throw new Error("firstPlayer is undefined");

		this.roundCount++;
		this.currPlayer = (this.roundCount%2 === 0) ? this.firstPlayer : this.firstPlayer.opponent();
		await this.runEffects(this.roundStart);

		if ( !Players.curr.player_me.canPlay() )
			Players.curr.player_me.setPassed(true);
		if ( !Players.curr.player_op.canPlay() )
			Players.curr.player_op.setPassed(true);

		if (Players.curr.player_op.passed && Players.curr.player_me.passed)
			return this.endRound();

		if (this.currPlayer.passed)
			this.currPlayer = this.currPlayer.opponent();

		await UI.curr.notification("round-start", 1200);
		if (this.currPlayer.opponent().passed)
			await UI.curr.notification(this.currPlayer.tag + "-turn", 1200);

		this.startTurn();
	}

	// Starts a new turn. Enables client interraction in client's turn.
	async startTurn() {
        if (!this.currPlayer) throw new Error("currPlayer is null")

		await this.runEffects(this.turnStart);
		if (!this.currPlayer.opponent().passed){
			this.currPlayer = this.currPlayer.opponent();
			await UI.curr.notification(this.currPlayer.tag + "-turn", 1200);
		}
		UI.curr.enablePlayer(this.currPlayer === Players.curr.player_me);
		this.currPlayer.startTurn();
	}

	// Ends the current turn and may end round. Disables client interraction in client's turn.
	async endTurn() {
		if (!this.currPlayer) throw new Error("currPlayer is null");

        if (this.currPlayer === Players.curr.player_me)
			UI.curr.enablePlayer(false);
		await this.runEffects(this.turnEnd);
		if (this.currPlayer.passed)
			await UI.curr.notification(this.currPlayer.tag + "-pass", 1200);
		if (Players.curr.player_op.passed && Players.curr.player_me.passed)
			this.endRound();
		else
			this.startTurn();
	}

	// Ends the round and may end the game. Determines final scores and the round winner.
	async endRound() {
		let dif = Players.curr.player_me.total - Players.curr.player_op.total;
		if (dif === 0) {
			const nilf_me = Players.curr.player_me.deck.faction === "nilfgaard", nilf_op = Players.curr.player_op.deck.faction === "nilfgaard";
			dif = Number(nilf_me) ^ Number(nilf_op) ? nilf_me ? 1 : -1 : 0;
		}
		const winner = dif > 0 ? Players.curr.player_me : dif < 0 ? Players.curr.player_op : null;
		const verdict = {winner: winner, score_me: Players.curr.player_me.total, score_op: Players.curr.player_op.total}
		this.roundHistory.push(verdict);

		await this.runEffects(this.roundEnd);

		Board.curr.row.forEach( row => row.clear() );
		Weather.curr.clearWeather();

		Players.curr.player_me.endRound( dif > 0);
		Players.curr.player_op.endRound( dif < 0);

		if (dif > 0)
			await UI.curr.notification("win-round", 1200);
		else if (dif < 0)
			await UI.curr.notification("lose-round", 1200);
		else
			await UI.curr.notification("draw-round", 1200);

		if (Players.curr.player_me.health === 0 || Players.curr.player_op.health === 0)
			this.endGame();
		else
			this.startRound();
	}

	// Sets up and displays the end-game screen
	async endGame() {
		const rows = this.endScreen.getElementsByTagName("tr");
		rows[1].children[0].innerHTML = Players.curr.player_me.name;
		rows[2].children[0].innerHTML = Players.curr.player_op.name;

		for (let i=1; i<4; ++i) {
			const round = this.roundHistory[i-1];
			const meScoreContainer = rows[1].children[i] as HTMLElement;
            meScoreContainer.innerHTML = round ? String(round.score_me) : "0";
            meScoreContainer.style.color = round && round.winner === Players.curr.player_me ? "goldenrod" : "";

            const opScoreContainer = rows[2].children[i] as HTMLElement;
            opScoreContainer.innerHTML = round ? String(round.score_op) : "0";
            opScoreContainer.style.color = round && round.winner === Players.curr.player_op ? "goldenrod" : "";
		}

		this.endScreen.children[0].className = "";
		if (Players.curr.player_op.health <= 0 && Players.curr.player_me.health <= 0) {
			this.endScreen.getElementsByTagName("p")[0].classList.remove("hide");
			this.endScreen.children[0].classList.add("end-draw");
		} else if (Players.curr.player_op.health === 0){
			this.endScreen.children[0].classList.add("end-win");
		} else {
			this.endScreen.children[0].classList.add("end-lose");
		}

		fadeIn(this.endScreen, 300, undefined);
		UI.curr.enablePlayer(true);

        ClientSocket.curr.ended();
	}

	// Returns the client to the deck customization screen
	returnToCustomization(){
		this.reset();
		Players.curr.player_me.reset();
		Players.curr.player_op.reset();
		UI.curr.toggleMusic_elem.classList.add("music-customization");
		this.endScreen.classList.add("hide");
		document.getElementById("deck-customization")?.classList.remove("hide");
	}

	// Restarts the last game with the dame decks
	restartGame(){
		this.reset();
		Players.curr.player_me.reset();
		Players.curr.player_op.reset();
		this.endScreen.classList.add("hide");
		this.startGame();
	}

	// Executes effects in list. If effect returns true, effect is removed.
	async runEffects(effects: Effect[]){
		for (let i=effects.length-1; i>=0; --i){
			const effect = effects[i];
			if (await effect())
				effects.splice(i,1)
		}
	}
}

// Contians information and behavior of a Card
