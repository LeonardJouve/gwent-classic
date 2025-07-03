import type Card from "./card";
import type Player from "./player";
import type CardContainer from "./card_container";
// import Row from "./row";
// import Grave from "./grave";
// import HandAI from "./hand_ai";
// import Deck from "./deck";
// import Hand from "./hand";
// import Weather from "./weather";
// import ControllerAI from "./controller_ai";

// Translates an element by x from the left and y from the top
export async function translate(elem: HTMLElement, x: number, y: number) {
    const dimensionsElement = document.getElementById("dimensions") as HTMLElement;
	let vw100 = 100 / dimensionsElement.offsetWidth;
	x*=vw100;
	y*=vw100 ;
	elem.style.transform = "translate(" + x + "vw, " + y + "vw)";
	let margin = elem.style.marginLeft;
	elem.style.marginRight = -elem.offsetWidth*vw100 + "vw";
	elem.style.marginLeft = "";
	await sleep(499);
	elem.style.transform = "";
	elem.style.position = "";
	elem.style.marginLeft = margin;
	elem.style.marginRight = margin;
}

// Fades out an element until hidden over the duration
export async function fadeOut(elem: HTMLElement, duration: number, delay?: number) {
	await fade(false, elem, duration, delay);
}

// Fades in an element until opaque over the duration
export async function fadeIn(elem: HTMLElement, duration: number, delay?: number){
	await fade(true, elem, duration, delay);
}

// Fades an element over a duration
export async function fade(fadeIn: boolean, elem: HTMLElement, dur: number, delay?: number){
	if (delay)
		await sleep(delay)
	let op = fadeIn ?  0.1 : 1;
	elem.style.opacity = String(op);
	elem.style.filter = "alpha(opacity=" + (op * 100) + ")";
	if (fadeIn)
		elem.classList.remove("hide");
	let timer = setInterval( async function() {
		op += op * (fadeIn ? 0.1 : -0.1);
		if (op >= 1) {
			clearInterval(timer);
			return;
		} else if (op <= 0.1) {
			elem.classList.add("hide");
			elem.style.opacity = "";
			elem.style.filter = "";
			clearInterval(timer);
			return;
		}
		elem.style.opacity = String(op);
		elem.style.filter = "alpha(opacity=" + (op * 100) + ")";
	}, dur/24);
}

//      Get Image paths
export function iconURL(name: string, ext = "png"){
	return imgURL("icons/" + name, ext);
}

export function largeURL(name: string, ext="jpg"){
	return imgURL("lg/" + name, ext)
}

export function smallURL(name: string, ext="jpg"){
	return imgURL("sm/" + name, ext);
}

export function imgURL(path: string, ext: string) {
	return "url('assets/img/" + path + "." + ext;
}

// Returns true if n is an Number
export function isNumber(n: any) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

// Returns true if s is a String
export function isString(s: any){
	return typeof(s) === 'string' || s instanceof String;
}

// Returns a random integer in the range [0,n)
export function randomInt(n: number)  {
	return Math.floor(Math.random() * n);
}

// Pauses execution until the passed number of milliseconds as expired
export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
  //return new Promise(resolve => setTimeout(() => {if (func) func(); return resolve();}, ms));
}

// Suspends execution until the predicate condition is met, checking every ms milliseconds
export function sleepUntil(predicate: () => boolean, ms?: number): Promise<void> {
	return new Promise(resolve => {
		let timer = setInterval( function () {
			if (predicate()) {
				clearInterval(timer);
				resolve();
			}
		}, ms)
	});
}

// Compares by type then power then name
export function compareCards(a: Card, b: Card){
    var dif = factionRank(a) - factionRank(b);
    if (dif !== 0)
        return dif;
    dif = a.basePower - b.basePower;
    if (dif && dif !== 0)
        return dif;
    return a.name.localeCompare(b.name);

    function factionRank(c: Card){ return c.faction === "special" ? -2 : (c.faction === "weather") ? -1 : 0; }
}

// Translates a card between two containers
export async function translateTo(player_me: Player, player_op: Player, card: Card, container_source?: CardContainer, container_dest?: CardContainer){
    // if (!container_dest || !container_source)
    // 	return;
    // if (container_dest === player_op.hand && container_source === player_op.deck)
    // 	return;

    // let elem = card.elem;
    // let source = !container_source ? card.elem : getSourceElem(card, container_source, container_dest);
    // let dest = getDestinationElem(card, container_source, container_dest);
    // if (!isInDocument(elem))
    // 	source.appendChild(elem);
    // let x = trueOffsetLeft(dest) - trueOffsetLeft(elem) +dest.offsetWidth/2 - elem.offsetWidth;
    // let y = trueOffsetTop(dest) - trueOffsetTop(elem) +dest.offsetHeight/2 - elem.offsetHeight/2;
    // if (container_dest instanceof Row && container_dest.cards.length !== 0 && !card.isSpecial() ){
    // 	x += (container_dest.getSortedIndex(card) === container_dest.cards.length) ? elem.offsetWidth/2 : -elem.offsetWidth/2;
    // }
    // if (card.holder.controller instanceof ControllerAI)
    // 	x += elem.offsetWidth/2;
    // if (container_source instanceof Row && container_dest instanceof Grave && !card.isSpecial()) {
    // 	let mid = trueOffset(container_source.elem as HTMLElement, true) + (container_source.elem as HTMLElement).offsetWidth/2;
    // 	x += trueOffset(elem, true) - mid;
    // }
    // if (container_source instanceof Row && container_dest === player_me.hand)
    // 	y *= 7/8;
    // await translate(elem, x, y);

    // // Returns true if the element is visible in the viewport
    // function isInDocument(elem: HTMLElement){
    // 	return elem.getBoundingClientRect().width !== 0;
    // }

    // // Returns the true offset of a nested element in the viewport
    // function trueOffset(elem: HTMLElement, left: boolean){
    // 	let total =0
    // 	let curr = elem;
    // 	while (curr){
    // 		total += (left ? curr.offsetLeft : curr.offsetTop);
    // 		curr = curr.parentElement as HTMLElement;
    // 	}
    // 	return total;
    // }
    // function trueOffsetLeft(elem: HTMLElement) {	return trueOffset(elem, true); }
    // function trueOffsetTop(elem: HTMLElement) { return trueOffset(elem, false); }

    // // Returns the source container's element to transition from
    // function getSourceElem(card: Card, source: CardContainer, dest: CardContainer){
    // 	if (source instanceof HandAI)
    // 		return source.hidden_elem;
    // 	if (source instanceof Deck && source.elem)
    // 		return source.elem.children[source.elem.children.length-2];
    // 	return source.elem as HTMLElement;
    // }

    // // Returns the destination container's element to transition to
    // function getDestinationElem(card: Card, source: CardContainer, dest: CardContainer): HTMLElement{
    // 	if (dest instanceof HandAI)
    // 		return dest.hidden_elem;
    // 	if (card.isSpecial() && dest instanceof Row)
    // 		return dest.elem_special;
    // 	if (dest instanceof Row || dest instanceof Hand || dest instanceof Weather){
    // 		if (dest.cards.length === 0)
    // 			return dest.elem as HTMLElement;
    // 		let index = dest.getSortedIndex(card);
    // 		let dcard = dest.cards[index === dest.cards.length ? index-1 : index];
    // 		return dcard.elem;
    // 	}
    // 	return dest.elem as HTMLElement;
    // }
}
