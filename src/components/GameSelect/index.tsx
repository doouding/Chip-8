import './index.less';

import React from 'react';

export function GameSelect(props: { name: string, onSelect: (name: string) => void }) {
    return <button
        type="button"
        className="game-select-btn"
        onClick={ ()=> {
            props.onSelect(props.name);
        }}
    >{ props.name }</button>
}
