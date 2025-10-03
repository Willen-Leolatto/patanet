// src/features/pets/pages/PetForm.jsx
import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addPet, getPet, updatePet } from "@/features/pets/services/petsStorage";

const INPUT = 'w-full rounded-md border px-3 py-2 text-sm outline-none border-slate-300 bg-white focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-600'

export default function PetForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const editing = Boolean(id)
  const current = useMemo(() => id ? getPet(id) : null, [id])

  const [form, setForm] = useState(() => current || {
    name: '', species: 'Cachorro', breed: '', gender: 'Macho', size: 'Médio',
    weight: '', birthdate: '', adoptionDate: '', notes: '', avatar: ''
  })

  function set(path, val){
    setForm(prev => ({ ...prev, [path]: val }))
  }

  async function onChooseAvatar(e){
    const file = e.target.files?.[0]; if(!file) return
    const dataUrl = await fileToDataURL(file)
    set('avatar', dataUrl)
  }
  function fileToDataURL(file){
    return new Promise((res, rej)=>{
      const reader = new FileReader()
      reader.onload = () => res(reader.result)
      reader.onerror = rej
      reader.readAsDataURL(file)
    })
  }

  function onSubmit(e){
    e.preventDefault()
    if(editing){
      updatePet(id, form)
      nav(`/pets/${id}`)
    }else{
      const p = addPet(form)
      nav(`/pets/${p.id}`)
    }
  }

  return (
    <div className="content-container">
      <h1 className="mb-4 text-xl font-semibold">{editing ? 'Editar pet' : 'Novo pet'}</h1>

      <form onSubmit={onSubmit} className="card p-4 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2 flex items-center gap-4">
          <img src={form.avatar || 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22></svg>'}
               alt="" className="h-20 w-20 rounded-full object-cover border" />
          <label className="rounded-md border px-3 py-2 text-sm cursor-pointer">
            Escolher foto
            <input type="file" accept="image/*" className="hidden" onChange={onChooseAvatar}/>
          </label>
        </div>

        <div>
          <label className="text-sm font-medium">Nome</label>
          <input className={INPUT} value={form.name} onChange={e=>set('name', e.target.value)}/>
        </div>
        <div>
          <label className="text-sm font-medium">Espécie</label>
          <select className={INPUT} value={form.species} onChange={e=>set('species', e.target.value)}>
            <option>Cachorro</option><option>Gato</option><option>Outro</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Raça</label>
          <input className={INPUT} value={form.breed} onChange={e=>set('breed', e.target.value)}/>
        </div>
        <div>
          <label className="text-sm font-medium">Gênero</label>
          <select className={INPUT} value={form.gender} onChange={e=>set('gender', e.target.value)}>
            <option>Macho</option><option>Fêmea</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Porte</label>
          <select className={INPUT} value={form.size} onChange={e=>set('size', e.target.value)}>
            <option>Pequeno</option><option>Médio</option><option>Grande</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Peso (kg)</label>
          <input className={INPUT} value={form.weight} onChange={e=>set('weight', e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium">Nascimento</label>
          <input type="date" className={INPUT} value={form.birthdate} onChange={e=>set('birthdate', e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Adoção</label>
          <input type="date" className={INPUT} value={form.adoptionDate} onChange={e=>set('adoptionDate', e.target.value)} />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium">Observações</label>
          <textarea rows={4} className={INPUT} value={form.notes} onChange={e=>set('notes', e.target.value)} />
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button type="submit" className="btn-action rounded-md px-4 py-2 text-sm">
            {editing ? 'Salvar alterações' : 'Cadastrar pet'}
          </button>
        </div>
      </form>
    </div>
  )
}
