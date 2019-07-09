import { Screen } from './screen';
import { Keyboard } from './keyboard';
import { Speaker } from './speaker';

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
        const x = (opcode & 0x0F00) >> 8;
        const y = (opcode & 0x00F0) >> 4;
        const NNN = opcode & 0x0FFF;
        const NN = opcode & 0x00FF;

        ({
            0x0000() {
                let r = ({
                    //00E0
                    //执行“清理屏幕”
                    0x00E0() {
                        self.screen.clear();
                    },
                    //00EE
                    //执行“从子函数返回”
                    0x00EE() {
                        self.pc = self.stack.pop();
                    }
                } as {
                    [index: number]: () => void
                })[opcode];
                if (r) r();
            },
            //1NNN
            //跳转到地址:NNN
            //例如：0x1222 则跳转到 0x0222
            0x1000() {
                self.pc = NNN;
            },
            //2NNN
            //解释器递增堆栈指针,然后跳转到地址:NNN
            0x2000() {
                self.stack.push(self.pc);
                self.pc = NNN;
            },
            //3XNN
            // if(Vx==NN) 将程序计数器递增2 跳过
            0x3000() {
                if (self.v[x] == NN) self.pc += 2;
            },
            //4XNN
            //if(Vx!=NN)  将程序计数器递增2 跳过
            0x4000() {
                if (self.v[x] != NN) self.pc += 2;
            },
            //5XY0
            //if(Vx==Vy) 将程序计数器递增2 跳过
            0x5000() {
                if (self.v[x] == self.v[y]) self.pc += 2;
            },
            //6XNN
            //设置 Vx=NN
            0x6000() {
                self.v[x] = NN;
            },
            //7XNN
            //设置 Vx+=NN
            0x7000() {
                self.v[x] += NN;
            },
            //8XY0
            0x8000() {
                ({
                    //8XY0
                    //Vx=Vy
                    0x0000() {
                        self.v[x] = self.v[y];
                    },
                    //8XY1
                    //设置 Vx=Vx|Vy
                    0x0001() {
                        self.v[x] = self.v[x] | self.v[y];
                    },
                    //8XY2
                    //Vx=Vx&Vy
                    0x0002() {
                        self.v[x] = self.v[x] & self.v[y];
                    },
                    //8XY3
                    //Vx=Vx^Vy
                    0x0003() {
                        self.v[x] = self.v[x] ^ self.v[y];
                    },
                    //8XY4
                    //Vx += Vy
                    0x0004() {
                        var sum = self.v[x] + self.v[y];
                        if (sum > 0xFF) {//即VY+VX > 255 
                            self.v[0xF] = 1;//出现了溢出，则把VF置为1
                        } else {
                            self.v[0xF] = 0;//没有溢出VF置为0
                        }
                        self.v[x] = sum;
                    },
                    //8XY5
                    //Vx -= Vy
                    0x0005() {
                        if (self.v[x] > self.v[y]) {
                            self.v[0xF] = 1;
                        } else {
                            self.v[0xF] = 0;
                        }
                        self.v[x] = self.v[x] - self.v[y];
                    },
                    //8XY6
                    //Vx=Vy=Vy>>1
                    0x0006() {
                        self.v[0xF] = self.v[x] & 0x01;
                        self.v[x] = self.v[x] >> 1;
                    },
                    //8XY7
                    //Vx=Vy-Vx
                    0x0007() {
                        if (self.v[x] > self.v[y]) {
                            this.v[0xF] = 0;
                        } else {
                            self.v[0xF] = 1;
                        }
                        self.v[x] = self.v[y] - self.v[x];
                    },
                    //8XYE
                    //Vx=Vy=Vy<<1
                    0x000E() {
                        self.v[0xF] = self.v[x] & 0x80;
                        self.v[x] = self.v[x] << 1;
                    }
                } as {
                    [index: number]: () => void
                })[opcode & 0x000F]();
            },
            //if(Vx!=Vy)  将程序计数器递增2 跳过
            0x9000() {
                if (self.v[x] != self.v[y]) self.pc += 2;
            },
            //ANNN
            //设置 I = NNN
            0xA000() {
                self.i = NNN;
            },
            //BNNN
            //跳转到的位置NNN + V0
            0xB000() {
                self.pc = NNN + self.v[0];
            },
            //CXNN
            //Vx=(随机0至255)&NN
            0xC000() {
                self.v[x] = Math.floor(Math.random() * 0xFF) & NN;
            },
            //DXYN
            //绘画指令
            0xD000() {
                var row, col, sprite
                    , width = 8
                    , height = opcode & 0x000F;//取得N（图案的高度）

                self.v[0xF] = 0;//初始化VF为0

                for (row = 0; row < height; row++) {//对于每一行
                    sprite = self.memory[self.i + row];//取得内存I处的值，pixel中包含了一行的8个像素

                    for (col = 0; col < width; col++) {//对于一行的8个像素 
                        if ((sprite & 0x80) > 0) {//依次检查新值中每一位是否为1 
                            if (self.screen.setPixel(self.v[x] + col, self.v[y] + row)) {//如果显示缓存gfx[]里该像素也为1，则发生了碰撞
                                self.v[0xF] = 1;//设置VF为1  
                            }
                        }
                        sprite = sprite << 1;
                    }
                }
            },
            0xE000() {
                ({
                    //EX9E
                    //if(key()==Vx)  将程序计数器递增2 跳过
                    0x009E() {
                        if (self.input.isKeyPressed(self.v[x])) self.pc += 2;
                    },
                    //EXA1
                    //if(key()!=Vx)  将程序计数器递增2 跳过
                    0x00A1() {
                        if (!self.input.isKeyPressed(self.v[x])) self.pc += 2;
                    }
                } as {
                    [index: number]: () => void
                })[NN]();
            },
            0xF000() {
                ({
                    //FX07
                    //Vx = delayTimer
                    0x0007() {
                        self.v[x] = self.delayTimer;
                    },
                    //FX0A
                    //Vx =input_key
                    0x000A() {
                        self.paused = true;
                        self.input.onNextKeyPress = function(key: number) {
                            self.v[x] = key;
                            self.paused = false;
                        }.bind(self);
                    },
                    //FX15
                    //delayTimer=Vx                            
                    0x0015() {
                        self.delayTimer = self.v[x];
                    },
                    //FX18
                    //soundTimer=Vx
                    0x0018() {
                        self.soundTimer = self.v[x];
                    },
                    //FX1E
                    //I +=Vx
                    0x001E() {
                        self.i += self.v[x];
                    },
                    //FX29
                    //I=sprite_addr[Vx],一般用4x5字体表示
                    0x0029() {
                        self.i = self.v[x] * 5;
                    },
                    //FX33
                    //reg_dump(Vx,&I)   
                    0x0033() {
                        self.memory[self.i] = self.v[x] / 100;//取得十进制百位
                        self.memory[self.i + 1] = self.v[x] % 100 / 10;//取得十进制十位
                        self.memory[self.i + 2] = self.v[x] % 10;//取得十进制个位
                    },
                    //FX55
                    //reg_load(Vx,&I)
                    0x0055() {
                        for (var i = 0; i <= x; i++) {
                            self.memory[self.i + i] = self.v[i];
                        }
                    },
                    //FX65
                    //I +=Vx
                    0x0065() {
                        for (var i = 0; i <= x; i++) {
                            self.v[i] = self.memory[self.i + i];
                        }
                    }
                } as {
                    [index: number]: () => void
                })[NN]();
            }
        } as {
            [index: number]: () => void
        })[opcode & 0xF000]();
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
