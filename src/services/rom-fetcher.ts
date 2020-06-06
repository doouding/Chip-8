export const romMap = {
    'pong': 'PONG',
    'brix': 'BRIX'
};

export function fetcher(name: keyof typeof romMap) {
    return fetch(romMap[name], {
        method: 'get'
    })
    .then((res) => res.arrayBuffer());
}
