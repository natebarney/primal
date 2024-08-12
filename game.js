let params;
let require_prime;
let prime_guide;

class Game {

    constructor(digit_count, max_guesses, seed) {

        this.digit_count = digit_count
        this.max_guesses = max_guesses

        this.anim_frame_rate = 60.0;
        this.flip_duration = 500.0;
        this.bounce_duration = 50.0;
        this.bounce_max = 0.10;
        this.shake_duration = 500.0;
        this.shake_cycles = 4;
        this.shake_max = 0.08;
        this.error_duration = 2000.0;
        this.error_fade = 250.0;
        this.entry_queue = []

        let rnd = new Random(seed);
        this.seed = rnd.seed;
        this.primes = prime_sieve(Math.floor(Math.pow(10.0, digit_count)));
        this.prefix = prefix_tree(this.primes, digit_count);
        let p = random_prime(this.primes, digit_count, rnd);
        p = "" + p;
        while (p.length < digit_count) {
            p = "0" + p;
        }
        this.p = p.split("");
    }

    reset() {
        let div = document.getElementById("game");
        div.innerHTML = "";
        let table = document.createElement("table");
        table.id = "gameTable";
        table.className = "game";
        div.appendChild(table);
        this.cells = []
        for (let r = 0; r < this.max_guesses; ++r) {
            let tr = document.createElement("tr");
            let cellrow = [];
            table.appendChild(tr);
            for (let c = 0; c < this.digit_count; ++c) {
                let td = document.createElement("td");
                tr.appendChild(td);
                let cell = new Cell(td);
                cellrow.push(cell);
            }
            this.cells.push(cellrow);
        }
        for (let i = 0; i < 10; ++i) {
            document.getElementById("" + i).className = "available";
        }
        document.getElementById("enter").className = "available";
        document.getElementById("backspace").className = "available";
        document.getElementById("permalink").href = "?seed=" + this.seed;
        document.getElementById("keyboard").className = "";
        document.getElementById("header").textContent = "Primal #" + this.seed
        this.guesses = []
        this.entry = []
        this.state = "guessing";
        this.update_prime_guide();
    }

    send_key(key) {
        if (game.state == "bouncing") {
            this.entry_queue.push(key);
            return;
        } else if (game.state != "guessing") {
            return;
        }

        let r = this.guesses.length;
        let c = this.entry.length;
        if (c >= this.digit_count) {
            return;
        }
        let cell = this.cells[r][c];
        cell.set_content(key);
        this.entry.push(key);
        this.bounce_cell(cell);
    }

    backspace() {
        if (game.state == "bouncing") {
            this.entry_queue.push("backspace");
            return;
        } else if (game.state != "guessing") {
            return;
        }

        let r = this.guesses.length;
        let c = this.entry.length;
        if (c == 0) {
            return;
        }
        let cell = this.cells[r][c - 1];
        cell.set_content("");
        this.entry.pop();
        this.update_prime_guide();
    }

    process_entry_queue() {
        if (this.entry_queue.length == 0) {
            return;
        }
        let key = this.entry_queue.shift();
        if (key == "backspace") {
            this.backspace();
        } else {
            this.send_key(key);
        }
    }

    valid_guess() {
        if (this.entry.length != this.digit_count) {
            return false;
        }

        if (require_prime.checked) {
            let guess = parseInt(this.entry.join(""), 10);
            return binary_search(this.primes, guess) >= 0;
        }

        return true;
    }

    check_guess() {

        let r = this.guesses.length;
        if ((r >= this.max_guesses) || (this.entry.length < this.digit_count)) {
            return;
        }

        let count = []
        let remaining = []

        for (let i = 0; i < 10; ++i) {
            count["" + i] = 0;
        }

        for (let i = 0; i < this.digit_count; ++i) {
            ++count[this.p[i]];
            remaining[i] = true;
        }

        for (let i = 0; i < this.digit_count; ++i) {
            if (this.entry[i] == this.p[i]) {
                this.cells[r][i].set_state("correct");
                --count[this.entry[i]];
                remaining[i] = false;
            }
        }

        for (let i = 0; i < this.digit_count; ++i) {
            if (!remaining[i]) {
                continue;
            }
            if (count[this.entry[i]] > 0) {
                this.cells[r][i].set_state("misplaced");
                --count[this.entry[i]];
                remaining[i] = false;
                continue;
            }
        }

        for (let i = 0; i < this.digit_count; ++i) {
            if (!remaining[i]) {
                continue;
            }
            remaining[i] = false;
            this.cells[r][i].set_state("none");
        }
    }

