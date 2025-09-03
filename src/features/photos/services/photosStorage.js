const KEY = 'patanet_photos'

export function loadPhotos() {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || '[]')
    return arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  } catch {
    return []
  }
}

export function savePhotos(list) {
  const json = JSON.stringify(list)
  localStorage.setItem(KEY, json)
  // avisa a UI que mudou
  window.dispatchEvent(new Event('patanet:photos-updated'))
}

export function addPhoto(photo) {
  const list = loadPhotos()
  list.push(photo)
  savePhotos(list)
  return photo.id
}

export function addPhotosUpToQuota(photosArray) {
  let list = loadPhotos()
  let saved = 0
  for (const p of photosArray) {
    list.push(p)
    try {
      savePhotos(list)
      saved++
    } catch (e) {
      list.pop()
      break
    }
  }
  return { saved, total: photosArray.length }
}

export function deletePhoto(id) {
  const nid = Number(id)
  const list = loadPhotos().filter(p => Number(p.id) !== nid)
  savePhotos(list)
}

export function updatePhoto(id, updates) {
  const nid = Number(id)
  const list = loadPhotos().map(p => Number(p.id) === nid ? { ...p, ...updates } : p)
  savePhotos(list)
}

export function getPhotoById(id) {
  const nid = Number(id)
  return loadPhotos().find(p => Number(p.id) === nid)
}
