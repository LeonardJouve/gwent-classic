import Board from "./board";
import Card from "./card";
import CardContainer from "./card_container";
import Row from "./row";
import UI from "./ui";
import {sleep} from "./utils";

interface WeatherType {
    name: string;
    count: number;
    rows: Row[];
}

// Handles how weather effects are added and removed
export default class Weather extends CardContainer {
	public types: Record<string, WeatherType>;
    static curr: Weather;

    constructor() {
		super(document.getElementById("weather") as HTMLElement);
		this.types = {
			rain: {name:"rain", count: 0, rows: []},
			fog: {name:"fog", count: 0, rows: []},
			frost: {name:"frost", count: 0, rows: []}
		}
		let i=0;
		for (const key of Object.keys(this.types))
			this.types[key].rows = [Board.curr.row[i], Board.curr.row[5-i++]];

		this.elem?.addEventListener("click",() => UI.curr.selectRow(this), false);
        Weather.setCurrent(this);
	}

    static setCurrent(curr: Weather) {
        this.curr = curr;
    }

	// Adds a card if unique and clears all weather if 'clear weather' card added
	async addCard(card: Card) {
		super.addCard(card, undefined);
		card.elem.classList.add("noclick");
		if (card.name === "Clear Weather"){
			// TODO Sunlight animation
			await sleep(500);
			this.clearWeather();
		} else {
			this.changeWeather(card, x => ++this.types[x].count === 1, (r,t) => r.addOverlay(t.name));
			for (let i=this.cards.length-2; i>=0; --i) {
				if (card.name === this.cards[i].name) {
					await sleep(750);
					await Board.curr.toGrave(card, this);
					break;
				}
			}
		}
		await sleep(750);
	}

	// Override
	removeCard(card: Card){
		card = super.removeCard(card, undefined);
		card.elem.classList.remove("noclick");
		this.changeWeather(card, x => --this.types[x].count === 0, (r,t) => r.removeOverlay(t.name));
		return card;
	}

	// Checks if a card's abilities are a weather type. If the predicate is met, perfom the action
	// on the type's associated rows
	changeWeather(card: Card, predicate: (ability: string) => boolean, action: (row: Row, weatherType: WeatherType) => void) {
		for (const x of card.abilities) {
			if (x in this.types && predicate(x)){
				for (const r of this.types[x].rows)
					action(r, this.types[x]);
			}
		}
	}

	// Removes all weather effects and cards
	async clearWeather() {
		await Promise.all(this.cards.map((c,i)=>this.cards[this.cards.length-i-1]).map(c => Board.curr.toGrave(c, this)));
	}

	// Override
	resize() {
		this.resizeCardContainer(4, 0.075, .045);
	}

	// Override
	reset(){
		super.reset();
		Object.keys(this.types).map(t => this.types[t].count = 0);
	}
}
