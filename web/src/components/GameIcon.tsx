import React from 'react';

type GameIconProps = {
  name: string;
  className?: string;
  rotate?: number;
};

export function GameIcon({ name, className = 'w-4 h-4', rotate = 0 }: GameIconProps) {
  return (
    <span
      aria-hidden
      className={`inline-block flex-shrink-0 ${className}`}
      style={{
        backgroundColor: 'currentColor',
        WebkitMaskImage: `url('./game-icons/${name}.svg')`,
        maskImage: `url('./game-icons/${name}.svg')`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
      }}
    />
  );
}

type KeyCapProps = {
  src: string;
  alt: string;
  className?: string;
};

export function KeyCap({ src, alt, className = 'h-7 w-auto' }: KeyCapProps) {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={`${className} object-contain select-none pointer-events-none`}
    />
  );
}

const KEYBINDS = './keybinds';

export const KeyAssets = {
  w: `${KEYBINDS}/keyboard_w.png`,
  a: `${KEYBINDS}/keyboard_a.png`,
  s: `${KEYBINDS}/keyboard_s.png`,
  d: `${KEYBINDS}/keyboard_d.png`,
  q: `${KEYBINDS}/keyboard_q.png`,
  e: `${KEYBINDS}/keyboard_e.png`,
  p: `${KEYBINDS}/keyboard_p.png`,
  esc: `${KEYBINDS}/keyboard_escape.png`,
  space: `${KEYBINDS}/keyboard_space.png`,
  tab: `${KEYBINDS}/keyboard_tab.png`,
  mouse: `${KEYBINDS}/mouse_scroll_outline.png`,
};
