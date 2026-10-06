export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * Compressão robusta:
 * - pula compressão se arquivo já for pequeno (<= smallThreshold)
 * - limita megapixels para não estourar limites do canvas
 * - tenta toDataURL; se falhar, usa toBlob + FileReader
 * - se tudo falhar, lança erro
 */
export async function compressImageSmart(file, opts = {}) {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.85,
    smallThreshold = 220 * 1024,      // 220 KB: pula compressão (usa original)
    maxMegapixels = 24,               // limita para ~24MP
    mime = 'image/jpeg',
  } = opts

  // Se já é pequeno, não recomprime (evita erro e mantém qualidade)
  if (typeof file.size === 'number' && file.size <= smallThreshold) {
    const dataUrl = await fileToDataURL(file)
    return { dataUrl, width: null, height: null, skipped: true }
  }

  // Carrega a imagem em memória
  const originalUrl = await fileToDataURL(file)
  const img = await loadImage(originalUrl)
  const iw = img.naturalWidth || img.width
  const ih = img.naturalHeight || img.height

  // Limita megapixels e dimensões finais
  const totalMP = (iw * ih) / 1e6
  let scaleMP = 1
  if (totalMP > maxMegapixels) {
    scaleMP = Math.sqrt((maxMegapixels * 1e6) / (iw * ih))
  }
  const scaleWH = Math.min(maxWidth / iw, maxHeight / ih, 1)
  const scale = Math.min(scaleMP, scaleWH)

  const w = Math.max(1, Math.round(iw * scale))
  const h = Math.max(1, Math.round(ih * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: false })
  ctx.drawImage(img, 0, 0, w, h)

  // 1ª tentativa: toDataURL
  try {
    const out = canvas.toDataURL(mime, quality)
    return { dataUrl: out, width: w, height: h }
  } catch (e) {
    // continua
  }

  // 2ª tentativa: toBlob -> FileReader
  const blob = await new Promise((resolve, reject) => {
    if (!canvas.toBlob) return reject(new Error('toBlob não suportado'))
    canvas.toBlob((b) => {
      if (b) resolve(b)
      else reject(new Error('Falha no toBlob'))
    }, mime, quality)
  })
  const out = await blobToDataURL(blob)
  return { dataUrl: out, width: w, height: h }
}
