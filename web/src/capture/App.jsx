import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { RotateCcw, X, Play } from 'lucide-react'
import { CapturePreview } from './components/CapturePreview'
import { CaptureWidget }  from './components/CaptureWidget'

// ── NUI bridge ──────────────────────────────────────
const resourceName = typeof GetParentResourceName === 'function' ? GetParentResourceName() : 'illenium-appearance'
const fetchNUI = async (eventName, data = {}) => {
  try {
    const r = await fetch(`https://${resourceName}/${eventName}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    return await r.json()
  } catch { return null }
}

// ── Orbit hint ──────────────────────────────────────
function OrbitHint() {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none animate-enter">
      <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass"
        style={{ border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.5)' }} />
          <span style={{ fontSize: 10, fontWeight: 500, color: '#666' }}>Camera</span>
        </span>
        <span style={{ color: '#333', fontSize: 10 }}>|</span>
        {[['LMB','Rotate'],['RMB','Roll'],['Scroll','Zoom'],['W/S','Height'],['Q/E','FOV'],['R','Reset'],['C','Copy']].map(([k,v]) => (
          <span key={k} style={{ fontSize: 10, color: '#666' }}>
            <strong style={{ color: '#ddd', fontWeight: 600 }}>{k}</strong> {v}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Recapture preview panel ─────────────────────────
function RecapturePanel({ count, onConfirm, onCancel }) {
  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[9999] animate-enter" data-no-orbit>
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl glass"
        style={{ border: '1px solid rgba(251,146,60,0.2)', boxShadow: '0 4px 24px rgba(0,0,0,0.6)' }}>
        <RotateCcw style={{ width: 12, height: 12, color: '#fb923c', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: '#999' }}>
          <span style={{ color: '#fb923c', fontWeight: 700 }}>{count}</span> item · Adjust camera
        </span>
        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
        <button onClick={onConfirm}
          className="flex items-center gap-1.5"
          style={{
            background: '#fb923c', color: '#000', border: 'none', borderRadius: 6,
            padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}>
          <Play style={{ width: 8, height: 8 }} />
          Start
        </button>
        <button onClick={onCancel}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: '#555' }}>
          <X style={{ width: 12, height: 12 }} />
        </button>
      </div>
    </div>
  )
}

// ── App ─────────────────────────────────────────────
export default function App() {
  const [visible,             setVisible]             = useState(false)
  const [gender,              setGender]              = useState('male')
  const [imgExt,              setImgExt]              = useState('png')
  const [categories,          setCategories]          = useState([])
  const [activeCatIdx,        setActiveCatIdx]        = useState(0)
  const [items,               setItems]               = useState([])
  const [selectedItem,        setSelectedItem]        = useState(null)
  const [searchQuery,         setSearchQuery]         = useState('')

  const [previewing,          setPreviewing]          = useState(false)
  const [previewCats,         setPreviewCats]         = useState([])
  const [capturing,           setCapturing]           = useState(false)
  const [capturePaused,       setCapturePaused]       = useState(false)
  const [overlayVisible,      setOverlayVisible]      = useState(true)
  const [progress,            setProgress]            = useState({ current: 0, total: 0, category: '' })

  const [recapturePreviewing, setRecapturePreviewing] = useState(false)
  const [recaptureQueue,      setRecaptureQueue]      = useState([])

  // ── NUI messages ──────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const d = e.data
      switch (d.type) {
        case 'openMenu':
          setGender(d.gender)
          setCategories(d.categories || [])
          setActiveCatIdx(0)
          setSelectedItem(null)
          setSearchQuery('')
          if (d.imgExt) setImgExt(d.imgExt)
          setVisible(true)
          break
        case 'capturePreview':
          setPreviewCats(d.categories || [])
          if (d.gender) setGender(d.gender)
          setPreviewing(true)
          break
        case 'captureStart':
          setPreviewing(false); setRecapturePreviewing(false)
          setCapturing(true); setCapturePaused(false)
          setOverlayVisible(true); setProgress({ current: 0, total: 0, category: '' })
          break
        case 'setCapturePaused':  setCapturePaused(d.paused); break
        case 'captureProgress':   setProgress({ current: d.current || 0, total: d.total || 0, category: d.category || '' }); break
        case 'captureComplete':
        case 'captureCancelled':  setPreviewing(false); setCapturing(false); setCapturePaused(false); setRecapturePreviewing(false); break
        case 'setOverlayVisible': setOverlayVisible(d.visible); break
        case 'forceClose':        setVisible(false); setPreviewing(false); setRecapturePreviewing(false); break
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  useEffect(() => {
    const on = visible || capturing || previewing || recapturePreviewing
    document.documentElement.dataset.capture = on ? '1' : ''
    return () => { document.documentElement.dataset.capture = '' }
  }, [visible, capturing, previewing, recapturePreviewing])

  // ── Load items for active category ────────────────
  useEffect(() => {
    if (!categories.length) return
    const cat = categories[activeCatIdx]
    if (!cat) return
    const arr = []
    for (let d = 0; d < cat.drawables; d++)
      arr.push({ type: cat.type, id: cat.id, gender, drawable: d, texture: 0, label: cat.label })
    setItems(arr)
    setSelectedItem(null)
    if (visible && cat.camera) fetchNUI('setCameraPreset', { camera: cat.camera, categoryType: cat.type, categoryId: cat.id })
  }, [activeCatIdx, categories, gender, visible])

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items
    const q = searchQuery.trim().toLowerCase()
    return items.filter(i => `#${i.drawable}`.includes(q) || i.label.toLowerCase().includes(q))
  }, [items, searchQuery])

  // ── Handlers ──────────────────────────────────────
  const handleSelect = useCallback(async (item) => {
    setSelectedItem(item)
    await fetchNUI('applyClothing', { itemType: item.type, id: item.id, drawable: item.drawable, texture: item.texture, model: item.model })
  }, [])

  const handleClose = useCallback(() => {
    setVisible(false)
    fetchNUI('closeMenu')
  }, [])

  const handlePause  = useCallback(() => { setCapturePaused(true);  fetchNUI('pauseCapture')  }, [])
  const handleResume = useCallback(() => { setCapturePaused(false); fetchNUI('resumeCapture') }, [])
  const handleCancel = useCallback(() => { setCapturing(false); setCapturePaused(false); fetchNUI('cancelCapture') }, [])

  useEffect(() => {
    if (!capturing) return
    const onKey = (e) => {
      const key = e.key
      if (key === 'Escape' || key === 'Backspace') {
        e.preventDefault()
        handleCancel()
        return
      }
      if (key === ' ' || key === 'Spacebar' || key.toLowerCase() === 'p') {
        e.preventDefault()
        if (capturePaused) handleResume()
        else handlePause()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [capturing, capturePaused, handlePause, handleResume, handleCancel])

  const handleRecapture = useCallback((items) => {
    setRecaptureQueue(items)
    setVisible(false)
    setRecapturePreviewing(true)
    fetchNUI('enterRecapturePreview')
  }, [])

  const handleRecaptureConfirm = useCallback(() => {
    setRecapturePreviewing(false)
    fetchNUI('recaptureItems', { items: recaptureQueue })
  }, [recaptureQueue])

  const handleRecaptureCancel = useCallback(() => {
    setRecapturePreviewing(false)
    setRecaptureQueue([])
    fetchNUI('cancelRecapturePreview')
  }, [])

  const handleCancelPreview = useCallback(() => {
    setPreviewing(false)
    fetchNUI('cancelPreview')
  }, [])

  const handlePreviewStart = useCallback((chosen) => {
    const sc = chosen.filter(c => c.type === 'component').map(c => c.id)
    const sp = chosen.filter(c => c.type === 'prop').map(c => c.id)
    const sl = chosen.filter(c => c.type === 'overlay').map(c => c.id)
    setPreviewing(false)
    fetchNUI('startCapture', { selectedComponents: sc, selectedProps: sp, selectedOverlays: sl })
  }, [])

  const handlePreviewActiveChange = useCallback((cat) => {
    if (cat.camera) fetchNUI('setCameraPreset', { camera: cat.camera, categoryType: cat.type, categoryId: cat.id, firstModel: cat.firstModel })
  }, [])

  const handleSaveAngle = useCallback((camera) => {
    fetchNUI('saveCameraAngle', { camera })
  }, [])

  // ── Camera orbit + pan ─────────────────────────────
  const isDraggingRef  = useRef(false)
  const isPanningRef   = useRef(false)
  const lastMouseRef   = useRef({ x: 0, y: 0 })

  const handleOrbitDown = useCallback((e) => {
    if (e.target.closest('[data-no-orbit]')) return
    if (e.button === 2) {
      isPanningRef.current = true
    } else {
      isDraggingRef.current = true
    }
    lastMouseRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleOrbitMove = useCallback((e) => {
    const dx = e.clientX - lastMouseRef.current.x
    const dy = e.clientY - lastMouseRef.current.y
    if (isDraggingRef.current) {
      fetchNUI('rotateCamera', { deltaX: dx, deltaY: dy })
    } else if (isPanningRef.current) {
      fetchNUI('rollCamera', { deltaX: dx })
    } else {
      return
    }
    lastMouseRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleOrbitUp = useCallback(() => {
    isDraggingRef.current = false
    isPanningRef.current  = false
  }, [])

  const handleContextMenu = useCallback((e) => { e.preventDefault() }, [])

  const handleOrbitWheel = useCallback((e) => {
    if (e.target.closest('[data-no-orbit]')) return
    fetchNUI('zoomCamera', { delta: e.deltaY > 0 ? 1 : -1 })
  }, [])

  // ── Keyboard camera controls ─────────────────────
  useEffect(() => {
    if (!previewing && !recapturePreviewing && !visible) return

    const held = {}
    let frameId = null

    const tick = () => {
      if (held['w'] || held['arrowup'])    fetchNUI('adjustZPos', { delta:  0.005 })
      if (held['s'] || held['arrowdown'])  fetchNUI('adjustZPos', { delta: -0.005 })
      if (held['q'])                       fetchNUI('adjustFov',  { delta: -0.15 })
      if (held['e'])                       fetchNUI('adjustFov',  { delta:  0.15 })
      frameId = requestAnimationFrame(tick)
    }

    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const key = e.key.toLowerCase()
      if (['w', 's', 'q', 'e', 'r', 'c', 'arrowup', 'arrowdown'].includes(key)) {
        e.preventDefault()
        if (key === 'r' && !held['r']) {
          held['r'] = true
          fetchNUI('resetCameraPreset')
        } else if (key === 'c' && !held['c']) {
          held['c'] = true
          fetchNUI('getCameraValues').then(v => {
            if (!v || !v.preset) return
            const txt = v.luaFormat || `fov: ${v.fov}, dist: ${v.dist}, angleH: ${v.angleH}, camZ: ${v.camZ}, zPos: ${v.zPos}, roll: ${v.roll}`
            try {
              const el = document.createElement('textarea')
              el.value = txt
              el.style.position = 'fixed'
              el.style.opacity = '0'
              document.body.appendChild(el)
              el.select()
              document.execCommand('copy')
              document.body.removeChild(el)
            } catch (_) {}
          })
        } else if (!held[key]) {
          held[key] = true
        }
      }
    }

    const onKeyUp = (e) => {
      const key = e.key.toLowerCase()
      delete held[key]
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    frameId = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [previewing, recapturePreviewing, visible])

  // ── Render ────────────────────────────────────────
  if (!visible && !capturing && !previewing && !recapturePreviewing) return null

  // Recapture camera preview
  if (recapturePreviewing) {
    return (
      <div className="fixed inset-0 z-[9998] cursor-grab active:cursor-grabbing"
        onMouseDown={handleOrbitDown} onMouseMove={handleOrbitMove}
        onMouseUp={handleOrbitUp} onMouseLeave={handleOrbitUp} onWheel={handleOrbitWheel} onContextMenu={handleContextMenu}>
        <RecapturePanel count={recaptureQueue.length} onConfirm={handleRecaptureConfirm} onCancel={handleRecaptureCancel} />
        <OrbitHint />
      </div>
    )
  }

  // Capture preview
  if (previewing) {
    const previewCategories = previewCats.map((cat, idx) => ({
      key: `${cat.type}-${cat.id}-${idx}`, label: cat.label,
      type: cat.type, id: cat.id, camera: cat.camera, drawables: cat.drawables,
    }))
    return (
      <div className="fixed inset-0 z-[9998]">
        <CapturePreview
          categories={previewCategories}
          onStart={handlePreviewStart}
          onCancel={handleCancelPreview}
          onActiveChange={handlePreviewActiveChange}
        />
      </div>
    )
  }

  // Capture in progress
  if (capturing) {
    if (!overlayVisible) return null
    return (
      <CaptureWidget
        progress={progress}
        onPause={handlePause} onResume={handleResume} onCancel={handleCancel}
        isPaused={capturePaused}
      />
    )
  }

  return null
}
