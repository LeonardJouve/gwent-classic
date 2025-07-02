import Card from "./card";
import CardContainer from "./card_container";
import {isNumber, sleep} from "./utils";
import DeckMaker from "./deck_maker";
import Game from "./game";
import card_dict from "./cards";
import Board from "./board";
import UI from "./ui";

type Effects = {
    weather: boolean;
    bond: Record<string, number>;
    morale: number;
    horn: number;
    mardroeme: number;
};

// Contains active cards and effects. Calculates the current score of each card and the row.
export default class Row extends CardContainer {
	private elem_parent: HTMLElement;
    public elem_special: HTMLElement;
    public special: Card|null;
    public total: number;
    public effects: Effects;
    public halfWeather?: boolean;

    constructor(elem: HTMLElement) {
		super(elem.getElementsByClassName("row-cards")[0] as HTMLElement);
		this.elem_parent = elem;
		this.elem_special = elem.getElementsByClassName("row-special")[0] as HTMLElement;
		this.special = null;
		this.total = 0;
		this.effects = {weather:false, bond: {}, morale: 0, horn: 0, mardroeme: 0};
		this.elem?.addEventListener("click", () => UI.curr.selectRow(this), true);
		this.elem_special.addEventListener("click", () => UI.curr.selectRow(this), false);
	}

	// Override
	async addCard(card: Card) {
		if (card.isSpecial()) {
			this.special = card;
			this.elem_special.appendChild(card.elem);
		} else {
			let index = this.addCardSorted(card);
			this.addCardElement(card, index);
			this.resize();
		}
		this.updateState(card, true);
		for (let x of card.placed)
			await x(card, this);
		card.elem.classList.add("noclick");
		await sleep(600);
		this.updateScore();
	}

	// Override
	removeCard(c: Card|number) {
		const card = isNumber(c) ? c === -1 ? this.special : this.cards[c as number] : c as Card;
		if (!card) throw new Error("special is null");
        if (card.isSpecial()) {
			this.special = null;
			this.elem_special.removeChild(card.elem);
		} else {
			super.removeCard(card, undefined);
			card.resetPower();
		}
		this.updateState(card, false);
		for (let x of card.removed)
			x(card);
		this.updateScore();
		return card;
	}

	// Override
	removeCardElement(card: Card, index: number) {
		super.removeCardElement(card, index);
		let x = card.elem;
		x.style.marginLeft = x.style.marginRight = "";
		x.classList.remove("noclick");
	}

	// Updates a card's effect on the row
	updateState(card: Card, activate: boolean){
		for (let x of card.abilities){
			switch (x) {
				case "morale":
				case "horn":
				case "mardroeme": this.effects[x]+= activate ? 1 : -1; break;
				case "bond":
					if (!this.effects.bond[card.id()])
						this.effects.bond[card.id()] = 0;
					this.effects.bond[card.id()] += activate ? 1 : -1;
					break;
			}
		}
	}

	// Activates weather effect and visuals
	addOverlay(overlay: string){
		this.effects.weather = true;
		this.elem_parent.getElementsByClassName("row-weather")[0].classList.add(overlay);
		this.updateScore();
	}

	// Deactivates weather effect and visuals
	removeOverlay(overlay: string){
		this.effects.weather = false;
		this.elem_parent.getElementsByClassName("row-weather")[0].classList.remove(overlay);
		this.updateScore();
	}

	// Override
	resize(){
		this.resizeCardContainer(10, 0.075, .00325);
	}

	// Updates the row's score by summing the current power of its cards
	updateScore() {
		let total = 0;
		for (let card of this.cards) {
			total += this.cardScore(card);
		}
		let player = this.elem_parent.parentElement?.id === "field-op" ? DeckMaker.curr.player_op : DeckMaker.curr.player_me;
		player.updateTotal(total - this.total);
		this.total = total;
		this.elem_parent.getElementsByClassName("row-score")[0].innerHTML = String(this.total);
	}

	// Calculates and set the card's current power
	cardScore(card: Card){
		let total = this.calcCardScore(card);
		card.setPower(total);
		return total;
	}

	// Calculates the current power of a card affected by row affects
	calcCardScore(card: Card) {
		if (card.name === "decoy")
			return 0;
		let total = card.basePower;
		if (card.hero)
			return total;
		if (this.effects.weather)
			total = Math.min(1, total);
		if (Game.curr.doubleSpyPower && card.abilities.includes("spy"))
			total *= 2;
		let bond = this.effects.bond[card.id()];
		if (isNumber(bond) && bond > 1)
			total *= Number(bond);
		total += Math.max(0, this.effects.morale + (card.abilities.includes("morale") ? -1 : 0 ));
		if (this.effects.horn - (card.abilities.includes("horn") ? 1 : 0) >  0 )
			total *= 2;
		return total;
	}

	// Applies a temporary leader horn affect that is removed at the end of the round
	async leaderHorn(){
		if (this.special !== null)
			return;
		let horn = new Card(card_dict[5], null);
		await this.addCard(horn);
		Game.curr.roundEnd.push( async () => Boolean(this.removeCard(horn)) );
	}

	// Applies a local scorch effect to this row
	async scorch() {
		if (this.total >= 10)
			await Promise.all( this.maxUnits().map( async c => {
				await c.animate("scorch", true, false);
				await Board.curr.toGrave(c, this);
			}));
	}

	// Removes all cards and effects from this row
	clear() {
		if (this.special != null)
			Board.curr.toGrave(this.special, this);
		this.cards.filter(c => !c.noRemove).forEach(c => Board.curr.toGrave(c, this) );
	}

	// Returns all regular unit cards with the heighest power
	maxUnits() {
		let max: Card[] = [];
		for (let i=0; i<this.cards.length; ++i){
			let card = this.cards[i];
			if (!card.isUnit())
				continue;
			if (!max[0] || max[0].power < card.power)
				max = [card];
			else if (max[0].power === card.power)
				max.push(card);
		}
		return max;
	}

	// Override
	reset(){
		super.reset();
		while(this.special)
			this.removeCard(this.special);
		while(this.elem_special.firstChild)
			this.elem_special.removeChild(this.elem_special.firstChild);
		this.total = 0;
		//["rain","fog","frost"].forEach( w => this.removeOverlay(w) );
		this.effects = {weather:false, bond: {}, morale: 0, horn: 0, mardroeme: 0};
	}
}
