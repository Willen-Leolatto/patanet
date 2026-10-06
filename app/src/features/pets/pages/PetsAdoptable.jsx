// src/features/pets/pages/PetsAdoptable.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Search } from "lucide-react";

import { fetchAdoptableAnimals } from "@/api/animal.api.js";
import AdoptionTermModal from "@/features/pets/components/AdoptionTermModal.jsx";

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

const genderPt = (g) => {
  const v = String(g || "").toUpperCase();
  if (v === "MALE") return "Macho";
  if (v === "FEMALE") return "Fêmea";
  return "—";
};

const speciePt = (s) => {
  const v = String(s || "").toLowerCase();
  if (["cachorro", "cão", "cao", "dog", "canino"].includes(v)) return "Cão";
  if (["gato", "felino", "cat"].includes(v)) return "Gato";
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : "—";
};

/**
 * Lista pets sem dono, disponiveis para adocao (backend: GET /animals/adoptable).
 * Qualquer usuario logado pode adotar um pet direto por aqui (POST /animals/:id/adopt),
 * assim como pelos pets vinculados a um evento de adocao de instituicao (EventDetail.jsx).
 */
export default function PetsAdoptable() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [candidatePet, setCandidatePet] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const resp = await fetchAdoptableAnimals({ page: 1, perPage: 200 });
      const list =
        (resp && Array.isArray(resp.data) && resp.data) ||
        (Array.isArray(resp) && resp) ||
        (resp && Array.isArray(resp.items) && resp.items) ||
        [];
      setPets(list);
    } catch {
      setPets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pets;
    return pets.filter((p) =>
      String(p.name || "")
        .toLowerCase()
        .includes(q)
    );
  }, [pets, query]);

  function handleAdoptionCompleted(pet) {
    setPets((list) => list.filter((x) => x.id !== pet.id));
    window.dispatchEvent(new CustomEvent("patanet:pets-updated"));
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 opacity-80">
          <Heart className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Pets para adoção</h1>
        </div>
      </header>

      {/* Busca */}
      <div className="mb-4">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome…"
            className="h-10 w-full rounded-lg bg-white/60 px-9 text-sm ring-1 ring-zinc-200 outline-none placeholder:text-zinc-400 focus:ring-orange-400 dark:bg-zinc-900/60 dark:ring-zinc-700"
          />
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm opacity-70 dark:border-zinc-800 dark:bg-zinc-900">
          Carregando pets disponíveis…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm opacity-70 dark:border-zinc-800 dark:bg-zinc-900">
          Nenhum pet disponível para adoção no momento.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const cover = p?.imageCover?.url || p?.imageCover || "";
            const avatar = p?.image?.url || p?.image || p?.breed?.image || "";

            return (
              <li
                key={p.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <Link to={`/pets/${p.id}`} className="block">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {cover ? (
                      <img
                        src={cover || undefined}
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
                    {avatar ? (
                      <img
                        src={avatar || undefined}
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
                      <p className="truncate text-xs opacity-70">
                        {speciePt(
                          p?.breed?.specie?.name ||
                            p?.specie?.name ||
                            p?.species ||
                            p?.specie
                        )}
                        {" • "}
                        {String(p?.breed?.name || p?.breed || "—")}
                        {" • "}
                        {genderPt(p?.gender)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs opacity-70">
                      Nasc.{" "}
                      {formatDate(p.birthday || p.birthDate || p.birthdate)} •{" "}
                      {p.weight || 0} kg
                    </div>

                    <button
                      type="button"
                      onClick={() => setCandidatePet(p)}
                      className="inline-flex items-center gap-1 rounded-full bg-[#f77904] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                    >
                      <Heart className="h-3.5 w-3.5" /> Quero Adotar
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AdoptionTermModal
        pet={candidatePet}
        open={Boolean(candidatePet)}
        onClose={() => setCandidatePet(null)}
        onCompleted={handleAdoptionCompleted}
      />
    </div>
  );
}
