export function sumBy<T>(array: T[], getNumber: (a: T) => number): number {
    let sum = 0;
    for (let a of array) {
        sum += getNumber(a);
    }

    return sum;
}

export function productBy<T>(array: T[], getNumber: (a: T) => number): number {
    let product = 1;
    for (let a of array) {
        product *= getNumber(a);
    }

    return product;
}

type Maybe<T> = {
    kind: 'Just'
    value: T
} | {
    kind: 'Nothing'
}

export function orElse<T>(maybe: Maybe<T>, alternative: T): T {
    return (maybe.kind === 'Just') ? maybe.value : alternative;
}

export function maxBy<T>(array: T[], getNumber: (a: T) => number): Maybe<T> {
    if (array.length === 0) {
        return {kind: 'Nothing'}
    }

    let max = array[0]

    for (let a of array) {
        max = (getNumber(a) > getNumber(max)) ? a : max;
    }

    return {kind: 'Just', value: max};
}

export function minBy<T>(array: T[], getNumber: (a: T) => number): Maybe<T> {
    if (array.length === 0) {
        return {kind: 'Nothing'}
    }

    let max = array[0]

    for (let a of array) {
        max = (getNumber(a) < getNumber(max)) ? a : max;
    }

    return {kind: 'Just', value: max};
}

export function range(n: number): number[] {
    let retVal: number[] = [];

    for (let i = 0; i < n; i++) {
        retVal.push(i);
    }

    return retVal;
}