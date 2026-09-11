import React from 'react';
import { KeyAssets, KeyCap } from './GameIcon';

export const MAIN_TABS = [
  'FACE & BODY',
  'FACE ADJUSTMENTS',
  'OVERLAYS',
  'HAIR',
  'APPAREL',
  'TATTOOS'
];

export default function Navigation({ 
  tabs = MAIN_TABS,
  activeMainTab, 
  onSelectTab 
}: { 
  tabs?: string[];
  activeMainTab: number; 
  onSelectTab: (idx: number, tab: string) => void;
}) {
  if (tabs.length === 0) return null;
  const showQandE = tabs.length > 1;

  return (
    <div className="flex items-center gap-1 pointer-events-auto">
      {showQandE && (
        <div className="bg-[#1a1c23] px-2 py-1 flex items-center justify-center border-r border-zinc-700 shadow-lg">
          <KeyCap src={KeyAssets.q} alt="Q" className="h-6 w-6" />
        </div>
      )}
      
      <div className="flex gap-[2px]">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            onClick={() => onSelectTab(index, tab)}
            className={`
              px-5 py-1 text-[16px] font-oswald font-bold tracking-wider transition-colors uppercase
              ${activeMainTab === index 
                ? 'bg-white text-black' 
                : 'bg-[#1a1c23]/95 text-white/80 hover:bg-zinc-700'}
            `}
          >
            {tab}
          </button>
        ))}
      </div>
      
      {showQandE && (
        <div className="bg-[#1a1c23] px-2 py-1 flex items-center justify-center ml-1 border-l border-zinc-700 shadow-lg">
          <KeyCap src={KeyAssets.e} alt="E" className="h-6 w-6" />
        </div>
      )}
    </div>
  );
}
