import Board from "./board";
import DeckMaker from "./deck_maker";
import Game from "./game";
import UI from "./ui";
import Weather from "./weather";

// TODO: replace undefined function arguments with ?

const ui = new UI();
const board = new Board();
const weather = new Weather();
const game = new Game();

ui.enablePlayer(false);
const dm = new DeckMaker();
