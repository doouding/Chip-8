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
        0x4: 'Q',
        0x5: 'W',
        0x6: 'E',
        0xD: 'R',
        0x7: 'A',
        0x8: 'S',
        0x9: 'D',
        0xE: 'F',
        0xA: 'Z',
        0x0: 'X',
        0xB: 'C',
        0xF: 'V'
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
