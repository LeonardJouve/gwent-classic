import type Card from "./card";
import CardContainer from "./card_container";

// Hand used by current player
export default class Hand extends CardContainer {
    private counter: HTMLElement;

	constructor(elem: HTMLElement) {
		super(elem);
		this.counter = document.getElementById("hand-count-me") as HTMLElement;
	}

	// Override
	addCard(card: Card) {
        const i = this.addCardSorted(card);
		this.addCardElement(card, i);
		this.resize();
	}

	// Override
	resize() {
		this.counter.innerHTML = String(this.cards.length);
		this.resizeCardContainer(11, 0.075, .00225);
	}
}
