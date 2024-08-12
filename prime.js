function random_prime(primes, max_digits, rnd) {
    if (!rnd) {
        rnd = new Random();
    }
    let max = Math.pow(10, max_digits);
    let r = rnd.randint(max);
    let index = binary_search(primes, r);
    index = ((index < 0) ? -index : (index + 1))  % primes.length;
    return primes[index]
}

function prime_sieve(max) {
    sieve = [false, false]
    for (let i = 2; i < max; ++i) {
        sieve.push(true);
    }
    let p = 1;
    while (true) {
        do {
            ++p;
        } while ((p < max) && (!sieve[p]));
        if (p >= max) {
            break;
        }
        let n = p;
        while (true) {
            n += p;
            if (n >= max) {
                break;
            }
            sieve[n] = false;
        }
    }
    let primes = [];
    for (let i = 2; i < max; ++i) {
        if (sieve[i]) {
            primes.push(i);
        }
    }
    return primes
}

function factor(n, primes) {
    let factors = []
    let index = 0;
    while ((n > 1) && (index < primes.length)) {
        let prime = primes[index];
        if (n % prime == 0) {
            factors.push(prime);
            n /= prime;
        } else {
            ++index;
        }
    }
    return factors;
}
