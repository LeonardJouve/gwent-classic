"use strict"

import Board from "./board";
import Game from "./game";
import UI from "./ui";
import DeckMaker from "./deck_maker";
import { randomInt } from "./utils";
import HandAI from "./hand_ai";
import Card from "./card";
import Player from "./player";

type Faction = {
    name: string;
    description: string;
    factionAbility?: (player: Player) => void;
};

const factions: Record<string, Faction> = {
	realms: {
		name: "Northern Realms",
		factionAbility: player => Game.curr.roundStart.push( async () => {
			if (Game.curr.roundCount > 1 && Game.curr.roundHistory[Game.curr.roundCount-2].winner === player) {
				player.deck.draw(player.hand);
				await UI.curr.notification("north", 1200);
			}
			return false;
		}),
		description: "Draw a card from your deck whenever you win a round."
	},
	nilfgaard: {
		name: "Nilfgaardian Empire",
		description: "Wins any round that ends in a draw."
	},
	monsters: {
		name: "Monsters",
		factionAbility: player => Game.curr.roundEnd.push(async () => {
			let units = Board.curr.row.filter( (r,i) => Number(player === DeckMaker.curr.player_me) ^ Number(i < 3))
				.reduce<Card[]>((a,r) => r.cards.filter(c => c.isUnit()).concat(a), []);
			if (units.length === 0)
				return false;
			let card = units[randomInt(units.length)];
			card.noRemove = true;
			Game.curr.roundStart.push( async () => {
				await UI.curr.notification("monsters", 1200);
				delete card.noRemove;
				return true;
			});
			return false;
		}),
		description: "Keeps a random Unit Card out after each round."
	},
	scoiatael: {
		name: "Scoia'tael",
		factionAbility: player => Game.curr.gameStart.push( async () => {
			let notif = "";
			if (player === DeckMaker.curr.player_me) {
				await UI.curr.popup("Go First", () => Game.curr.firstPlayer = player, "Let Opponent Start", () => Game.curr.firstPlayer = player.opponent(), "Would you like to go first?", "The Scoia'tael faction perk allows you to decide who will get to go first.");
				notif = Game.curr.firstPlayer?.tag + "-first";
			} else if (player.hand instanceof HandAI) {
				if (Math.random() < 0.5) {
					Game.curr.firstPlayer = player;
					notif = "scoiatael";
				} else {
					Game.curr.firstPlayer = player.opponent();
					notif = Game.curr.firstPlayer?.tag + "-first";
				}
			} else {
				//sleepUntil(game.firstPlayer); //TODO online
			}
			await UI.curr.notification(notif,1200);
			return true;
		}),
		description: "Decides who takes first turn."
	},
	skellige: {
		name: "Skellige",
		factionAbility: player => Game.curr.roundStart.push( async () => {
			if (Game.curr.roundCount != 3)
				return false;
			await UI.curr.notification("skellige-" + player.tag, 1200);
			await Promise.all(player.grave.findCardsRandom(c => c.isUnit(), 2).map(c => Board.curr.toRow(c, player.grave)));
			return true;
		}),
		description: "2 random cards from the graveyard are placed on the battlefield at the start of the third round."
	}
}

export default factions;
