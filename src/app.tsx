import './app.less';

import React, { useState } from 'react';
import { Emulator } from './components/Emulator/index';
import { GameSelect } from './components/GameSelect/index';
import { romMap, fetcher } from './services/rom-fetcher'

export const App = function() {
    const [game, setGame] = useState<ArrayBuffer>(null);
    const keys = Object.keys(romMap);
    const onSelect = async (name: keyof typeof romMap) => {
        const game = await fetcher(name);

        setGame(game);
    };
    const GameList = keys.map((name) => <GameSelect key={ name } name={ name } onSelect={ onSelect } />)

    return <div className="game-machine">
        <h1 className="game-machine__title">Chip 8 Emulator</h1>
        <div className="game-machine__list">
            <div className="title">Choose A Game:</div>
            <div className="list">{ GameList }</div>
        </div>
        <Emulator
            width={ 500 }
            height={ 500 }
            game={ game }
        ></Emulator>
        <p className="game-machine__description">
        Description: Different game may use different key map. Checkout the list to find key map of each game.(You need to keep you Caps Lock off to play the game)
        </p>
        <ul className="game-machine__keymap">
            <li>PONG: <code>1</code>, <code>Q</code>, <code>4</code>, <code>R</code></li>
            <li>BRIX: <code>Q</code>, <code>E</code></li>
        </ul>
    </div>;
}
