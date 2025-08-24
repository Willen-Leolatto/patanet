import React, { useEffect, useMemo, useState } from 'react'
import PageHeader from "../components/PageHeader";
import ContentCard from "../components/ContentCard";
import { loadPhotos } from "../utils/photosStorage";
import { loadPets } from "../utils/petsStorage";
import { Link } from "react-router-dom";

export default function DashboardHome() {
  const [photos, setPhotos] = useState([]);
  const [pets, setPets] = useState([]);

  useEffect(() => {
    const refresh = () => setPhotos(loadPhotos());
    setPhotos(loadPhotos());
    setPets(loadPets());
    window.addEventListener("patanet:photos-updated", refresh);
    return () => window.removeEventListener("patanet:photos-updated", refresh);
  }, []);

  const petNameById = useMemo(() => {
    const m = new Map();
    pets.forEach((p) => m.set(Number(p.id), p.name));
    return (id) => m.get(Number(id)) || null;
  }, [pets]);

  const latest = photos.slice(0, 4);
  return (
    <div className="w-full">
      <PageHeader
        title="Dashboard"
        breadcrumbs={[{ label: "Dashboard" }]}
        description="Visão geral do seu espaço: pets, vacinas, fotos e família."
      />

      {/* Grid responsiva que preenche telas grandes */}
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
        <ContentCard
          title="Meus Pets"
          description="Lista, cadastro e grupos familiares (em breve)."
        />
        <ContentCard
          title="Carteira de Vacinação"
          description="Vacinas, lembretes e anexos do cartão (em breve)."
        />
        <ContentCard
          title="Fotos"
          description="Álbuns e imagens dos pets (em breve)."
        />
        <ContentCard
          title="Família"
          description="Membros, convites e permissões (em breve)."
        />
      </div>
      <ContentCard
        title="Últimas fotos"
        actions={
          <Link
            to="/dashboard/fotos"
            className="rounded-md border px-3 py-1.5 text-sm border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Ver todas
          </Link>
        }
      >
        {latest.length === 0 ? (
          <div className="text-sm opacity-70">Você ainda não enviou fotos.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {latest.map((ph) => {
              const ids =
                Array.isArray(ph.petIds) && ph.petIds.length
                  ? ph.petIds
                  : ph.petId != null
                  ? [ph.petId]
                  : [];
              return (
                <figure
                  key={ph.id}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40"
                >
                  <img
                    src={ph.src}
                    alt={ph.caption || "Foto"}
                    className="h-40 w-full object-cover"
                    loading="lazy"
                  />
                  <figcaption className="p-2">
                    <div className="line-clamp-2 text-sm">
                      {ph.caption || (
                        <span className="opacity-60">Sem legenda</span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {ids.length === 0 && (
                        <span className="rounded-full border px-2 py-0.5 text-[11px] border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200">
                          Sem pet
                        </span>
                      )}
                      {ids.map((pid) => (
                        <span
                          key={pid}
                          className="rounded-full border px-2 py-0.5 text-[11px] border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                        >
                          {petNameById(pid) || "—"}
                        </span>
                      ))}
                    </div>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        )}
      </ContentCard>
    </div>
  );
}
