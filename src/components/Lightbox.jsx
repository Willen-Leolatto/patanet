import React, { useEffect, useRef, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Share2, Download } from 'lucide-react'

function dataUrlToFile(dataUrl, filename = 'patanet-foto.jpg') {
  const [head, body] = (dataUrl || '').split(',')
  const mime = (head && head.match(/:(.*?);/) || [,'image/jpeg'])[1]
  const bin = atob(body || '')
  const u8 = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i)
  return new File([u8], filename, { type: mime })
}

export default function Lightbox({ photos, index, onClose, onPrev, onNext, getPetName }) {
  const i = typeof index === 'number' ? index : -1
  const list = Array.isArray(photos) ? photos : []
  const curr = i >= 0 ? list[i] : null
  const srcCurr = curr ? (curr.imageSrc || curr.src) : null

  const closeBtnRef = useRef(null)

  // crossfade com preload
  const DURATION = 250
  const [activeSrc, setActiveSrc] = useState(srcCurr)
  const [prevSrc, setPrevSrc] = useState(null)
  const [activeOpacity, setActiveOpacity] = useState(1)
  const [prevOpacity, setPrevOpacity] = useState(0)

  useEffect(() => {
    if (!srcCurr) return
    if (srcCurr === activeSrc) return

    setPrevSrc(activeSrc)
    setPrevOpacity(1)
    setActiveOpacity(0)

    // pré-carrega a nova antes de animar
    const img = new Image()
    img.onload = () => {
      setActiveSrc(srcCurr)
      requestAnimationFrame(() => {
        setPrevOpacity(0)
        setActiveOpacity(1)
      })
      setTimeout(() => setPrevSrc(null), DURATION + 40)
    }
    img.src = srcCurr
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, srcCurr])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => closeBtnRef.current?.focus(), 0)
    return () => { document.body.style.overflow = prev; clearTimeout(t) }
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onPrev()
      else if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onPrev, onNext])

  if (!curr || !activeSrc) return null

  const ids = Array.isArray(curr.petIds) && curr.petIds.length ? curr.petIds : (curr.petId != null ? [curr.petId] : [])
  const petNames = ids.map(pid => getPetName ? (getPetName(pid) || '—') : '—').join(', ')
  const stop = (e)=>e.stopPropagation()

  async function handleShare(e) {
    stop(e)
    try {
      const file = dataUrlToFile(activeSrc)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'PataNet', text: curr.caption || '' })
      } else if (navigator.share) {
        await navigator.share({ title: 'PataNet', text: curr.caption || '' })
      } else {
        handleDownload(e)
      }
    } catch { handleDownload(e) }
  }

  function handleDownload(e) {
    stop(e)
    const a = document.createElement('a')
    a.href = activeSrc
    a.download = 'patanet-foto.jpg'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div className="fixed inset-0 z-[1200] bg-black/90 text-white" onClick={onClose}>
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 p-3" onClick={stop}>
        <div className="min-w-0 px-1">
          <div className="truncate text-xs opacity-80">{petNames || '—'}</div>
          <div className="truncate text-base font-medium">{curr.caption || 'Sem legenda'}</div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleShare} className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20 focus:outline-none">
            <span className="inline-flex items-center gap-2"><Share2 className="h-4 w-4" /> Compartilhar</span>
          </button>
          <button type="button" onClick={handleDownload} className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20 focus:outline-none">
            <span className="inline-flex items-center gap-2"><Download className="h-4 w-4" /> Baixar</span>
          </button>
          <button type="button" ref={closeBtnRef} onClick={(e)=>{e.stopPropagation(); onClose()}} className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20 focus:outline-none">
            <span className="inline-flex items-center gap-2"><X className="h-4 w-4" /> Fechar</span>
          </button>
        </div>
      </div>

      <div className="absolute inset-0 z-10 flex items-center justify-center p-6" onClick={stop}>
        {prevSrc && (
          <img
            src={prevSrc}
            alt=""
            className="pointer-events-none absolute max-h-full max-w-full select-none rounded-lg shadow-2xl transition-opacity"
            style={{ opacity: prevOpacity, transitionDuration: `${DURATION}ms`, willChange: 'opacity' }}
            draggable={false}
          />
        )}
        <img
          src={activeSrc}
          alt={curr.caption || petNames || 'Foto'}
          className="max-h-full max-w-full select-none rounded-lg shadow-2xl transition-opacity"
          style={{ opacity: activeOpacity, transitionDuration: `${DURATION}ms`, willChange: 'opacity' }}
          draggable={false}
        />
      </div>

      {list.length > 1 && (
        <>
          <button type="button" onClick={(e)=>{e.stopPropagation(); onPrev()}} className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-3 hover:bg-white/20 focus:outline-none" aria-label="Anterior">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button type="button" onClick={(e)=>{e.stopPropagation(); onNext()}} className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-3 hover:bg-white/20 focus:outline-none" aria-label="Próxima">
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
    </div>
  )
}
