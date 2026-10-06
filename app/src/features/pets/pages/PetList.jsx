// src/features/pets/pages/PetList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Edit3, Trash2, PawPrint, ImagePlus, Search } from "lucide-react";

import { getMyProfile } from "@/api/user.api.js";
import { fetchAnimalsByOwner } from "@/api/owner.api.js";
import { fetchAnimalsById, deleteAnimal } from "@/api/animal.api.js";

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
 * Este componente pode receber opcionalmente `userId` (id do perfil sendo visto).
 * - Se `userId` for do usuário logado, mostra edição/remoção e botão "Adicionar pet".
 * - Se `userId` for de outro usuário, lista somente leitura (sem ações).
 * - Se `userId` não for informado, assume o usuário logado.
 */
export default function PetList({ userId: propUserId = null }) {
  const [me, setMe] = useState(null);

  const [pets, setPets] = useState([]);
  const [thumbs, setThumbs] = useState({}); // { [id]: { avatarUrl, coverUrl } }

  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  const [query, setQuery] = useState("");

  const targetUserId = propUserId || me?.id;
  const isOwner =
    !!me?.id && !!targetUserId && String(me.id) === String(targetUserId);

  /* ---------------------------- carregamento inicial ---------------------------- */
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const u = await getMyProfile().catch(() => null);
        if (cancel) return;
        setMe(u || null);
      } finally {
        // só depois de definir `me` que buscamos os pets (no efeito abaixo)
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  // Buscar pets do dono (owner) — usa Owner API
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!targetUserId) return;
      setLoading(true);
      try {
        const resp = await fetchAnimalsByOwner({
          userId: String(targetUserId),
          page: 1,
          perPage: 200,
        });
        const list =
          (resp && Array.isArray(resp.data) && resp.data) ||
          (Array.isArray(resp) && resp) ||
          (resp && Array.isArray(resp.items) && resp.items) ||
          [];
        if (!cancel) setPets(list);
      } catch {
        if (!cancel) setPets([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [targetUserId]);

  // ouvir alterações externas (ex.: criou/alterou pet em outra tela)
  useEffect(() => {
    const onUpdate = () => {
      if (!targetUserId) return;
      fetchAnimalsByOwner({
        userId: String(targetUserId),
        page: 1,
        perPage: 200,
      })
        .then((resp) => {
          const list =
            (resp && Array.isArray(resp.data) && resp.data) ||
            (Array.isArray(resp) && resp) ||
            (resp && Array.isArray(resp.items) && resp.items) ||
            [];
          setPets(list);
        })
        .catch(() => {});
    };
    window.addEventListener("patanet:pets-updated", onUpdate);
    return () => window.removeEventListener("patanet:pets-updated", onUpdate);
  }, [targetUserId]);

  // resolver cover/avatar pela própria API do animal (caso a listagem não traga)
  useEffect(() => {
    let cancelled = false;

    async function resolveThumbs() {
      const map = {};
      for (const p of pets) {
        let avatarUrl = p?.image?.url || p?.image || p?.breed?.image || "";
        let coverUrl = p?.imageCover?.url || p?.imageCover || "";

        if (!avatarUrl || !coverUrl) {
          try {
            const full = await fetchAnimalsById({ animalId: p.id });
            const a = full?.data || full || {};
            avatarUrl =
              avatarUrl || a?.image?.url || a?.image || a?.breed?.image || "";
            coverUrl = coverUrl || a?.imageCover?.url || a?.imageCover || "";
          } catch {
            // ignore
          }
        }
        map[p.id] = { avatarUrl, coverUrl };
      }
      if (!cancelled) setThumbs(map);
    }

    if (pets.length) resolveThumbs();
    else setThumbs({});

    return () => {
      cancelled = true;
    };
  }, [pets]);

  /* --------------------------------- busca --------------------------------- */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pets;
    return pets.filter((p) =>
      String(p.name || "")
        .toLowerCase()
        .includes(q)
    );
  }, [pets, query]);

  /* -------------------------------- remover -------------------------------- */
  async function handleRemove(pet) {
    if (!pet?.id) return;
    const ok = window.confirm(`Remover o pet "${pet.name}"?`);
    if (!ok) return;
    setRemoving(pet.id);
    try {
      await deleteAnimal({ animalId: pet.id });
      setPets((list) => list.filter((x) => x.id !== pet.id));
      // notifica outras telas (detalhe/edição)
      window.dispatchEvent(new CustomEvent("patanet:pets-updated"));
    } catch {
      // noop
    } finally {
      setRemoving(null);
    }
  }

  /* --------------------------------- render -------------------------------- */
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 opacity-80">
          <PawPrint className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Meus Pets</h1>
        </div>

        {isOwner && (
          <Link
            to="/pets/novo"
            className="inline-flex items-center gap-2 rounded-lg bg-[#f77904] px-3 py-1.5 text-xs font-semibold text-white"
          >
            <ImagePlus className="h-4 w-4" />
            Adicionar pet
          </Link>
        )}
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
          Carregando seus pets…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm opacity-70 dark:border-zinc-800 dark:bg-zinc-900">
          Nenhum pet encontrado.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const t = thumbs[p.id] || {};
            const cover = t.coverUrl || "";
            const avatar = t.avatarUrl || "";

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

                    {isOwner ? (
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
                          disabled={removing === p.id}
                          title="Remover"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f77904] text-white disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div /> // mantém espaçamento sem alterar layout
                    )}
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
