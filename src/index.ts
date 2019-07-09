import { CPU } from './cpu';
import { Screen } from './screen';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const fileEl = document.getElementById('file') as HTMLInputElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
const chip8 = new CPU();

chip8.screen.render = function() {
    const self = this as Screen;
    const data = new Uint8ClampedArray(self.resolution * 4).fill(0);

    for(let i = 0; i < self.resolution; i++) {
        if (self.bitMap[i]) {
            data[i * 4 + 3] = 255;
        }
    }

    const imageData = new ImageData(data, 64, 32);
    ctx.putImageData(imageData, 0, 0);
}

fileEl.addEventListener('change', function fileChange() {
    const file = this.files[0];

    if(!file) {
        return;
    }

    const reader = new FileReader();

    reader.addEventListener('load', (e) => {
        chip8.reset();
        chip8.rom 
    }, false);
    reader.onload = function(e) {
        chip8.reset();
        chip8.rom = new Uint8Array(reader.result as ArrayBuffer);
        chip8.loadProgram(chip8.rom);

        if(chip8._loop) {
            cancelAnimationFrame(chip8._loop);
            chip8._loop = null;
        }

        chip8._loop = requestAnimationFrame(function loop() {
            chip8.cycle();
            chip8._loop = requestAnimationFrame(loop);
        });
    };
    reader.readAsArrayBuffer(file);
}, false);

document.addEventListener('keydown', (e) => {
    chip8.input.keyDown(e);
}, false);

document.addEventListener('keyup', (e) => {
    chip8.input.keyUp(e);
}, false);

(window as any).chip8 = chip8;
