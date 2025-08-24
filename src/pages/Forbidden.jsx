import React from 'react'
import PageHeader from '../components/PageHeader'
import ContentCard from '../components/ContentCard'
import { Link } from 'react-router-dom'

export default function Forbidden() {
  return (
    <div className="w-full">
      <PageHeader title="Sem permissão" description="Você não tem acesso a esta área." />
      <ContentCard>
        <p className="text-sm">
          Se você precisa realizar esta ação, peça ao proprietário ou a um gerente que atualize seu papel na família.
        </p>
        <div className="mt-3">
          <Link to="/dashboard" className="rounded-md border px-3 py-1.5 text-sm
            border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
            Voltar ao dashboard
          </Link>
        </div>
      </ContentCard>
    </div>
  )
}
