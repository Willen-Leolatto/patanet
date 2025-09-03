import React, { useEffect, useState } from 'react'
import PageHeader from '../../../components/PageHeader'
import FormCard from '../../../components/forms/FormCard'
import { loadSettings, saveSettings } from '../../../utils/userSettings'
import { useToast } from '../../../components/ui/ToastProvider'

export default function Settings() {
  const toast = useToast()
  const [s, setS] = useState(loadSettings())

  useEffect(() => {
    const onUpd = () => setS(loadSettings())
    window.addEventListener('patanet:settings-updated', onUpd)
    return () => window.removeEventListener('patanet:settings-updated', onUpd)
  }, [])

  const input = 'w-full rounded-md border px-3 py-2 text-sm outline-none border-slate-300 bg-white focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-600'

  function onChange(path, val) {
    setS(prev => {
      const next = structuredClone(prev)
      const segs = path.split('.')
      let ref = next
      for (let i = 0; i < segs.length - 1; i++) ref = ref[segs[i]]
      ref[segs.at(-1)] = val
      return next
    })
  }

  function onSubmit(e) {
    e.preventDefault()
    saveSettings(s)
    toast.success('Configurações salvas!')
  }

  async function exportar() {
    const payload = {
      settings: s,
      storage: {
        patanet_pets: localStorage.getItem('patanet_pets') || '[]',
        patanet_photos: localStorage.getItem('patanet_photos') || '[]',
        patanet_feed_posts: localStorage.getItem('patanet_feed_posts') || '[]',
        patanet_vacinas: localStorage.getItem('patanet_vacinas') || '[]',
      },
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'patanet-backup.json'
    document.body.appendChild(a); a.click(); a.remove()
  }

  async function importar(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const txt = await file.text()
      const data = JSON.parse(txt)
      if (data?.settings) saveSettings(data.settings)
      if (data?.storage) {
        for (const [k, v] of Object.entries(data.storage)) {
          if (typeof v === 'string') localStorage.setItem(k, v)
        }
        window.dispatchEvent(new Event('patanet:photos-updated'))
        window.dispatchEvent(new Event('patanet:feed-updated'))
      }
      toast.success('Backup importado!')
      e.target.value = ''
    } catch {
      toast.error('Arquivo inválido.')
    }
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Configurações"
        breadcrumbs={[{label:'Dashboard', to:'/dashboard'},{label:'Configurações'}]}
        description="Preferências da sua conta e privacidade."
      />

      <form onSubmit={onSubmit} className="space-y-6">
        <FormCard title="Perfil">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Nome de exibição</label>
              <input className={input} value={s.displayName} onChange={e=>onChange('displayName', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input className={input} type="email" value={s.email} onChange={e=>onChange('email', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Bio</label>
              <textarea className={input} value={s.bio} onChange={e=>onChange('bio', e.target.value)} />
            </div>
          </div>
        </FormCard>

        <FormCard title="Preferências">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Tema</label>
              <select className={input} value={s.theme} onChange={e=>onChange('theme', e.target.value)}>
                <option value="auto">Automático (sistema)</option>
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
              </select>
              <p className="mt-1 text-xs opacity-70">O botão do topo continua funcionando; futuramente unificamos.</p>
            </div>
            <div className="flex items-center gap-2">
              <input id="n1" type="checkbox" checked={s.notifications.email} onChange={e=>onChange('notifications.email', e.target.checked)} />
              <label htmlFor="n1" className="text-sm">Notificações por email</label>
            </div>
            <div className="flex items-center gap-2">
              <input id="n2" type="checkbox" checked={s.notifications.push} onChange={e=>onChange('notifications.push', e.target.checked)} />
              <label htmlFor="n2" className="text-sm">Notificações push</label>
            </div>
          </div>
        </FormCard>

        <FormCard title="Privacidade">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <input id="p1" type="checkbox" checked={s.privacy.feedPublic} onChange={e=>onChange('privacy.feedPublic', e.target.checked)} />
              <label htmlFor="p1" className="text-sm">Feed visível publicamente</label>
            </div>
            <div className="flex items-center gap-2">
              <input id="p2" type="checkbox" checked={s.privacy.photosPublic} onChange={e=>onChange('privacy.photosPublic', e.target.checked)} />
              <label htmlFor="p2" className="text-sm">Fotos públicas por padrão</label>
            </div>
          </div>
        </FormCard>

        <FormCard title="Backup">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={exportar} className="rounded-md border px-3 py-1.5 text-sm border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
              Exportar dados (JSON)
            </button>
            <label className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm cursor-pointer border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
              Importar JSON
              <input type="file" accept="application/json" className="hidden" onChange={importar} />
            </label>
          </div>
        </FormCard>

        <div className="flex justify-end">
          <button type="submit" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:opacity-90 dark:bg-slate-200 dark:text-slate-900">
            Salvar
          </button>
        </div>
      </form>
    </div>
  )
}
