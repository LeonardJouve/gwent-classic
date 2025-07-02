import CardContainer from "./card_container";

// Hand used by computer AI. Has an offscreen HTML element for card transitions.
export default class HandAI extends CardContainer {
    private counter: HTMLElement;
    public hidden_elem: HTMLElement;

	constructor() {
		super(undefined);
		this.counter = document.getElementById("hand-count-op") as HTMLElement;
		this.hidden_elem = document.getElementById("hand-op") as HTMLElement;
	}
	resize() {
        this.counter.innerHTML = String(this.cards.length);
    }
}
