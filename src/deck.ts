import Board from "./board";
import Card from "./card";
import CardContainer from "./card_container";
import card_dict, {type CardData} from "./cards";
import {iconURL} from "./utils";
import type Player from "./player";
import type Hand from "./hand";
import type HandAI from "./hand_ai";
import Players from "./players";

export type CardId = {
    count: number;
    index: number;
};

// Contains a randomized set of cards to be drawn from
export default class Deck extends CardContainer {
    public faction: string;
    private counter: HTMLElement;

	constructor(faction: string, elem: HTMLElement){
		super(elem);
		this.faction = faction;

		this.counter = document.createElement("div");
		this.counter.classList = "deck-counter center";
		this.counter.appendChild( document.createTextNode(String(this.cards.length)) );
		this.elem?.appendChild(this.counter);
	}

	// Creates duplicates of cards with a count of more than one, then initializes deck
	initializeFromID(card_id_list: CardId[], player: Player){
		this.initialize( card_id_list.reduce<CardData[]>((a,c) => a.concat(clone(c.count, card_dict[c.index])), []), player);
		function clone(n: number, elem: CardData) {
            const a: CardData[] = [];
            for (let  i=0; i<n; ++i) a.push(elem);
            return a;
        }
	}

	// Populates a this deck with a list of card data and associated those cards with the owner of this deck.
	initialize(card_data_list: CardData[], player: Player){
		for (let i=0; i<card_data_list.length; ++i) {
			let card = new Card(card_data_list[i], player);
			card.holder = player;
			this.addCardRandom(card);
			this.addCardElement();
		}
		this.resize();
	}

	// Override
	addCard(card: Card){
		this.addCardRandom(card);
		this.addCardElement();
		this.resize();
	}

	// Sends the top card to the passed hand
	async draw(hand: Hand|HandAI){
		if (hand === Players.curr.player_op.hand)
			hand.addCard(this.removeCard(0, undefined));
		else
			await Board.curr.toHand(this.cards[0], this);
	}

	// Draws a card and sends it to the container before adding a card from the container back to the deck.
	swap(container: CardContainer, card: Card){
		container.addCard(this.removeCard(0, undefined));
		this.addCard(card);
	}

	// Override
	addCardElement() {
		let elem = document.createElement("div");
		elem.classList.add("deck-card");
		elem.style.backgroundImage = iconURL("deck_back_" + this.faction, "jpg");
		this.setCardOffset(elem, this.cards.length-1);
		this.elem?.insertBefore(elem, this.counter);
	}

	// Override
	removeCardElement(){
		const childElem = this.elem?.removeChild(this.elem.children[this.cards.length]) as HTMLElement;
        childElem.style.left = "";
	}

	// Offsets the card element in the deck
	setCardOffset(elem: HTMLElement, n: number){
		elem.style.left =  -0.03 * n +"vw";
	}

	// Override
	resize(){
		this.counter.innerHTML = String(this.cards.length);
		this.setCardOffset(this.counter, this.cards.length);
	}

	// Override
	reset() {
		super.reset();
		this.elem?.appendChild(this.counter);
	}
}
