import Card from "./card";
import {isNumber, randomInt} from "./utils";

export default class CardContainer {
	public elem?: HTMLElement;
    public cards: Card[];

    constructor(elem?: HTMLElement) {
		this.elem = elem;
		this.cards = [];
	}

	// Returns the first card that satisfies the predcicate. Does not modify container.
	findCard(predicate: (card: Card) => boolean){
		for (let i=this.cards.length-1; i>=0; --i)
			if (predicate(this.cards[i]))
				return this.cards[i];
	}

	// Returns a list of cards that satisfy the predicate. Does not modify container.
	findCards(predicate: (card: Card) => boolean){
		return this.cards.filter(predicate);
	}

	// Returns a list of up to n cards that satisfy the predicate. Does not modify container.
	findCardsRandom(predicate: (card: Card) => boolean, n?: number){
		let valid = predicate ? this.cards.filter(predicate) : this.cards;
		if (valid.length === 0)
			return [];
		if (!n || n === 1)
			return [valid[randomInt(valid.length)]];
		let out: Card[] = [];
		for (let i=Math.min(n, valid.length); i>0 ; --i){
			let index = randomInt(valid.length);
			out.push(valid.splice(index,1)[0]);
		}
		return out;
	}

	// Removes and returns a list of cards that satisy the predicate.
	getCards(predicate: (card: Card, i: number) => boolean){
		return this.cards.reduce<number[]>((a,c,i) => ( predicate(c,i)?[i]:[] ).concat(a), []).map( i => this.removeCard(i, undefined));
	}

	// Removes and returns a card that satisfies the predicate.
	getCard(predicate: (card: Card) => boolean) {
		for (let i=this.cards.length-1; i>=0; --i)
			if (predicate(this.cards[i]))
				return this.removeCard(i, undefined);
	}

	// Removes and returns any cards up to n that satisfy the predicate.
	getCardsRandom(predicate: (card: Card) => boolean, n: number) {
		return this.findCardsRandom(predicate, n).map( c => this.removeCard(c, undefined));
	}

	// Adds a card to the container along with its associated HTML element.
	addCard(card: Card, index?: number){
		this.cards.push(card);
		this.addCardElement(card, index?index:0);
		this.resize();
	}

	// Removes a card from the container along with its associated HTML element.
	removeCard(card: Card|number, index?: number){
		if (this.cards.length === 0)
			throw "Cannot draw from empty " + this.constructor.name;
		card = this.cards.splice( isNumber(card)? card as number : this.cards.indexOf(card as Card) , 1)[0];
		this.removeCardElement(card, index?index:0);
		this.resize();
		return card;
	}

	// Adds a card to a pre-sorted CardContainer
	addCardSorted(card: Card){
		let i = this.getSortedIndex(card);
		this.cards.splice(i, 0, card);
		return i;
	}

	// Returns the expected index of a card in a sorted CardContainer
	getSortedIndex(card: Card){
		for (var i=0; i<this.cards.length; ++i)
			if (Card.compare(card, this.cards[i]) < 0)
				break;
		return i;
	}

	// Adds a card to a random index of the CardContainer
	addCardRandom(card: Card){
		this.cards.push(card);
		let index = randomInt(this.cards.length);
		if (index !== this.cards.length-1) {
			let t = this.cards[this.cards.length-1];
			this.cards[this.cards.length-1] = this.cards[index];
			this.cards[index] = t;
		}
		return index;
	}

	// Removes the HTML elemenet associated with the card from this CardContainer
	removeCardElement(card: Card, index: number){
		if (this.elem)
			this.elem.removeChild(card.elem);
	}

	// Adds the HTML elemenet associated with the card to this CardContainer
	addCardElement(card: Card, index: number){
		if (this.elem){
			if (index === this.cards.length)
				this.elem.appendChild(card.elem);
			else
				this.elem.insertBefore(card.elem, this.elem.children[index]);
		}
	}

	// Empty function to be overried by subclasses that resize their content
	resize(){}

	// Modifies the margin of card elements inside a row-like container to stack properly
	resizeCardContainer(overlap_count: number, gap: number, coef: number) {
		if (!this.elem) return;
        let n = this.elem.children.length;
		let param = (n < overlap_count) ?  "" + gap+"vw" : defineCardRowMargin(n, coef);
		let children = this.elem.getElementsByClassName("card") as HTMLCollectionOf<HTMLElement>;
		for (let x of children)
			x.style.marginLeft = x.style.marginRight = param;

		function defineCardRowMargin(n: number, coef = 0){
			return "calc((100% - (4.45vw * " + n + ")) / (2*" +n+ ") - (" +coef+ "vw * " +n+ "))";
		}
	}

	// Allows the row to be clicked
	setSelectable(){
		this.elem?.classList.add("row-selectable");
	}

	// Disallows teh row to be clicked
	clearSelectable() {
		this.elem?.classList.remove("row-selectable");
		for (let card of this.cards)
			card.elem.classList.add("noclick");
	}

	// Returns the container to its default, empty state
	reset() {
		while(this.cards.length)
			this.removeCard(0);
		if (this.elem)
			while(this.elem.firstChild)
				this.elem.removeChild(this.elem.firstChild);
		this.cards = [];
	}

}

//
