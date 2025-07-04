import UI from "./ui";

export default class Popup {
	private yes: () => void;
    private no: () => void;
    private elem: HTMLElement;
    static curr: Popup|null;

    constructor(yesName: string, yes: (() => void)|null, noName: string, no: (() => void)|null, header: string, description: string){
		this.yes = yes ? yes : ()=>{};
		this.no = no ? no : ()=>{};

		this.elem = document.getElementById("popup") as HTMLElement;
		const main = this.elem.children[0] as HTMLElement;
        main.children[0].innerHTML = header ? header : "";
        main.children[1].innerHTML = description ? description : "";
        main.children[2].children[0].innerHTML = (yesName) ? yesName : "Yes";
        main.children[2].children[1].innerHTML = (noName) ? noName : "No";

        main.children[2].children[0].addEventListener("click", this.selectYes);
        main.children[2].children[1].addEventListener("click", this.selectNo);

		this.elem?.classList.remove("hide");
		Popup.setCurrent(this);
		UI.curr.enablePlayer(true);
	}

	// Sets this as the current popup window
	static setCurrent(curr: Popup){ this.curr = curr; }

	// Unsets this as the current popup window
	static clearCurrent()  { this.curr = null; }

	// Called when client selects the positive aciton
	selectYes() {
		this.clear()
		this.yes();
		return true;
	}

	// Called when client selects the negative option
	selectNo() {
		this.clear();
		this.no();
		return false;
	}

	// Clears the popup and diables player interraction
	clear() {
		UI.curr.enablePlayer(false);
		this.elem?.classList.add("hide");
		Popup.clearCurrent();
	}

}

// Screen used to customize, import and export deck contents