    submit_guess() {
        if ((game.state != "guessing") ||
            (this.entry.length < this.digit_count)) {
            return;
        }

        if (this.valid_guess()) {
            this.check_guess();
            this.guesses.push(this.entry);
            this.entry = []
            this.flip_digits();
        } else {
            this.shake_guess();
            let guess = parseInt(this.entry.join(""), 10)
            let factors = factor(guess, this.primes);
            let error = "Not a prime number";
            if (factors.length > 0) {
                error += "<br>" + guess + " = ";
                let pairs = run_length_encoding(factors);
                let terms = []
                for (let pair of pairs) {
                    let term = "" + pair[0];
                    if (pair[1] > 1) {
                        term += '<span class="exponent">' + pair[1] + "</span>";
                    }
                    terms.push(term);
                }
                error += terms.join(" &times; ");
            }
            this.show_error(error);
        }
    }

    check_game_over() {

        if (this.guesses.length == 0) {
            return;
        }

        let row = this.guesses.length - 1;
        let guess = this.guesses[row];

        let correct = 0;
        for (let i = 0; i < this.digit_count; ++i) {
            if (guess[i] == this.p[i]) {
                ++correct;
            }
        }

        if (correct == this.digit_count) {
            this.state = "won";
            document.getElementById("footer").className = "";
            return;
        }

        if (this.guesses.length == this.max_guesses) {
            this.state = "lost";
            document.getElementById("footer").className = "";
            this.show_answer();
            return;
        }
    }

    shake_guess() {
        let row = this.guesses.length;
        if (row >= this.max_guesses) {
            return;
        }

        let cell = this.cells[row][0];
        let tr = cell.elem.parentElement;
        this.state = "shaking";
        this.anim_id = setInterval(
            () => this.shake_handler(tr),
            1000.0 / this.anim_frame_rate
        );
        this.frame = 0;
    }

    bounce_cell(cell) {
        this.state = "bouncing";
        this.anim_id = setInterval(
            () => this.bounce_handler(cell),
            1000.0 / this.anim_frame_rate
        );
        this.frame = 0;
    }

    flip_digits() {
        this.state = "flipping";
        this.anim_id = setInterval(
            () => this.flip_handler(),
            1000.0 / this.anim_frame_rate
        );
        this.frame = 0;
    }

    stop_animation() {
        clearInterval(this.anim_id);
        this.anim_id = undefined;
        this.frame = undefined;
        this.state = "guessing";
    }

    flip_handler() {
        if (this.guesses.length == 0) {
            this.stop_animation();
            return;
        }

        let flip_frames =
            Math.floor(this.flip_duration * this.anim_frame_rate / 1000.0);
        let row = this.guesses.length - 1;
        let col = Math.floor(this.frame / flip_frames);

        if (col >= this.cells[row].length) {
            this.stop_animation();
            this.update_keyboard();
            this.check_game_over();
            this.update_prime_guide();
            return;
        }

        let cell = this.cells[row][col];
        let flip_frame = this.frame % flip_frames;
        cell.set_rotation(flip_frame / (flip_frames - 1));
        ++this.frame;
    }

    bounce_handler(cell) {

        let bounce_frames =
            Math.floor(this.bounce_duration * this.anim_frame_rate / 1000.0);
        if (this.frame >= bounce_frames) {
            this.stop_animation();
            cell.set_scale(1);
            this.update_prime_guide();
            this.process_entry_queue();
            return;
        }

        let scale = this.frame / bounce_frames;
        scale = Math.sin(Math.PI * scale) * this.bounce_max + 1.0;
        cell.set_scale(scale);

        ++this.frame;
    }

    shake_handler(tr) {

        let shake_frames =
            Math.floor(this.shake_duration * this.anim_frame_rate / 1000.0);
        if (this.frame >= shake_frames) {
            tr.style.transform = "";
            this.stop_animation();
            this.state = "error";
            return;
        }

        let amp = tr.getBoundingClientRect().height * this.shake_max;
        let t = this.frame / shake_frames;
        let offset = Math.floor(-amp * Math.sin(Math.PI * t) *
            Math.sin(this.shake_cycles * 2.0 * Math.PI * t));
        tr.style.transform = "translate(" + offset + "px, 0)";

        ++this.frame;
    }

