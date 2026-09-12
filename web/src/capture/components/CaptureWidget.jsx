import React from 'react'
import { KeyAssets, KeyCap } from '../../components/GameIcon'

export function CaptureWidget({ progress, isPaused, onPause, onResume, onCancel }) {
  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0
  const label = (progress.category || 'PREPARING').toUpperCase()

  return (
    <>
      {isPaused && (
        <div className="fixed inset-0 z-[99998] pointer-events-none flex items-center justify-center">
          <div className="px-10 py-4 bg-black/70 border border-amber-400/50">
            <div className="font-bebas text-[48px] tracking-widest text-amber-300 leading-none">PAUSED</div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <KeyCap src={KeyAssets.space} alt="SPACE" className="h-7 w-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]" />
              <span className="font-barlow font-semibold text-[16px] text-white/70 uppercase tracking-[0.12em]">
                Resume
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-20 right-12 z-[99999] w-[380px] flex flex-col shadow-2xl pointer-events-auto select-none">
        <div className={`px-4 py-2.5 flex justify-between items-center transition-colors ${
          isPaused ? 'bg-amber-400 text-black' : 'bg-white text-black'
        }`}>
          <span className="font-oswald font-bold text-[18px] tracking-wider uppercase flex items-center gap-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-black animate-pulse' : 'bg-red-600 animate-pulse'}`} />
            {isPaused ? 'PAUSED' : 'CAPTURING'}
          </span>
          <span className="font-oswald font-bold text-[20px]">{pct}%</span>
        </div>

        <div className="bg-[#1a1c23] px-4 py-3">
          <div className="flex justify-between items-center mb-2">
            <span className="font-oswald text-xs text-zinc-400 uppercase tracking-wider">{label}</span>
            <span className="font-oswald text-xs text-white font-bold">
              {progress.current} / {progress.total || 0}
            </span>
          </div>
          <div className="h-[4px] bg-black overflow-hidden">
            <div
              className={`h-full transition-[width] duration-300 ${isPaused ? 'bg-amber-400' : 'bg-white'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-center gap-3.5">
            <div className="flex items-center gap-2">
              <KeyCap src={KeyAssets.esc} alt="ESC" className="h-7 w-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]" />
              <span className="font-barlow font-semibold text-[16px] text-white uppercase tracking-[0.12em] leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
                EXIT
              </span>
            </div>
            <span className="font-barlow font-medium text-[22px] text-white/70 leading-none select-none">/</span>
            <div className="flex items-center gap-2">
              <KeyCap src={KeyAssets.space} alt="SPACE" className="h-7 w-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]" />
              <span className="font-barlow font-semibold text-[16px] text-white uppercase tracking-[0.12em] leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
                {isPaused ? 'RESUME' : 'PAUSE'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-1">
          <button
            type="button"
            onClick={onCancel}
            className="w-1/3 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-oswald font-bold text-[15px] tracking-wider uppercase cursor-pointer transition-colors"
          >
            EXIT
          </button>
          <button
            type="button"
            onClick={isPaused ? onResume : onPause}
            className={`w-2/3 py-2.5 font-oswald font-bold text-[18px] tracking-widest uppercase cursor-pointer transition-colors ${
              isPaused
                ? 'bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-black'
                : 'bg-black hover:bg-zinc-800 active:bg-zinc-950 text-white'
            }`}
          >
            {isPaused ? 'RESUME' : 'PAUSE'}
          </button>
        </div>
      </div>
    </>
  )
}

export default CaptureWidget
