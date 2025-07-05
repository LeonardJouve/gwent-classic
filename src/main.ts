import Board from "./board";
import DeckMaker from "./deck_maker";
import Game from "./game";
import UI from "./ui";
import Weather from "./weather";

// TODO: replace undefined function arguments with ?

// Matchmake
// Waiting
// Redraw
// Waiting
// playCard, playCardToRow, playScorch, passTurn, activateLeader
// Result screen

// TODO: socket timeout

const ui = new UI();
new Board();
new Weather();
new Game();

ui.enablePlayer(false);
new DeckMaker();
