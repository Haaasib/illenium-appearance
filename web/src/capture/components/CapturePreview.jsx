import React, { useEffect, useMemo, useState } from 'react'
import { getCategoryLucideIcon } from '../../components/CategoryIcons'

export const CAT_ICON_MAP = {}
export const CAT_TYPE_ICON = {}

const GROUPS = [
  { id: 'component', label: 'CLOTHING' },
  { id: 'prop', label: 'PROPS' },
  { id: 'overlay', label: 'APPEARANCE' },
]

const catKey = (c) => `${c.type}:${c.id}`

export function CapturePreview({ categories, onStart, onCancel, onActiveChange }) {
  const items = useMemo(
    () => (categories || []).filter((c) => c.type === 'component' || c.type === 'prop' || c.type === 'overlay'),
    [categories],
  )
  const ids = items.map(catKey).join('|')
  const [selected, setSelected] = useState(() => new Set(items.map(catKey)))
  const [active, setActive] = useState(items[0] ? catKey(items[0]) : '')
  const [group, setGroup] = useState('component')

  useEffect(() => {
    setSelected(new Set(items.map(catKey)))
    if (items[0]) {
      setActive(catKey(items[0]))
      onActiveChange?.(items[0])
    }
  }, [ids])

  const rows = items.filter((c) => c.type === group)

  const pick = (cat) => {
    const key = catKey(cat)
    setActive(key)
    onActiveChange?.(cat)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-transparent text-white antialiased select-none pointer-events-none">
      <div className="w-[440px] flex flex-col pointer-events-auto ml-12 mt-8">
        <div className="flex items-center gap-3.5 mb-4 h-12 whitespace-nowrap min-w-max">
          <button
            type="button"
            onClick={onCancel}
            className="w-12 h-12 bg-white text-black font-bold text-2xl flex items-center justify-center hover:bg-zinc-200 transition-colors shadow-lg cursor-pointer flex-shrink-0"
          >
            {'<'}
          </button>
          <div className="flex items-center gap-2 font-bebas italic text-[36px] tracking-wider uppercase leading-none pt-1">
            <span className="text-white/40">CAPTURE</span>
            <span className="text-white/20 font-sans font-normal text-2xl">›</span>
            <span className="text-white font-bold">{GROUPS.find((g) => g.id === group)?.label}</span>
          </div>
        </div>

        <div className="flex gap-[2px] mb-2">
          {GROUPS.map((g) => {
            const on = group === g.id
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setGroup(g.id)}
                className={`px-5 py-1 text-[16px] font-oswald font-bold tracking-wider uppercase transition-colors ${
                  on ? 'bg-white text-black' : 'bg-[#1a1c23]/95 text-white/80 hover:bg-zinc-700'
                }`}
              >
                {g.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-[2px] max-h-[62vh] overflow-y-auto styled-scrollbar">
          {rows.map((cat) => {
            const key = catKey(cat)
            const isActive = active === key
            const isOn = selected.has(key)
            return (
              <button
                key={key}
                type="button"
                onClick={() => pick(cat)}
                className={`flex items-center w-full px-5 py-3.5 transition-colors cursor-pointer ${
                  isActive ? 'bg-white text-black' : 'bg-[#1a1c23]/95 text-white hover:bg-zinc-700'
                }`}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {getCategoryLucideIcon(cat.label, `w-6 h-6 flex-shrink-0 ${isActive ? 'text-black' : 'text-white'}`)}
                  <div className="flex flex-col items-start min-w-0">
                    <span className={`font-oswald text-[20px] tracking-widest uppercase ${isActive ? 'font-bold' : 'opacity-90'}`}>
                      {cat.label}
                    </span>
                    {cat.drawables != null && (
                      <span className={`font-oswald text-[11px] tracking-wider uppercase ${isActive ? 'text-black/50' : 'text-white/40'}`}>
                        {cat.drawables} items
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`w-5 h-5 flex items-center justify-center font-oswald font-bold text-xs flex-shrink-0 pointer-events-none ${
                    isOn
                      ? (isActive ? 'bg-black text-white' : 'bg-white text-black')
                      : (isActive ? 'border border-black/40 text-black/40' : 'border border-white/30 text-white/30')
                  }`}
                >
                  {isOn ? '✓' : ''}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="fixed bottom-20 right-12 z-50 flex flex-col items-end gap-4 pointer-events-auto">
        <div className="w-[380px] flex flex-col shadow-2xl">
          <div className="bg-white text-black px-4 py-2.5 flex justify-between items-center">
            <span className="font-oswald font-bold text-[18px] tracking-wider uppercase">SELECTED</span>
            <span className="font-oswald font-bold text-[20px]">{selected.size}</span>
          </div>
          <div className="bg-[#1a1c23] px-4 py-2 flex items-center justify-center gap-3.5">
            <div className="flex items-center gap-2">
              <img src="./keybinds/keyboard_space.png" alt="SPACE" draggable={false} className="h-6 w-auto object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]" />
              <span className="font-barlow font-semibold text-[14px] text-white uppercase tracking-[0.12em]">PAUSE</span>
            </div>
            <span className="font-barlow font-medium text-[18px] text-white/70 leading-none">/</span>
            <div className="flex items-center gap-2">
              <img src="./keybinds/keyboard_escape.png" alt="ESC" draggable={false} className="h-6 w-auto object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]" />
              <span className="font-barlow font-semibold text-[14px] text-white uppercase tracking-[0.12em]">EXIT</span>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="px-4 py-2.5 bg-[#1a1c23] hover:bg-zinc-800 text-white font-oswald font-bold text-[13px] tracking-wider uppercase cursor-pointer"
            >
              NONE
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set(items.map(catKey)))}
              className="px-4 py-2.5 bg-[#1a1c23] hover:bg-zinc-800 text-white font-oswald font-bold text-[13px] tracking-wider uppercase cursor-pointer"
            >
              ALL
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 bg-red-600/90 hover:bg-red-600 text-white font-oswald font-bold text-[15px] tracking-wider uppercase cursor-pointer"
            >
              EXIT
            </button>
            <button
              type="button"
              onClick={() => onStart(items.filter((c) => selected.has(catKey(c))))}
              className="flex-[1.4] py-2.5 bg-black hover:bg-zinc-900 text-white font-oswald font-bold text-[18px] tracking-widest uppercase cursor-pointer"
            >
              START
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CapturePreview
