const KEY = 'patanet_feed_posts'

export function loadFeed() {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || '[]')
    // mais novo primeiro
    return arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  } catch {
    return []
  }
}

function _save(list) {
  const json = JSON.stringify(list)
  localStorage.setItem(KEY, json)
  window.dispatchEvent(new Event('patanet:feed-updated'))
}

function isQuotaError(err) {
  return err && (err.name === 'QuotaExceededError' || err.code === 22)
}

/** Tenta salvar; se estourar, vai removendo os mais antigos até caber. */
function saveSafely(list) {
  try {
    _save(list)
    return { trimmed: 0 }
  } catch (e) {
    if (!isQuotaError(e)) throw e
    let working = list.slice()
    let trimmed = 0
    while (working.length > 0) {
      working.pop() // remove o mais antigo (o array está desc)
      try {
        _save(working)
        return { trimmed }
      } catch (e2) {
        if (!isQuotaError(e2)) throw e2
        trimmed++
      }
    }
    // se chegou aqui, nada coube
    throw e
  }
}

export function addPosts(posts) {
  const list = loadFeed()
  const merged = [...posts, ...list] // preserva mais novos no topo
  return saveSafely(merged)
}

/** Cria posts de foto referenciando photos por id (NÃO duplica base64). */
export function addPhotoPostsById(photos, author = {}) {
  const now = Date.now()
  const posts = photos.map((ph, idx) => ({
    id: now + idx,
    type: 'photo',
    photoId: ph.id,      // << referência
    caption: ph.caption || '',
    petIds: Array.isArray(ph.petIds) ? ph.petIds : (ph.petId != null ? [Number(ph.petId)] : []),
    createdAt: Date.now(),
    author: {
      id: author.id ?? 'me',
      name: author.name ?? 'Você',
      avatar: author.avatar ?? null,
    },
    likes: 0,
    comments: [],
  }))
  return addPosts(posts)
}
