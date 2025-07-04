import Board from "./board";
import DeckMaker from "./deck_maker";
import Game from "./game";
import UI from "./ui";
import Weather from "./weather";

// TODO: replace undefined function arguments with ?

const ui = new UI();
new Board();
new Weather();
new Game();

ui.enablePlayer(false);
new DeckMaker();
