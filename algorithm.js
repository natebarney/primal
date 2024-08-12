
function prefix_tree(values, max_digits) {
    let root = [];
    for (let value of values) {
        let digits = ("" + value).split("");
        while (digits.length < max_digits) {
            digits.unshift("0");
        }
        let tree = root;
        for (let digit of digits) {
            if (!(digit in tree)) {
                tree[digit] = []
            }
            tree = tree[digit];
        }
    }
    return root;
}

function binary_search(haystack, needle) {
    let left = 0;
    let right = haystack.length;

    while (left < right) {
        let pivot = Math.floor((left + right) / 2);
        let value = haystack[pivot];
        if (value == needle) {
            return pivot;
        } else if (needle < value) {
            right = pivot;
        } else {
            left = pivot + 1;
        }
    }

    return -left;
}

function run_length_encoding(seq) {
    let runs = []

    if (seq.length == 0) {
        return runs;
    }

    let last = seq[0];
    let count = 1;
    for (let i = 1; i < seq.length; ++i) {
        let cur = seq[i];
        if (cur == last) {
            ++count;
        } else {
            runs.push([last, count]);
            last = cur;
            count = 1;
        }
    }

    runs.push([last, count]);
    return runs;
}
