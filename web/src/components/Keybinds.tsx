import React from 'react';
import { KeyAssets, KeyCap } from './GameIcon';

type Hint = {
  keys: { src: string; alt: string; wide?: boolean }[];
  label: string;
};

export default function Keybinds({ checkoutLabel }: { checkoutLabel: string }) {
  const hints: Hint[] = [
    { keys: [{ src: KeyAssets.w, alt: 'W' }], label: 'UP' },
    { keys: [{ src: KeyAssets.s, alt: 'S' }], label: 'DOWN' },
    { keys: [{ src: KeyAssets.a, alt: 'A' }], label: 'LEFT' },
    { keys: [{ src: KeyAssets.d, alt: 'D' }], label: 'RIGHT' },
    { keys: [{ src: KeyAssets.q, alt: 'Q' }], label: 'PREV' },
    { keys: [{ src: KeyAssets.e, alt: 'E' }], label: 'NEXT' },
    { keys: [{ src: KeyAssets.mouse, alt: 'Scroll' }], label: 'ZOOM' },
    { keys: [{ src: KeyAssets.esc, alt: 'ESC', wide: true }], label: 'EXIT' },
    { keys: [{ src: KeyAssets.tab, alt: 'TAB', wide: true }], label: checkoutLabel },
  ];

  return (
    <div className="flex items-center justify-center gap-3.5">
      {hints.map((hint, index) => (
        <React.Fragment key={hint.label}>
          {index > 0 && (
            <span className="font-barlow font-medium text-[22px] text-white/70 leading-none select-none">/</span>
          )}
          <div className="flex items-center gap-2">
            {hint.keys.map((key) => (
              <KeyCap
                key={key.alt}
                src={key.src}
                alt={key.alt}
                className={key.wide ? 'h-7 w-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]' : 'h-7 w-7 drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]'}
              />
            ))}
            <span className="font-barlow font-semibold text-[20px] text-white uppercase tracking-[0.12em] leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
              {hint.label}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
