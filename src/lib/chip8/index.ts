import { CPU } from './cpu';

export class Chip8 {
    cpu: CPU;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    excutionLoop: number = 0;

    constructor(canvas: string | HTMLCanvasElement) {
        canvas = typeof canvas === 'string' ? document.querySelector<HTMLCanvasElement>(canvas) : canvas;
        if(!canvas) {
            throw new Error('Cannot find the canvas element');
        }

        this.cpu = new CPU(() => {
            this.render();
        });
        this.canvas = canvas;
        this.canvas.width = 64;
        this.canvas.height = 32;
        this.ctx = canvas.getContext('2d');
    }

    render() {
        const { screen } = this.cpu;
        const resolution = this.cpu.screen.resolution;
        const data = new Uint8ClampedArray(resolution * 4).fill(0);
        const graphicBitData = new ImageData(data, 64, 32);

        for(let i = 0; i < resolution; i++) {
            if(screen.bitMap[i]) {
                data[i * 4 + 3] = 255;
            }
        }

        this.ctx.putImageData(graphicBitData, 0, 0);
    }

    keyDown(e: KeyboardEvent) {
        this.cpu.input.keyDown(e);
    }

    keyUp(e: KeyboardEvent) {
        this.cpu.input.keyUp(e);
    }

    startExcute() {
        this.cpu.loop();
        this.excutionLoop = requestAnimationFrame(() => {
            this.startExcute();
        });
    }

    loadGame(game: Uint8Array) {
        cancelAnimationFrame(this.excutionLoop);
        this.cpu.reset();
        this.cpu.loadProgram(game);
        this.startExcute();
    }
}
