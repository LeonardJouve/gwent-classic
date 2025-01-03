import Clients from "./clients.ts";
import Events from "./events.ts";

type Battle = string[];

export default class Battles {
    private clients: Clients;
    private battles: Battle[];

    constructor(clients: Clients) {
        this.clients = clients;
        this.battles = [];
    }

    public create(firstPlayer: string, secondPlayer: string) {
        this.battles.push([firstPlayer, secondPlayer]);

        this.clients.send(firstPlayer, Events.MATCH_BEGIN, null);
        this.clients.send(secondPlayer, Events.MATCH_BEGIN, null);
    }

    public isClientInBattle(id: string): boolean {
        return this.battles.some((battle) => id in battle);
    }

    private getClientBattle(id: string): Battle|null {
        return this.battles.find((battle) => id in battle) ?? null;
    }

    private removeBattle(battle: Battle) {
        this.battles.splice(this.battles.indexOf(battle), 1);
    }

    public leave(id: string) {
        const battle = this.getClientBattle(id);
        if (!battle) return;

        Object.keys(battle).forEach((player) => {
            if (player === id) return;

            this.clients.send(player, Events.MATCH_WON, null);
        });

        this.removeBattle(battle);
    }
}
