import Controller from "./controller";
import ControllerAI from "./controller_ai";
import Hand from "./hand";
import HandAI from "./hand_ai";
import Grave from "./grave";
import Deck from "./deck";
import Card from "./card";
import factions from "./factions";
import {iconURL, sleep} from "./utils";
import ability_dict from "./abilities";
import Board from "./board";
import Players from "./players";
import UI from "./ui";
import Game from "./game";
import type Row from "./row";
import {type CardData} from "./cards";

export interface DeckData {
    faction: string;
    leader: CardData;
    cards: {
        index: number;
        count:number;
    }[];
}

export default class Player {
    private id: number;
    public tag: "me"|"op";
    public controller: Controller|ControllerAI;
    public hand: HandAI|Hand;
    public grave: Grave;
    public deck: Deck;
    private deck_data: DeckData;
    public leader: Card;
    private elem_leader: HTMLElement;
    public name: string;
    public passed: boolean;
    public total: number;
    public health: number;
    public handsize: number;
    public winning: boolean;
    public leaderAvailable: boolean;

	constructor(id: number, name: string, deck: DeckData) {
		this.name = "";
        this.passed = false;
        this.total = 0;
        this.health = 0;
        this.handsize = 0;
        this.winning = false;
        this.leaderAvailable = false;

        this.id = id;
		this.tag = (id === 0) ? "me" : "op";
		this.controller = (id === 0) ? new Controller() : new ControllerAI(this);

		this.hand = (id === 0) ? new Hand(document.getElementById("hand-row") as HTMLElement) : new HandAI();
		this.grave =  new Grave( document.getElementById("grave-" + this.tag) as HTMLElement);
		this.deck = new Deck(deck.faction, document.getElementById("deck-" + this.tag) as HTMLElement);
		this.deck_data = deck;

		this.leader = new Card(deck.leader, this);
		this.elem_leader = document.getElementById("leader-" + this.tag) as HTMLElement;
		this.elem_leader.children[0].appendChild( this.leader.elem );

		this.reset();

		this.name = name;
        const nameContainer = document.getElementById("name-" + this.tag);
        if (nameContainer) nameContainer.innerHTML = name;

		const deckNameContainer = document.getElementById("deck-name-" +this.tag);
        if (deckNameContainer) deckNameContainer.innerHTML = factions[deck.faction].name;

        document.getElementById("stats-" + this.tag)?.getElementsByClassName("profile-img")[0].children[0].children[0];
		const x = document.querySelector("#stats-" +this.tag+ " .profile-img > div > div");
		if (x && x instanceof HTMLElement) x.style.backgroundImage = iconURL("deck_shield_" + deck.faction);
	}

	// Sets default values
	reset(){
		this.grave.reset();
		this.hand.reset();
		this.deck.reset();
		this.deck.initializeFromID(this.deck_data.cards, this);

		this.health = 2;
		this.total = 0;
		this.passed = false;
		this.handsize = 10;
		this.winning = false;

		this.enableLeader();
		this.setPassed(false);

        let gem = document.getElementById("gem1-" +this.tag) as HTMLElement;
		gem.classList.add("gem-on");
		gem = document.getElementById("gem2-" +this.tag) as HTMLElement;
        gem.classList.add("gem-on");
	}

	// Returns the opponent Player
	opponent(): Player {
		return Board.curr.opponent(this);
	}

	// Updates the player's total score and notifies the gamee
	updateTotal(n: number){
		this.total += n;
		const scoreContainer = document.getElementById("score-total-" + this.tag) as HTMLElement;
        scoreContainer.children[0].innerHTML = String(this.total);
		Board.curr.updateLeader();
	}

	// Puts the player in the winning state
	setWinning(isWinning: boolean) {
		if (Number(this.winning) ^ Number(isWinning)) {
			const scoreContainer = document.getElementById("score-total-" + this.tag) as HTMLElement;
            scoreContainer.classList.toggle("score-leader");
        }
		this.winning = isWinning;
	}

	// Puts the player in the passed state
	setPassed(hasPassed: boolean) {
		if (Number(this.passed) ^ Number(hasPassed)) {
			const passedElement = document.getElementById("passed-" + this.tag) as HTMLElement;
            passedElement.classList.toggle("passed");
        }
		this.passed = hasPassed;
	}

