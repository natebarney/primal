class Cell {

    constructor(elem) {
        this.elem = elem
        this.rotation = 0.0;
        this.set_state("empty");
        this.minigrid = null;
    }

    set_content(content) {
        if (this.minigrid != null) {
            this.elem.removeChild(this.minigrid);
            this.minigrid = null;
        }
        this.elem.textContent = content;
        this.update_class();
    }

    get_content() {
        return this.elem.textContent;
    }

    set_minigrid(entries) {

        const labels = ["1","2","3","4","5","6","7","8","9","*","0","#"];
        let minicells = []
        this.minigrid = document.createElement("div");
        this.minigrid.className = "minigrid";
        for (let i = 0; i < 4; ++i) {
            for (let j = 0; j < 3; ++j) {
                let minicell = document.createElement("div");
                let label = labels[i * 3 + j]
                if (/\d/.test(label)) {
                    minicell.textContent = label;
                }
                this.minigrid.appendChild(minicell);
                minicells[label] = minicell;
            }
        }

        for (let entry of entries) {
            let minicell = minicells[entry];
            if (minicell) {
                minicell.className = "possible";
            }
        }
        
        this.elem.textContent = "";
        this.update_class();
        this.elem.appendChild(this.minigrid);
    }

    set_rotation(rotation) {
        this.rotation = Math.max(Math.min(rotation, 1), 0);
        if ((this.rotation == 0.0) || (this.rotation == 0.0)) {
            this.elem.style.transform = "";
        } else {
            let scale = Math.abs(2.0 * this.rotation - 1.0) * 100.0;
            //let scale = (1.0 - Math.sin(Math.PI * this.rotation)) * 100.0;
            this.elem.style.transform = "scaleY(" + scale + "%)";
        }
        this.update_class();
    }

    set_scale(scale) {
        if (scale == 1) {
            this.elem.style.transform = "";
            return;
        }
        scale *= 100.0;
        this.elem.style.transform = "scale(" + scale + "%)";
    }

    set_state(state) {
        this.state = state;
        this.update_class();
    }

    get_state(state) {
        return this.state;
    }

    update_class() {
        if (this.rotation >= 0.5) {
            this.elem.className = this.state
        } else {
            this.elem.className =
                (this.elem.textContent == "") ? "empty" : "entry";
        }
    }

}