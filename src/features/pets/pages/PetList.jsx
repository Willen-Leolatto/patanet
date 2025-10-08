// src/features/pets/pages/PetList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Edit3, Trash2, PawPrint, ImagePlus, Search } from "lucide-react";
import { useAuth } from "@/store/auth";
import {
  loadPets,
  removePet,
  mediaGetUrl,
} from "@/features/pets/services/petsStorage";

export default function PetList() {
  const authUser = useAuth((s) => s.user);
  const currentUserId =
    authUser?.id || authUser?.uid || authUser?.email || authUser?.username || null;

  const [pets, setPets] = useState([]);
  const [resolves, setResolves] = useState({}); // {petId: {coverUrl, avatarUrl}}

  // filtros
  const [speciesFilter, setSpeciesFilter] = useState("todos"); // "todos" | "Cachorro" | "Gato"
  const [nameQuery, setNameQuery] = useState("");

  const myPets = useMemo(() => {
    const all = Array.isArray(pets) ? pets : [];
    if (!currentUserId) return [];
    return all.filter((p) => (p.ownerId || p.userId || p.createdBy) === currentUserId);
  }, [pets, currentUserId]);

  // pets filtrados
  const filteredPets = useMemo(() => {
    const q = nameQuery.trim().toLowerCase();
    return myPets.filter((p) => {
      const speciesOk =
        speciesFilter === "todos" ? true : (p.species || "").toLowerCase() === speciesFilter.toLowerCase();
      const nameOk = q ? String(p.name || "").toLowerCase().includes(q) : true;
      return speciesOk && nameOk;
    });
  }, [myPets, speciesFilter, nameQuery]);

  // carregar pets ao montar
  useEffect(() => {
    setPets(loadPets());
  }, []);

  // ouvir alterações externas (ex.: criou/alterou pet em outra tela)
  useEffect(() => {
    const onUpdate = () => setPets(loadPets());
    window.addEventListener("patanet:pets-updated", onUpdate);
    return () => window.removeEventListener("patanet:pets-updated", onUpdate);
  }, []);

  // resolver cover/avatar por IndexedDB (coverId/avatarId)
  useEffect(() => {
    let cancelled = false;

    async function resolveAll() {
      const pairs = await Promise.all(
        myPets.map(async (p) => {
          // COVER
          let coverUrl = p.cover || "";
          if (!coverUrl && p.coverId) {
            try {
              coverUrl = await mediaGetUrl(p.coverId);
            } catch {
              coverUrl = "";
            }
          }
          // AVATAR (fallback para cover quando não houver avatar)
          let avatarUrl = p.avatar || "";
          if (!avatarUrl && p.avatarId) {
            try {
              avatarUrl = await mediaGetUrl(p.avatarId);
            } catch {
              avatarUrl = "";
            }
          }
          if (!avatarUrl) avatarUrl = coverUrl; // fallback seguro

          return [p.id, { coverUrl, avatarUrl }];
        })
      );

      if (!cancelled) {
        const map = {};
        for (const [id, val] of pairs) map[id] = val;
        setResolves(map);
      }
    }

    resolveAll();
    return () => {
      cancelled = true;
      // revogar blobs
      Object.values(resolves).forEach(({ coverUrl, avatarUrl }) => {
        [coverUrl, avatarUrl].forEach((u) => {
          if (u && typeof u === "string" && u.startsWith("blob:")) {
            try {
              URL.revokeObjectURL(u);
            } catch {}
          }
        });
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPets.length]);

  const handleRemove = (pet) => {
    if (!pet?.id) return;
    if (!window.confirm(`Remover "${pet.name || "pet"}"?`)) return;
    removePet(pet.id);
    setPets((list) => list.filter((x) => x.id !== pet.id));
  };

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
      {/* Header */}
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-2 text-sm font-medium opacity-80">
          <PawPrint className="h-4 w-4" />
          Seus Pets
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:gap-3">
          {/* Filtros */}
          <div className="flex items-stretch gap-2">
            {/* Filtro por espécie */}
            <select
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
              className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none transition hover:border-zinc-300 focus:border-[#f77904] dark:border-zinc-700 dark:bg-zinc-900"
              title="Filtrar por espécie"
            >
              <option value="todos">Todas as espécies</option>
              <option value="Cachorro">Cães</option>
              <option value="Gato">Gatos</option>
            </select>

            {/* Busca por nome */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
              <input
                type="text"
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                placeholder="Buscar por nome…"
                className="h-9 w-48 rounded-lg border border-zinc-200 bg-white pl-8 pr-3 text-sm outline-none transition hover:border-zinc-300 focus:border-[#f77904] dark:border-zinc-700 dark:bg-zinc-900 sm:w-56"
              />
            </div>
          </div>

          {/* Botão Adicionar */}
          <Link
            to="/pets/novo"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#f77904] px-3 py-1.5 text-xs font-semibold text-white"
          >
            <ImagePlus className="h-4 w-4" /> Adicionar pet
          </Link>
        </div>
      </header>

      {/* Lista */}
      {filteredPets.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 text-sm opacity-70 dark:border-zinc-800 dark:bg-zinc-900">
          {myPets.length === 0
            ? "Você ainda não cadastrou nenhum pet."
            : "Nenhum pet encontrado com os filtros aplicados."}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPets.map((p) => {
            const coverUrl = resolves[p.id]?.coverUrl || "";
            const avatarUrl = resolves[p.id]?.avatarUrl || "";

            return (
              <li
                key={p.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <Link to={`/pets/${p.id}`} className="block">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {coverUrl ? (
                      <img
                        src={coverUrl || undefined}
                        alt={p.name}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xs opacity-60">
                        sem capa
                      </div>
                    )}
                  </div>
                </Link>

                <div className="space-y-3 p-4">
                  <div className="flex items-start gap-3">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl || undefined}
                        alt=""
                        className="h-12 w-12 rounded-full object-cover ring-2 ring-white dark:ring-zinc-900"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-zinc-200 ring-2 ring-white dark:bg-zinc-800 dark:ring-zinc-900" />
                    )}

                    <div className="min-w-0">
                      <Link
                        to={`/pets/${p.id}`}
                        className="group inline-flex items-center gap-1"
                      >
                        <h3 className="truncate text-base font-semibold leading-5 group-hover:underline">
                          {p.name || "Sem nome"}
                        </h3>
                      </Link>
                      <p className="truncate text-xs opacity-70 capitalize">
                        {p.species} • {p.breed || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs opacity-70">
                      Nasc. {formatDate(p.birthday)} • {Number(p.weight || 0)} kg
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/pets/${p.id}/editar`}
                        title="Editar"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f77904] text-white"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleRemove(p)}
                        title="Remover"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f77904] text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* --------------------------------- utils ---------------------------------- */
function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}
