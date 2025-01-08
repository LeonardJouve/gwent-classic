class DeckMaker {
    constructor() {
        this.elem = document.getElementById("deck-customization");
        this.bank_elem = document.getElementById("card-bank");
        this.deck_elem = document.getElementById("card-deck");
        this.leader_elem = document.getElementById("card-leader");
        this.leader_elem.children[1].addEventListener("click", () => this.selectLeader(), false);

        this.faction = "realms";
        this.setFaction(this.faction, true);

        let start_deck = JSON.parse(premade_deck[0]);
        start_deck.cards = start_deck.cards.map(c => ({
            index: c[0],
            count: c[1]
        }));
        this.setLeader(start_deck.leader);
        this.makeBank(this.faction, start_deck.cards);

        this.change_elem = document.getElementById("change-faction");
        this.change_elem.addEventListener("click", () => this.selectFaction(), false);

        document.getElementById("download-deck").addEventListener("click", () => this.downloadDeck(), false);
        document.getElementById("add-file").addEventListener("change", () => this.uploadDeck(), false);
        document.getElementById("start-game").addEventListener("click", () => this.startNewGame(false), false);
        document.getElementById("find-game").addEventListener("click", () => this.startNewGame(true), false);

        this.update();
    }

    // Called when client selects a deck faction. Clears previous cards and makes valid cards available.
    setFaction(faction_name, silent) {
        if (!silent && this.faction === faction_name)
            return false;
        if (!silent && !confirm("Changing factions will clear the current deck. Continue? "))
            return false;
        this.elem.getElementsByTagName("h1")[0].innerHTML = factions[faction_name].name;
        this.elem.getElementsByTagName("h1")[0].style.backgroundImage = iconURL("deck_shield_" + faction_name);
        document.getElementById("faction-description").innerHTML = factions[faction_name].description;

        this.leaders =
            card_dict.map((c, i) => ({
                index: i,
                card: c
            }))
            .filter(c => c.card.deck === faction_name && c.card.row === "leader");
        if (!this.leader || this.faction !== faction_name) {
            this.leader = this.leaders[0];
            this.leader_elem.children[1].style.backgroundImage = largeURL(this.leader.card.deck + "_" + this.leader.card.filename);
        }
        this.faction = faction_name;
        return true;
    }

    // Called when client selects a leader for their deck
    setLeader(index) {
        this.leader = this.leaders.filter(l => l.index == index)[0];
        this.leader_elem.children[1].style.backgroundImage = largeURL(this.leader.card.deck + "_" + this.leader.card.filename);
    }

    // Constructs a bank of cards that can be used by the faction's deck.
    // If a deck is provided, will not add cards to bank that are already in the deck.
    makeBank(faction, deck) {
        this.clear();
        let cards = card_dict.map((c, i) => ({
            card: c,
            index: i
        })).filter(
            p => [faction, "neutral", "weather", "special"].includes(p.card.deck) && p.card.row !== "leader");

        cards.sort(function(id1, id2) {
            let a = card_dict[id1.index],
                b = card_dict[id2.index];
            let c1 = {
                name: a.name,
                basePower: -a.strength,
                faction: a.deck
            };
            let c2 = {
                name: b.name,
                basePower: -b.strength,
                faction: b.deck
            };
            return Card.compare(c1, c2);
        });


        let deckMap = {};
        if (deck) {
            for (let i of Object.keys(deck)) deckMap[deck[i].index] = deck[i].count;
        }
        cards.forEach(p => {
            let count = deckMap[p.index] !== undefined ? Number(deckMap[p.index]) : 0;
            this.makePreview(p.index, Number.parseInt(p.card.count) - count, this.bank_elem, this.bank, );
            this.makePreview(p.index, count, this.deck_elem, this.deck);
        });
    }

    // Creates HTML elements for the card previews
    makePreview(index, num, container_elem, cards) {
        let card_data = card_dict[index];

        let elem = document.createElement("div");
        elem.style.backgroundImage = largeURL(card_data.deck + "_" + card_data.filename);
        elem.classList.add("card-lg");
        let count = document.createElement("div");
        elem.appendChild(count);
        container_elem.appendChild(elem);

        let bankID = {
            index: index,
            count: num,
            elem: elem
        };
        let isBank = cards === this.bank;
        count.innerHTML = bankID.count;
        cards.push(bankID);
        let cardIndex = cards.length - 1;
        elem.addEventListener("click", () => this.select(cardIndex, isBank), false);

        return bankID;
    }

    // Updates the card preview elements when any changes are made to the deck
    update() {
        for (let x of this.bank) {
            if (x.count)
                x.elem.classList.remove("hide");
            else
                x.elem.classList.add("hide");
        }
        let total = 0,
            units = 0,
            special = 0,
            strength = 0,
            hero = 0;
        for (let x of this.deck) {
            let card_data = card_dict[x.index];
            if (x.count)
                x.elem.classList.remove("hide");
            else
                x.elem.classList.add("hide");
            total += x.count;
            if (card_data.deck === "special" || card_data.deck === "weather") {
                special += x.count;
                continue;
            }
            units += x.count;
            strength += card_data.strength * x.count;
            if (card_data.ability.split(" ").includes("hero"))
                hero += x.count;
        }
        this.stats = {
            total: total,
            units: units,
            special: special,
            strength: strength,
            hero: hero
        };
        this.updateStats();
    }

    // Updates and displays the statistics describing the cards currently in the deck
    updateStats() {
        let stats = document.getElementById("deck-stats");
        stats.children[1].innerHTML = this.stats.total;
        stats.children[3].innerHTML = this.stats.units + (this.stats.units < 22 ? "/22" : "");
        stats.children[5].innerHTML = this.stats.special + "/10";
        stats.children[7].innerHTML = this.stats.strength;
        stats.children[9].innerHTML = this.stats.hero;

        stats.children[3].style.color = this.stats.units < 22 ? "red" : "";
        stats.children[5].style.color = (this.stats.special > 10) ? "red" : "";
    }

    // Opens a Carousel to allow the client to select a leader for their deck
    selectLeader() {
        let container = new CardContainer();
        container.cards = this.leaders.map(c => {
            let card = new Card(c.card, player_me);
            card.data = c;
            return card;
        });

        let index = this.leaders.indexOf(this.leader);
        ui.queueCarousel(container, 1, (c, i) => {
            let data = c.cards[i].data;
            this.leader = data;
            this.leader_elem.children[1].style.backgroundImage = largeURL(data.card.deck + "_" + data.card.filename);
        }, () => true, false, true);
        Carousel.curr.index = index;
        Carousel.curr.update();
    }

    // Opens a Carousel to allow the client to select a faction for their deck
    selectFaction() {
        let container = new CardContainer();
        container.cards = Object.keys(factions).map(f => {
            return {
                abilities: [f],
                filename: f,
                desc_name: factions[f].name,
                desc: factions[f].description,
                faction: "faction"
            };
        });
        let index = container.cards.reduce((a, c, i) => c.filename === this.faction ? i : a, 0);
        ui.queueCarousel(container, 1, (c, i) => {
            let change = this.setFaction(c.cards[i].filename);
            if (!change)
                return;
            this.makeBank(c.cards[i].filename);
            this.update();
        }, () => true, false, true);
        Carousel.curr.index = index;
        Carousel.curr.update();
    }

    // Called when client selects s a preview card. Moves it from bank to deck or vice-versa then updates;
    select(index, isBank) {
        if (isBank) {
            this.add(index, this.deck);
            this.remove(index, this.bank);
        } else {
            this.add(index, this.bank);
            this.remove(index, this.deck);
        }
        this.update();
    }

    // Adds a card to container (Bank or deck)
    add(index, cards) {
        let id = cards[index];
        id.elem.children[0].innerHTML = ++id.count;
    }

    // Removes a card from container (bank or deck)
    remove(index, cards) {
        let id = cards[index];
        id.elem.children[0].innerHTML = --id.count;
    }

    // Removes all elements in the bank and deck
    clear() {
        while (this.bank_elem.firstChild)
            this.bank_elem.removeChild(this.bank_elem.firstChild);
        while (this.deck_elem.firstChild)
            this.deck_elem.removeChild(this.deck_elem.firstChild);
        this.bank = [];
        this.deck = [];
        this.stats = {};
    }

    // Verifies current deck, creates the players and their decks, then starts a new game
    startNewGame(isOnline) {
        let warning = "";
        if (this.stats.units < 22)
            warning += "Your deck must have at least 22 unit cards. \n";
        if (this.stats.special > 10)
            warning += "Your deck must have no more than 10 special cards. \n";
        if (warning != "")
            return alert(warning);

        game.setOnline(isOnline);

        if (isOnline) {
            const name = document.getElementById("name");
            const findGame = document.getElementById("find-game");
            if (!findGame || !name) return;

            toggleClass(findGame, "queued");

            send(Events.MATCHMAKING_QUEUE, {name: name.value});
        }

        const execute = () => {
            let me_deck = {
                faction: this.faction,
                leader: card_dict[this.leader.index],
                cards: this.deck.filter(x => x.count > 0)
            };

            let op_deck = JSON.parse(premade_deck[randomInt(Object.keys(premade_deck).length)]);
            op_deck.cards = op_deck.cards.map(c => ({
                index: c[0],
                count: c[1]
            }));
            //op_deck.leader = card_dict[op_deck.leader];

            let leaders = card_dict.filter(c => c.row === "leader" && c.deck === op_deck.faction);
            op_deck.leader = leaders[randomInt(leaders.length)];
            //op_deck.leader = card_dict.filter(c => c.row === "leader")[12];

            player_me = new Player(0, "Player 1", me_deck);
            player_op = new Player(1, "Player 2", op_deck);

            this.elem.classList.add("hide");
            game.startGame();
        };

        if (isOnline) {
            listenOnce(Events.MATCHMAKING_FOUND, execute);
        } else {
            execute();
        }
    }

    // Converts the current deck to a JSON string
    deckToJSON() {
        let obj = {
            faction: this.faction,
            leader: this.leader.index,
            cards: this.deck.filter(x => x.count > 0).map(x => [x.index, x.count])
        };
        return JSON.stringify(obj);
    }

    // Called by the client to downlaod the current deck as a JSON file
    downloadDeck() {
        let json = this.deckToJSON();
        let str = "data:text/json;charset=utf-8," + encodeURIComponent(json);
        let hidden_elem = document.getElementById('download-json');
        hidden_elem.href = str;
        hidden_elem.download = "GwentDeck.json";
        hidden_elem.click();
    }

    // Called by the client to upload a JSON file representing a new deck
    uploadDeck() {
        let files = document.getElementById("add-file").files;
        if (files.length <= 0)
            return false;
        let fr = new FileReader();
        fr.onload = e => {
            try {
                this.deckFromJSON(e.target.result);
            } catch (e) {
                alert("Uploaded deck is not formatted correctly!");
            }
        }
        fr.readAsText(files.item(0));
        document.getElementById("add-file").value = "";
    }

    // Creates a deck from a JSON file's contents and sets that as the current deck
    // Notifies client with warnings if the deck is invalid
    deckFromJSON(json) {
        let deck;
        try {
            deck = JSON.parse(json);
        } catch (e) {
            alert("Uploaded deck is not parsable!");
            return;
        }
        let warning = "";
        if (card_dict[deck.leader].row !== "leader")
            warning += "'" + card_dict[deck.leader].name + "' is cannot be used as a leader\n";
        if (deck.faction != card_dict[deck.leader].deck)
            warning += "Leader '" + card_dict[deck.leader].name + "' doesn't match deck faction '" + deck.faction + "'.\n";

        let cards = deck.cards.filter(c => {
                let card = card_dict[c[0]];
                if (!card) {
                    warning += "ID " + c[0] + " does not correspond to a card.\n";
                    return false
                }
                if (![deck.faction, "neutral", "special", "weather"].includes(card.deck)) {
                    warning += "'" + card.name + "' cannot be used in a deck of faction type '" + deck.faciton + "'\n";
                    return false;
                }
                if (card.count < c[1]) {
                    warning += "Deck contains " + c[1] + "/" + card.count + " available " + card_dict[c.index].name + " cards\n";
                    return false;
                }
                return true;
            })
            .map(c => ({
                index: c[0],
                count: Math.min(c[1], card_dict[c[0]].count)
            }));

        if (warning && !confirm(warning + "\n\n\Continue importing deck?"))
            return;
        this.setFaction(deck.faction, true);
        if (card_dict[deck.leader].row === "leader" && deck.faction === card_dict[deck.leader].deck) {
            this.leader = this.leaders.filter(c => c.index === deck.leader)[0];
            this.leader_elem.children[1].style.backgroundImage = largeURL(this.leader.card.deck + "_" + this.leader.card.filename);
        }
        this.makeBank(deck.faction, cards);
        this.update();
    }
}
