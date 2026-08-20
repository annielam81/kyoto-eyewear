export const money = (n: number) => '$' + (Number.isInteger(n) ? n.toString() : n.toFixed(2));
