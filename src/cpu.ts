import { Screen } from './screen';
import { Keyboard } from './keyboard';
import { Speaker } from './speaker';

interface IInstruction {
    [index: number]: () => void;
}

export class CPU {
    // PC 寄存器
    pc = 0x200;

    _loop: number | null = null;

    // 堆栈指针
    stack: number[] = [];

    // rom 文件
    rom: Uint8Array = new Uint8Array(0);

    // 显示（输出）
    screen: Screen = new Screen();

    // 键盘（输入）
    input: Keyboard = new Keyboard();

    // 声音
    speaker: Speaker = new Speaker();

    // V0 ~ VF 寄存器
    v = new Uint8Array(16);

    // 4K 内存
    memory = new Uint8Array(4096);

    // 地址指针
    i = 0;

    // 延时计时器
    delayTimer = 0;

    // 声音计时器
    soundTimer = 0;

    // 暂停
    paused = false;

    /**
     * 一个 requestAnimationFrame 周期内执行几条指令
     */
    cycle = 10;

    constructor() {}

    reset() {
        this.pc = 0x200;
        this.stack = new Array();
        this.v = new Uint8Array(16);
        this.i = 0;
        this.memory = new Uint8Array(4096);
        this.delayTimer = 0;
        this.soundTimer = 0;
        this.screen.clear();
        this.input.clear();
        this.speaker.stop();
        this.loadFonts();
        this.paused = false;
    }

    loadFonts() {
        const fonts = [
            0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
            0x20, 0x60, 0x20, 0x20, 0x70, // 1
            0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
            0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
            0x90, 0x90, 0xF0, 0x10, 0x10, // 4
            0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
            0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
            0xF0, 0x10, 0x20, 0x40, 0x40, // 7
            0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
            0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
            0xF0, 0x90, 0xF0, 0x90, 0x90, // A
            0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
            0xF0, 0x80, 0x80, 0x80, 0xF0, // C
            0xE0, 0x90, 0x90, 0x90, 0xE0, // D
            0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
            0xF0, 0x80, 0xF0, 0x80, 0x80  // F
        ];

        for (let i = 0; i < fonts.length; i++) {
            this.memory[i] = fonts[i];
        }
    }

    loadProgram(program: Uint8Array) {
        for (let i = 0; i < program.length; i++) {
            this.memory[0x200 + i] = program[i];
        }
    }

    loop() {
        for (let i = 0; i < this.cycle; i++) {
            if (!this.paused) {
                const opcode = this.memory[this.pc] << 8 | this.memory[this.pc + 1];
                this.perform(opcode);
            }
        }

        if (!this.paused) {
            this.updateTimers();
        }

        this.playSound();
        this.render();
    }

    render() {
        this.screen.render();
    }

