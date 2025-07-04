import type Card from "./card";
import type CardContainer from "./card_container";
import UI from "./ui";
import {compareCards, largeURL} from "./utils";

export default class Carousel {
	private container: CardContainer;
    private count: number;
    private action: (container: CardContainer, i: number) => Promise<void>;
    private predicate?: (card: Card) => boolean;
    private bSort: boolean;
    private bExit: boolean;
    private title?: string;
    public index: number;
    private cancelled: boolean;
    private indices: number[];
    private elem: HTMLElement;
    private title_elem: HTMLElement;
    private desc: HTMLElement;
    private previews: HTMLCollectionOf<HTMLElement>;
    static elem: HTMLElement;
    static curr: Carousel|null;

    constructor(container: CardContainer, count: number, action: (container: CardContainer, i: number) => Promise<void>, predicate: (card: Card) => boolean, bSort = false, bExit = false, title?: string) {
		if (count <= 0 || !container || !action || container.cards.length === 0)
			throw new Error("invalid Carousel constructor parameters");
        this.container = container;
		this.count = count;
		this.action = action;
		this.predicate = predicate;
		this.bSort = bSort;
		this.indices = [];
		this.index = 0;
		this.bExit = bExit;
		this.title = title;
		this.cancelled = false;

		if (!Carousel.elem) {
			Carousel.elem = document.getElementById("carousel") as HTMLElement;
			Carousel.elem.children[0].addEventListener("click", () => Carousel.curr?.cancel(), false);
		}
		this.elem = Carousel.elem;
		document.getElementsByTagName("main")[0].classList.remove("noclick");

		this.elem.children[0].classList.remove("noclick");
		this.previews = this.elem.getElementsByClassName("card-lg") as HTMLCollectionOf<HTMLElement>;
		this.desc = this.elem.getElementsByClassName("card-description")[0] as HTMLElement;
		this.title_elem = this.elem.children[2] as HTMLElement;

        this.elem.children[0].children[0].addEventListener("click", (event) => this.shift(event,-2));
        this.elem.children[0].children[1].addEventListener("click", (event) => this.shift(event,-1));
        this.elem.children[0].children[2].addEventListener("click", (event) => this.select(event));
        this.elem.children[0].children[3].addEventListener("click", (event) => this.shift(event,1));
        this.elem.children[0].children[4].addEventListener("click", (event) => this.shift(event,2));
	}

	// Initializes the current Carousel
	start(){
		if (!this.elem)
			return;
		this.indices = this.container.cards.reduce<number[]>((a,c,i)=> (!this.predicate || this.predicate(c)) ? a.concat([i]) : a, []);
		if (this.indices.length <= 0)
			return this.exit();
		if (this.bSort)
			this.indices.sort( (a, b) => compareCards(this.container.cards[a],this.container.cards[b]) );

		this.update();
		Carousel.setCurrent(this);

		if (this.title) {
			this.title_elem.innerHTML = this.title;
			this.title_elem.classList.remove("hide");
		} else {
			this.title_elem.classList.add("hide");
		}

		this.elem.classList.remove("hide");
		UI.curr.enablePlayer(true);
	}

	// Called by the client to cycle cards displayed by n
	shift(event: Event, n: number){
		(event || window.event).stopPropagation();
		this.index = Math.max(0, Math.min(this.indices.length-1, this.index+n));
		this.update();
	}

	// Called by client to perform action on the middle card in focus
	async select(event: Event) {
		(event || window.event).stopPropagation();
		--this.count;
		if (this.isLastSelection())
			this.elem.classList.add("hide");
		if (this.count <= 0)
			UI.curr.enablePlayer(false);
		await this.action(this.container, this.indices[this.index]);
		if (this.isLastSelection() && !this.cancelled)
			return this.exit();
		this.update();
	}

	// Called by client to exit out of the current Carousel if allowed. Enables player interraction.
	cancel(){
		if (this.bExit){
			this.cancelled = true;
			this.exit();
		}
		UI.curr.enablePlayer(true);
	}

	// Returns true if there are no more cards to view or select
	isLastSelection(){
		return this.count <= 0 || this.indices.length === 0;
	}

	// Updates the visuals of the current selection of cards
	update(){
		this.indices = this.container.cards.reduce<number[]>((a,c,i)=> (!this.predicate || this.predicate(c)) ? a.concat([i]) : a, []);
		if (this.index >= this.indices.length)
			this.index =  this.indices.length-1;
		for (let i=0; i<this.previews.length; i++) {
			const curr = this.index - 2 + i;
			if (curr >= 0 && curr < this.indices.length) {
				const card = this.container.cards[this.indices[curr]];
				this.previews[i].style.backgroundImage = largeURL(card.faction + "_" + card.filename);
				this.previews[i].classList.remove("hide");
				this.previews[i].classList.remove("noclick");
			} else {
				this.previews[i].style.backgroundImage = "";
				this.previews[i].classList.add("hide");
				this.previews[i].classList.add("noclick");
			}
		}
		UI.curr.setDescription(this.container.cards[this.indices[this.index]], this.desc);
	}

	// Clears and quits the current carousel
	exit() {
		for (const x of this.previews)
			x.style.backgroundImage = "";
		this.elem.classList.add("hide");
		Carousel.clearCurrent();
		UI.curr.quitCarousel();
	}

	// Statically sets the current carousel
	static setCurrent(curr: Carousel) {
		this.curr = curr;
	}

	// Statically clears the current carousel
	static clearCurrent() {
		this.curr = null;
	}
}

// Custom confirmation windows
