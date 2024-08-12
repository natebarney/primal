class Random
{
    constructor(seed) {

        if (!seed)
        {
            seed = Math.floor(Math.random() * 0xffffff);
        }
        this.seed = seed % 0xffffff;
        if (!this.seed)
        {
            this.seed = 1;
        }

        this.state = this.seed;
        this.next();
    }

    shift() {
        let lfsr = this.state;
        let bit = ((lfsr >> 0) ^ (lfsr >> 1) ^ (lfsr >> 2) ^ (lfsr >> 7)) & 1;
        this.state = (lfsr >> 1) | (bit << 23);
        return bit;
    }

    next() {
        let n = 0;
        for (let i = 0; i < 25; ++i) {
            n = (n << 1) | this.shift();
        }
        return n;
    }

    random() {
        return this.next() / Math.pow(2.0, 25.0);
    }

    randint(n) {
        return Math.floor(this.random() * n);
    }
}