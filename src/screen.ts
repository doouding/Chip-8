export class Screen {
    rows: number = 32;
    columns: number = 64;
    resolution: number = this.rows * this.columns;
    bitMap: number[];

    constructor() {
        this.bitMap = new Array(this.resolution).fill(0);
    }

    clear() {
        this.bitMap = new Array(this.resolution).fill(0);
    }

    render() {}

    private overflow(x: number, y: number) {
        if (x > this.columns - 1) {
            while (x > this.columns - 1) {
                x -= this.columns;
            }
        }

        if (x < 0) {
            while (x < 0) {
                x += this.columns;
            }
        }

        if (y > this.rows - 1) {
            while (y > this.rows - 1) {
                y -= this.rows;
            }
        }

        if (y < 0) {
            while (y < 0) {
                y += this.rows;
            }
        }

        return {
            x,
            y
        }
    }

    setPixel(x: number, y: number) {
        const processed = this.overflow(x, y);
        x = processed.x;
        y = processed.y;

        const location = x + (y * this.columns);

        this.bitMap[location] = this.bitMap[location] ^ 1;

        return !this.bitMap[location];
    }
}
