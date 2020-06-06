export class Keyboard {
    keysPressed: {
        [index: string]: boolean
    } = {};
    static MAPPING: {
        [index: number]: string
    } = {
        0x1: '1',
        0x2: '2',
        0x3: '3',
        0xC: '4',
        0x4: 'q',
        0x5: 'w',
        0x6: 'e',
        0xD: 'r',
        0x7: 'a',
        0x8: 's',
        0x9: 'd',
        0xE: 'f',
        0xA: 'z',
        0x0: 'x',
        0xB: 'c',
        0xF: 'v'
    };

    constructor() {}

    onNextKeyPress(value: number, keyCode: string) {}

    clear() {
        this.keysPressed = {};
    }

    isKeyPressed(value: number) {
        const key = Keyboard.MAPPING[value];

        return !!this.keysPressed[key];
    }

    keyDown(e: KeyboardEvent) {
        const key = e.key;
        this.keysPressed[key] = true;

        for(let prop in Keyboard.MAPPING) {
            const keyCode = Keyboard.MAPPING[prop];

            if (keyCode === key) {
                this.onNextKeyPress && this.onNextKeyPress(parseInt(prop), keyCode);
                delete this.onNextKeyPress;
            }
        }
    }

    keyUp(e: KeyboardEvent) {
        const key = e.key;
        this.keysPressed[key] = false;
    }
}
