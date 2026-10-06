import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import AvatarCircle from '@/components/AvatarCircle'
import Tooltip from '@/components/ui/Tooltip'

function loadPets() {
  try { return JSON.parse(localStorage.getItem('patanet_pets') || '[]') } catch { return [] }
}

export default function PetStrip({ open }) {
  const [pets, setPets] = useState(() => loadPets())
  const wrapRef = useRef(null)
  const showArrows = useMemo(() => open && pets.length > 0, [open, pets.length])

  useEffect(()=>{
    const onUpd = () => setPets(loadPets())
    window.addEventListener('patanet:pets-updated', onUpd)
    return () => window.removeEventListener('patanet:pets-updated', onUpd)
  },[])

  // scroll suave
  const scrollBy = (dx) => wrapRef.current?.scrollBy({ left: dx, behavior: 'smooth' })

  // rolagem horizontal com roda do mouse
  useEffect(()=>{
    const el = wrapRef.current
    if(!el) return
    const onWheel = (e)=> {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
        el.scrollLeft += e.deltaY * 0.8
      }
    }
    el.addEventListener('wheel', onWheel, { passive:false })
    return ()=> el.removeEventListener('wheel', onWheel)
  },[])

  return (
    <div className="mt-2 px-3">
      {open && <p className="text-xs opacity-90 mb-2">Seus Pets</p>}

      <div className="relative">
        {showArrows && (
          <>
            <button onClick={()=>scrollBy(-160)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-1.5
                               bg-white/10 hover:bg-white/15 shadow-sm">
              <ChevronLeft size={18}/>
            </button>
            <button onClick={()=>scrollBy(160)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-1.5
                               bg-white/10 hover:bg-white/15 shadow-sm">
              <ChevronRight size={18}/>
            </button>
          </>
        )}

        <div ref={wrapRef}
             className="flex items-center gap-2 overflow-x-auto pb-2 scroll-smooth
                        [scrollbar-color:transparent_transparent]">
          <Link to="/pets/novo" title="Novo pet" className="shrink-0">
            <AvatarCircle size={44}><Plus size={18}/></AvatarCircle>
          </Link>

          {pets.map(p=>(
            <Tooltip key={p.id} label={open ? '' : p.name}>
              <Link to={`/pets/${p.id}`} className="shrink-0" title={p.name}>
                <AvatarCircle size={44} src={p.avatarUrl}/>
              </Link>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  )
}