    update_keyboard()
    {
        if (this.guesses.length == 0) {
            return;
        }

        let row = this.guesses.length - 1;
        let keys = [];
        let states = [];

        for (let i = 0; i < 10; ++i) {
            let c = "" + i;
            let key = document.getElementById(c);
            keys[c] = key;
            states[c] = key.className;
        }

        for (let cell of this.cells[row]) {

            let c = cell.get_content();
            let key = keys[c];
            if (!key) {
                continue;
            }

            switch (cell.get_state()) {

            case "correct":
                states[c] = "correct";
                break;

            case "misplaced":
                if (states[c] != "correct") {
                    states[c] = "misplaced";
                }
                break;

            case "none":
                if ((states[c] != "correct") && (states[c] != "misplaced")) {
                    states[c] = "none";
                }
            }
        }

        for (let i = 0; i < 10; ++i) {
            let c = "" + i;
            let key = keys[c];
            if (!key) {
                continue;
            }
            key.className = states[c];
        }
    }

    update_prime_guide() {
        if (this.state != "guessing") {
            return;
        }
        let row = this.guesses.length;
        if (row >= this.max_guesses) {
            return;
        }
        let col = this.entry.length;
        if (col >= this.digit_count) {
            return;
        }

        if (prime_guide.checked) {
            let tree = this.prefix;
            for (let entry of this.entry) {
                tree = tree[entry];
                if (!tree) {
                    tree = [];
                    break;
                }
            }
            this.cells[row][col].set_minigrid(Object.keys(tree));
            if (col + 1 < this.digit_count) {
                this.cells[row][col + 1].set_content("");
            }
        } else {
            this.cells[row][col].set_content("");
        }
    }

    show_answer() {
        let div = document.createElement("div");
        this.popup = div;
        div.className = "popup";
        div.textContent = this.p.join("");
        document.body.appendChild(div);
    }

    show_error(error) {
        let div = document.createElement("div");
        this.popup = div;
        div.className = "popup";
        div.innerHTML = error;
        document.body.appendChild(div);
        setTimeout(() => { this.fade_error(); }, this.error_duration);
    }

    fade_error() {
        this.frame = 0;
        this.anim_id = setInterval(
            () => { this.error_fade_handler(); },
            1000.0/ this.anim_frame_rate
        );
    }

    error_fade_handler() {

        let fade_frames =
            Math.floor(this.error_fade * this.anim_frame_rate / 1000.0);
        if (this.frame >= fade_frames) {
            this.stop_animation();
            document.body.removeChild(this.popup);
            this.popup = undefined;
            return;
        }

        let t = this.frame / fade_frames;
        this.popup.style.opacity = ((1.0 - t) * 100.0) + "%";

        ++this.frame;
    }
}

let game;

function key_handler(event) {
    if (event.defaultPrevented) {
        return;
    }

    switch (event.key)
    {
    case "0":
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
    case "7":
    case "8":
    case "9":
        game.send_key(event.key);
        break;

    case "Backspace":
        game.backspace();
        break;

    case "Enter":
        game.submit_guess();
        break;

    default:
        return;
    }

    event.preventDefault();
}

function init_game() {
    params = new URLSearchParams(window.location.search);
    game = new Game(5, 6, params.get("seed"));
    document.title = "Primal #" + game.seed;
    window.addEventListener("keydown", key_handler, true);

    require_prime = document.getElementById("require_prime");
    if ((!params.has("require_prime")) ||
        (params.get("require_prime") == "true")) {
        require_prime.checked = true;
    }
    require_prime.onchange = function() {
        if (require_prime.checked) {
            params.delete("require_prime");
        } else {
            params.set("require_prime", "false");
        }
    }

    prime_guide = document.getElementById("prime_guide");
    if ((!params.has("prime_guide")) ||
        (params.get("prime_guide") == "true")) {
        prime_guide.checked = true;
    }
    prime_guide.onchange = function() {
        if (prime_guide.checked) {
            params.delete("prime_guide");
        } else {
            params.set("prime_guide", "false");
        }
        game.update_prime_guide();
    }

    document.getElementById("options").className = "";
    game.reset();
}

function new_game() {
    params.delete("seed")
    window.location.search = params.toString();
}
