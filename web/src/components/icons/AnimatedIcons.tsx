import React from 'react';
import { GameIcon } from '../GameIcon';

export function RotateCcwIcon() {
  return (
    <span style={{ display: 'inline-flex' }} className="hover-rotate">
      <GameIcon name="clockwise-rotation" className="w-4 h-4" />
      <style>{`.hover-rotate:hover span { animation: spin-once 0.5s ease-in-out; } @keyframes spin-once { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }`}</style>
    </span>
  );
}