	// Sets up board for turn
	async startTurn(){
		const statsElement = document.getElementById("stats-" + this.tag) as HTMLElement;
        statsElement.classList.add("current-turn");
		if (this.leaderAvailable)
			this.elem_leader.children[1].classList.remove("hide");

		if (this === Players.curr.player_me) {
			const passButton = document.getElementById("pass-button") as HTMLElement;
            passButton.classList.remove("noclick");
		}

		if (this.controller instanceof ControllerAI) {
			await this.controller.startTurn(this);
		}
	}

	// Passes the round and ends the turn
	passRound(){
		this.setPassed(true);
		this.endTurn();
	}

	// Plays a scorch card
	async playScorch(card: Card){
		await this.playCardAction(card, async () => await ability_dict["scorch"].activated?.(card));
	}

	// Plays a card to a specific row
	async playCardToRow(card: Card, row: Row){
		await this.playCardAction(card, async () => await Board.curr.moveTo(card, row, this.hand));
	}

	// Plays a card to the board
	async playCard(card: Card){
		await this.playCardAction(card, async () => await card.autoplay(this.hand));
	}

	// Shows a preview of the card being played, plays it to the board and ends the turn
	async playCardAction(card: Card, action: () => Promise<void>){
		UI.curr.showPreviewVisuals(card);
		await sleep(1000);
		UI.curr.hidePreview();
		await action();
		this.endTurn();
	}

	// Handles end of turn visuals and behavior the notifies the game
	endTurn(){
		if (!this.passed && !this.canPlay())
			this.setPassed(true);
		if (this === Players.curr.player_me){
			const passButton = document.getElementById("pass-button") as HTMLElement;
            passButton.classList.add("noclick");
		}
		const statsElement = document.getElementById("stats-" + this.tag) as HTMLElement;
        statsElement.classList.remove("current-turn");
		this.elem_leader.children[1].classList.add("hide");
		Game.curr.endTurn()
	}

	// Tells the the Player if it won the round. May damage health.
	endRound(win: boolean){
		if (!win) {
			if (this.health < 1)
				return;
			const gemElement = document.getElementById("gem" + this.health + "-" +this.tag) as HTMLElement;
            gemElement.classList.remove("gem-on");
			this.health--;
		}
		this.setPassed(false);
		this.setWinning(false);
	}

	// Returns true if the Player can make any action other than passing
	canPlay() {
		return this.hand.cards.length > 0 || this.leaderAvailable;
	}

	// Use a leader's Activate ability, then disable the leader
	async activateLeader() {
		UI.curr.showPreviewVisuals(this.leader);
		await sleep(1500);
		UI.curr.hidePreview();
		await this.leader.activated[0](this.leader, this);
		this.disableLeader();
		this.endTurn();
	}

	// Disable access to leader ability and toggles leader visuals to off state
	disableLeader(){
		this.leaderAvailable = false;
		const elem = this.elem_leader.cloneNode(true) as HTMLElement;
		this.elem_leader.parentNode?.replaceChild(elem, this.elem_leader);
		this.elem_leader = elem;
		this.elem_leader.children[0].classList.add("fade");
		this.elem_leader.children[1].classList.add("hide");
		this.elem_leader.addEventListener("click", async () => await UI.curr.viewCard(this.leader), false);
	}

	// Enable access to leader ability and toggles leader visuals to on state
	enableLeader() {
		this.leaderAvailable = this.leader.activated.length > 0;
		const elem = this.elem_leader.cloneNode(true) as HTMLElement;
		this.elem_leader.parentNode?.replaceChild(elem, this.elem_leader);
		this.elem_leader = elem;
		this.elem_leader.children[0].classList.remove("fade");
		this.elem_leader.children[1].classList.remove("hide");

		if (this.id === 0 && this.leader.activated.length > 0){
			this.elem_leader.addEventListener("click",
				async () => await UI.curr.viewCard(this.leader, async () => await this.activateLeader()),
				false);
		} else {
			this.elem_leader.addEventListener("click", async () => await UI.curr.viewCard(this.leader), false);
		}

		// TODO set crown color
	}

}

// Handles the adding, removing and formatting of cards in a container
