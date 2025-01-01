// Translates a card between two containers
async function translateTo(card, container_source, container_dest) {
    if (!container_dest || !container_source)
        return;
    if (container_dest === player_op.hand && container_source === player_op.deck)
        return;

    let elem = card.elem;
    let source = !container_source ? card.elem : getSourceElem(card, container_source, container_dest);
    let dest = getDestinationElem(card, container_source, container_dest);
    if (!isInDocument(elem))
        source.appendChild(elem);
    let x = trueOffsetLeft(dest) - trueOffsetLeft(elem) + dest.offsetWidth / 2 - elem.offsetWidth;
    let y = trueOffsetTop(dest) - trueOffsetTop(elem) + dest.offsetHeight / 2 - elem.offsetHeight / 2;
    if (container_dest instanceof Row && container_dest.cards.length !== 0 && !card.isSpecial()) {
        x += (container_dest.getSortedIndex(card) === container_dest.cards.length) ? elem.offsetWidth / 2 : -elem.offsetWidth / 2;
    }
    if (card.holder.controller instanceof ControllerAI)
        x += elem.offsetWidth / 2;
    if (container_source instanceof Row && container_dest instanceof Grave && !card.isSpecial()) {
        let mid = trueOffset(container_source.elem, true) + container_source.elem.offsetWidth / 2;
        x += trueOffset(elem, true) - mid;
    }
    if (container_source instanceof Row && container_dest === player_me.hand)
        y *= 7 / 8;
    await translate(elem, x, y);

    // Returns true if the element is visible in the viewport
    function isInDocument(elem) {
        return elem.getBoundingClientRect().width !== 0;
    }

    // Returns the true offset of a nested element in the viewport
    function trueOffset(elem, left) {
        let total = 0
        let curr = elem;
        while (curr) {
            total += (left ? curr.offsetLeft : curr.offsetTop);
            curr = curr.parentElement;
        }
        return total;
    }

    function trueOffsetLeft(elem) {
        return trueOffset(elem, true);
    }

    function trueOffsetTop(elem) {
        return trueOffset(elem, false);
    }

    // Returns the source container's element to transition from
    function getSourceElem(card, source, dest) {
        if (source instanceof HandAI)
            return source.hidden_elem;
        if (source instanceof Deck)
            return source.elem.children[source.elem.children.length - 2];
        return source.elem;
    }

    // Returns the destination container's element to transition to
    function getDestinationElem(card, source, dest) {
        if (dest instanceof HandAI)
            return dest.hidden_elem;
        if (card.isSpecial() && dest instanceof Row)
            return dest.elem_special;
        if (dest instanceof Row || dest instanceof Hand || dest instanceof Weather) {
            if (dest.cards.length === 0)
                return dest.elem;
            let index = dest.getSortedIndex(card);
            let dcard = dest.cards[index === dest.cards.length ? index - 1 : index];
            return dcard.elem;
        }
        return dest.elem;
    }
}

// Translates an element by x from the left and y from the top
async function translate(elem, x, y) {
    let vw100 = 100 / document.getElementById("dimensions").offsetWidth;
    x *= vw100;
    y *= vw100;
    elem.style.transform = "translate(" + x + "vw, " + y + "vw)";
    let margin = elem.style.marginLeft;
    elem.style.marginRight = -elem.offsetWidth * vw100 + "vw";
    elem.style.marginLeft = "";
    await sleep(499);
    elem.style.transform = "";
    elem.style.position = "";
    elem.style.marginLeft = margin;
    elem.style.marginRight = margin;
}

// Fades out an element until hidden over the duration
async function fadeOut(elem, duration, delay) {
    await fade(false, elem, duration, delay);
}

// Fades in an element until opaque over the duration
async function fadeIn(elem, duration, delay) {
    await fade(true, elem, duration, delay);
}

// Fades an element over a duration 
async function fade(fadeIn, elem, dur, delay) {
    if (delay)
        await sleep(delay)
    let op = fadeIn ? 0.1 : 1;
    elem.style.opacity = op;
    elem.style.filter = "alpha(opacity=" + (op * 100) + ")";
    if (fadeIn)
        elem.classList.remove("hide");
    let timer = setInterval(async function() {
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
        elem.style.opacity = op;
        elem.style.filter = "alpha(opacity=" + (op * 100) + ")";
    }, dur / 24);
}

//      Get Image paths   
function iconURL(name, ext = "png") {
    return imgURL("icons/" + name, ext);
}

function largeURL(name, ext = "jpg") {
    return imgURL("lg/" + name, ext)
}

function smallURL(name, ext = "jpg") {
    return imgURL("sm/" + name, ext);
}

function imgURL(path, ext) {
    return "url('assets/img/" + path + "." + ext;
}

// Returns true if n is an Number
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

// Returns true if s is a String
function isString(s) {
    return typeof(s) === 'string' || s instanceof String;
}

// Returns a random integer in the range [0,n)
function randomInt(n) {
    return Math.floor(Math.random() * n);
}

// Pauses execution until the passed number of milliseconds as expired
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
    //return new Promise(resolve => setTimeout(() => {if (func) func(); return resolve();}, ms));
}

// Suspends execution until the predicate condition is met, checking every ms milliseconds
function sleepUntil(predicate, ms) {
    return new Promise(resolve => {
        let timer = setInterval(function() {
            if (predicate()) {
                clearInterval(timer);
                resolve();
            }
        }, ms)
    });
}

// Initializes the interractive YouTube object
function onYouTubeIframeAPIReady() {
    ui.initYouTube();
}

/*----------------------------------------------------*/

var ui = new UI();
var board = new Board();
var weather = new Weather();
var game = new Game();
var player_me, player_op;

ui.enablePlayer(false);
let dm = new DeckMaker();