    perform(opcode: number) {
        this.pc += 2;

        const self = this;
        const V = self.v;
        const NNN = opcode & 0x0fff;
        const KK = opcode & 0x00ff;
        const N = opcode & 0x000f;
        const X = (opcode & 0x0F00) >> 8;
        const Y = (opcode & 0x00F0) >> 4;

        const instructions: IInstruction = {
            0x000() {
                const op = ({
                    // 00E0
                    0xE0() {
                        self.screen.clear();
                    },
                    // 00EE
                    0xEE() {
                        self.pc = self.stack.pop();
                    }
                } as IInstruction)[opcode & 0x00FF];

                op && op();
            },
            // 1nnn
            0x1000() {
                self.pc = NNN;
            },
            // 2nnn
            0x2000() {
                self.stack.push(self.pc);
                self.pc = NNN;
            },
            // 3xkk
            0x3000() {
                if(V[X] === KK) {
                    self.pc += 2;
                }
            },
            // 4xkk
            0x4000() {
                if(V[X] !== KK) {
                    self.pc += 2;
                }
            },
            // 5xy0
            0x5000() {
                if(V[X] === V[Y]) {
                    self.pc += 2;
                }
            },
            // 6xkk
            0x6000() {
                V[X] = KK;
            },
            // 7xkk
            0x7000() {
                V[X] += KK;
            },
            0x8000() {
                ({
                    // 8xy0
                    0() {
                        V[X] = V[Y];
                    },
                    // 8xy1
                    1() {
                        V[X] = V[X] | V[Y];
                    },
                    // 8xy2
                    2() {
                        V[X] = V[X] & V[Y];
                    },
                    // 8xy3
                    3() {
                        V[X] = V[X] ^ V[Y];
                    },
                    // 8xy4
                    4() {
                        const sum = V[X] + V[Y];

                        V[0xF] = sum > 255 ? 1 : 0;
                        V[X] = sum;
                    },
                    // 8xy5
                    5() {
                        V[0xF] = V[X] > V[Y] ? 1 : 0;
                        V[X] = V[X] - V[Y];
                    },
                    // 8xy6
                    6() {
                        V[0xF] = V[X] & 0x1;
                        V[X] = V[X] >> 1;
                    },
                    // 8xy7
                    7() {
                        V[0xF] = V[Y] > V[X] ? 1 : 0;
                        V[X] = V[Y] - V[X];
                    },
                    // 8xyE
                    0xE() {
                        V[0xF] = V[X] & 0x80;
                        V[X] = V[X] << 1;
                    }
                } as IInstruction)[opcode & 0xF]();
            },
            // 9xy0
            0x9000() {
                if(V[X] !== V[Y]) {
                    self.pc += 2;
                }
            },
            // Annn
            0xA000() {
                self.i = NNN;
            },
            // Bnnn
            0xB000() {
                self.pc = NNN + V[0];
            },
            // Cxkk
            0xC000() {
                V[X] = Math.floor(Math.random() * 256) & KK;
            },
            // Dxyn
            0xD000() {
                let row, col, sprite
                    , width = 8
                    , height = opcode & 0x000F;//取得N（图案的高度）

                self.v[0xF] = 0;//初始化VF为0

                for (row = 0; row < height; row++) {//对于每一行
                    sprite = self.memory[self.i + row];//取得内存I处的值，pixel中包含了一行的8个像素

                    for (col = 0; col < width; col++) {//对于一行的8个像素 
                        if ((sprite & 0x80) > 0) {//依次检查新值中每一位是否为1 
                            if (self.screen.setPixel(self.v[X] + col, self.v[Y] + row)) {//如果显示缓存gfx[]里该像素也为1，则发生了碰撞
                                self.v[0xF] = 1;//设置VF为1  
                            }
                        }
                        sprite = sprite << 1;
                    }
                }
            },
            0xE000() {
                ({
                    // Ex9E
                    0x9E() {
                        if(self.input.isKeyPressed(V[X])) {
                            self.pc += 2;
                        }
                    },
                    // ExA1
                    0xA1() {
                        if(!self.input.isKeyPressed(V[X])) {
                            self.pc += 2;
                        }
                    }
                } as IInstruction)[opcode & 0x00FF]();
            },
            0xF000() {
                ({
                    0x07() {
                        V[X] = self.delayTimer;
                    },
                    0x0A() {
                        self.paused = true;
                        self.input.onNextKeyPress = (key: number) => {
                            V[X] = key;
                            self.paused = false;
                        }
                    },
                    0x15() {
                        self.delayTimer = V[X];
                    },
                    0x18() {
                        self.soundTimer = V[X];
                    },
                    0x1E() {
                        self.i += V[X];
                    },
                    0x29() {
                        self.i = V[X] * 5;
                    },
                    0x33() {
                        self.memory[self.i] = V[X] / 100;
                        self.memory[self.i + 1] = V[X] % 100 / 10;
                        self.memory[self.i + 2] = V[X] % 10;
                    },
                    0x55() {
                        for (let i = 0; i <= X; i++) {
                            self.memory[self.i + i] = V[i];
                        }
                    },
                    0x65() {
                        for (let i = 0; i <= X; i++) {
                            V[i] = self.memory[self.i + i];
                        }
                    }
                } as IInstruction)[opcode & 0x00FF]();
            }
        }

        instructions[0xF000 & opcode]()
    }

    /**
    * 更新CPU延迟和声音计时器 
    */
    updateTimers() {
        if (this.delayTimer > 0) this.delayTimer -= 1;//递减至0
        if (this.soundTimer > 0) this.soundTimer -= 1;//递减至0
    }

    playSound() {
        if (this.soundTimer > 0) {
            this.speaker.play();
        } else {
            this.speaker.stop();
        }
    }
}
