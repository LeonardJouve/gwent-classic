import Player from "./player";
import Row from "./row";
import {isString, translateTo} from "./utils";
import Weather from "./weather";
import DeckMaker from "./deck_maker";
import CardContainer from "./card_container";
import Card from "./card";

export default class Board {
	private op_score: number;
    private me_score: number;
    public row: Row[];
    static curr: Board;

    constructor() {
		this.op_score = 0;
		this.me_score = 0;
		this.row = [];
		for (let x=0; x<6; ++x) {
			let elem = document.getElementById( (x<3)?"field-op":"field-me" )?.children[x%3] as HTMLElement;
			this.row[x] = new Row(elem);
		}

        Board.setCurrent(this);
	}

    static setCurrent(curr: Board) {
        this.curr = curr;
    }

	// Get the opponent of this Player
	opponent(player: Player): Player {
		return player === DeckMaker.curr.player_me ? DeckMaker.curr.player_op : DeckMaker.curr.player_me;
	}

	// Sends and translates a card from the source to the Deck of the card's holder
	async toDeck(card: Card, source: CardContainer){
		await this.moveTo(card, "deck", source);
	}

	// Sends and translates a card from the source to the Grave of the card's holder
	async toGrave(card: Card, source: CardContainer){
		await this.moveTo(card, "grave", source);
	}

	// Sends and translates a card from the source to the Hand of the card's holder
	async toHand(card: Card, source: CardContainer) {
		await this.moveTo(card, "hand", source);
	}

	// Sends and translates a card from the source to Weather
	async toWeather(card: Card, source: CardContainer) {
		await this.moveTo(card, Weather.curr, source);
	}

	// Sends and translates a card from the source to the Deck of the card's combat row
	async toRow(card: Card, source: CardContainer) {
		let row = (card.row === "agile") ? "close" : card.row ? card.row : "close";
		await this.moveTo(card, row, source);
	}

	// Sends and translates a card from the source to a specified row name or CardContainer
	async moveTo(card: Card, dest: CardContainer|string, source: CardContainer) {
		if (isString(dest))
			dest = this.getRow(card, dest, undefined);
		await translateTo(card, source ? source : undefined, dest);
		await dest.addCard(source ? source.removeCard(card, undefined) : card, undefined);
	}

	// Sends and translates a card from the source to a row name associated with the passed player
	async addCardToRow(card: Card, row_name: string, player: Player, source?: CardContainer) {
		let row = this.getRow(card, row_name, player);
		await translateTo(card, source, row);
		await row.addCard(card);
	}

	// Returns the CardCard associated with the row name that the card would be sent to
	getRow(card: Card, row_name: string, player?: Player): CardContainer {
		player = player ? player : card ? card.holder : DeckMaker.curr.player_me;
		let isMe = player === DeckMaker.curr.player_me;
		let isSpy = card.abilities.includes("spy");
		switch (row_name) {
			case "weather": return Weather.curr; break;
			case "close":  return this.row[ Number(isMe) ^ Number(isSpy) ? 3 : 2];
			case "ranged": return this.row[ Number(isMe) ^ Number(isSpy) ? 4 : 1];
			case "siege":  return this.row[ Number(isMe) ^ Number(isSpy) ? 5 : 0];
			case "grave": return player.grave;
			case "deck": return player.deck;
			case "hand": return player.hand;
			default: throw new Error(card.name + " sent to incorrect row \"" +row_name+ "\" by " +card.holder.name );
		}
	}

	// Updates which player currently is in the lead
	updateLeader() {
		let dif = DeckMaker.curr.player_me.total - DeckMaker.curr.player_op.total;
		DeckMaker.curr.player_me.setWinning(dif > 0);
		DeckMaker.curr.player_op.setWinning(dif < 0);
	}
}
