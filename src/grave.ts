import Card from "./card";
import CardContainer from "./card_container";
import UI from "./ui";
import {isNumber} from "./utils";

// Contians all used cards in the order that they were discarded
export default class Grave extends CardContainer {
	constructor(elem: HTMLElement) {
		super(elem)
		elem.addEventListener("click", () => UI.curr.viewCardsInContainer(this, undefined), false);
	}

	// Override
	addCard(card: Card){
		this.setCardOffset(card, this.cards.length);
		super.addCard(card, this.cards.length);
	}

	// Override
	removeCard(card: Card|number){
		let n = isNumber(card) ? card as number : this.cards.indexOf(card as Card);
		return super.removeCard(card, n);
	}

	// Override
	removeCardElement(card: Card, index: number){
		card.elem.style.left = "";
		super.removeCardElement(card, index);
		for (let i=index; i<this.cards.length; ++i){
//			if (!this.cards[i])
//				console.log(i, index, card, this.cards[i]);
			this.setCardOffset(this.cards[i], i);
		}
	}

	// Offsets the card element in the deck
	setCardOffset(card: Card, n: number){
		card.elem.style.left =  -0.03 * n +"vw";
	}
}
