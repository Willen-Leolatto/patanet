import React, { useEffect, useMemo, useState } from 'react'
import ContentCard from '../components/ContentCard'
import FeedComposer from '../components/FeedComposer'
import { loadFeed } from '../utils/feedStorage'
import { loadPets } from '../utils/petsStorage'
import { getPhotoById, loadPhotos } from '../utils/photosStorage'

export default function Feed() {
  const [posts, setPosts] = useState([])
  const [pets, setPets] = useState([])
  const [photos, setPhotos] = useState([])

  function refresh() {
    setPosts(loadFeed())
    setPets(loadPets())
    setPhotos(loadPhotos())
  }

  useEffect(() => {
    refresh()
    const onPhotos = () => setPhotos(loadPhotos())
    const onFeed = () => setPosts(loadFeed())
    window.addEventListener('patanet:photos-updated', onPhotos)
    window.addEventListener('patanet:feed-updated', onFeed)
    return () => {
      window.removeEventListener('patanet:photos-updated', onPhotos)
      window.removeEventListener('patanet:feed-updated', onFeed)
    }
  }, [])

  const petNameById = useMemo(() => {
    const m = new Map()
    pets.forEach(p => m.set(Number(p.id), p.name))
    return (id) => m.get(Number(id)) || null
  }, [pets])

  const photoSrcById = useMemo(() => {
    const m = new Map()
    photos.forEach(ph => m.set(Number(ph.id), ph.src))
    return (id) => m.get(Number(id)) || null
  }, [photos])

  return (
    <div className="w-full">
      <div className="mx-auto max-w-2xl px-3 py-4">
        <FeedComposer onPosted={refresh} />

        {posts.length === 0 ? (
          <ContentCard className="mt-3"><div className="text-sm opacity-70">Ainda não há publicações.</div></ContentCard>
        ) : posts.map((p) => (
          <ContentCard key={p.id} className="mt-3">
            <article>
              <header className="mb-2 flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  {p.author?.avatar ? <img src={p.author.avatar} alt={p.author.name || 'Autor'} className="h-full w-full object-cover" /> : null}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{p.author?.name || 'Usuário'}</div>
                  <div className="truncate text-xs opacity-60">{new Date(p.createdAt).toLocaleString()}</div>
                </div>
              </header>

              {p.type === 'text' && (
                <>
                  <p className="whitespace-pre-wrap text-sm">{p.text}</p>
                  {Array.isArray(p.petIds) && p.petIds.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.petIds.map(pid => (
                        <span key={pid} className="rounded-full border px-2 py-0.5 text-[11px]
                          border-slate-300 text-slate-700
                          dark:border-slate-700 dark:text-slate-200">
                          {petNameById(pid) || '—'}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}

              {p.type === 'photo' && (
                <>
                  {p.caption && <p className="mb-2 whitespace-pre-wrap text-sm">{p.caption}</p>}
                  <img
                    src={p.photoId ? (photoSrcById(p.photoId) || getPhotoById(p.photoId)?.src) : p.imageSrc}
                    alt={p.caption || 'Publicação'}
                    className="mb-2 w-full rounded-lg object-contain"
                  />
                  {Array.isArray(p.petIds) && p.petIds.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.petIds.map(pid => (
                        <span key={pid} className="rounded-full border px-2 py-0.5 text-[11px]
                          border-slate-300 text-slate-700
                          dark:border-slate-700 dark:text-slate-200">
                          {petNameById(pid) || '—'}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </article>
          </ContentCard>
        ))}
      </div>
    </div>
  )
}
