import React, { useEffect, useRef, useState } from "react";
import { Chip8 } from '../../lib/chip8/index';
import './index.less';

export const Emulator = function(props: { width: number, height: number, game: ArrayBuffer | null }) {
    const [emulator, setEmulator] = useState<Chip8>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const chip8 = new Chip8(canvasRef.current);
        const keydownHandler = (e: KeyboardEvent) => {
            chip8.keyDown(e);
        };
        const keyupHandler = (e: KeyboardEvent) => {
            chip8.keyUp(e);
        };

        setEmulator(chip8);

        document.addEventListener('keydown', keydownHandler);
        document.addEventListener('keyup', keyupHandler);

        return () => {
            document.removeEventListener('keydown', keydownHandler);
            document.removeEventListener('keyup', keyupHandler);
        }
    }, []);

    useEffect(() => {
        if(props.game) {
            emulator.loadGame(new Uint8Array(props.game));
        }
    }, [props.game])

    return <main
        className="emulator-container"
    >
        <canvas
            className="emulator-container__canvas"
            ref={ canvasRef }
        >
        </canvas>
    </main>
}
