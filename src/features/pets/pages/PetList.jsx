import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  PawPrint,
  Syringe,
  CalendarDays,
  Ruler,
  Search,
  ChevronRight,
  Weight,
  Mars,
  Venus,
} from "lucide-react";
import {
  loadPets as storageListPets,
  removePet as storageRemovePet,
} from "@/features/pets/services/petsStorage";
import { useAuth } from "@/store/auth"; // <-- NOVO

/* -------------------- helpers -------------------- */
const fmtKg = (n) => (n ? `${n} kg` : "—");
const title = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "—");
const ageFrom = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  const months = Math.floor(
    (diff - years * 365.25 * 24 * 60 * 60 * 1000) / (30 * 24 * 60 * 60 * 1000)
  );
  if (years <= 0) return `${months}m`;
  return `${years}a ${months}m`;
};

const Badge = ({ children, className = "" }) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs
      bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] 
      text-[var(--card-fg)]
      dark:text-[var(--card-fg)]
      ${className}`}
  >
    {children}
  </span>
);

/* -------------------- exemplos quando storage estiver vazio -------------------- */
const EXAMPLES = [
  {
    id: "ex-1",
    name: "Max",
    species: "cão",
    breed: "Labrador",
    gender: "macho",
    weight: 28,
    size: "médio",
    birthday: "2021-06-10",
    avatar:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600&q=80&auto=format&fit=crop",
    cover:
      "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=1200&q=80&auto=format&fit=crop",
    vaccines: 6,
  },
  {
    id: "ex-2",
    name: "Nina",
    species: "cão",
    breed: "Border Collie",
    gender: "fêmea",
    weight: 19.5,
    size: "médio",
    birthday: "2022-03-15",
    avatar:
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&q=80&auto=format&fit=crop",
    cover:
      "https://images.unsplash.com/photo-1525253086316-d0c936c814f8?w=1200&q=80&auto=format&fit=crop",
    vaccines: 5,
  },
  {
    id: "ex-3",
    name: "Mimi",
    species: "gato",
    breed: "SRD",
    gender: "fêmea",
    weight: 4.2,
    size: "pequeno",
    birthday: "2020-12-01",
    avatar:
      "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600&q=80&auto=format&fit=crop",
    cover:
      "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=1200&q=80&auto=format&fit=crop",
    vaccines: 7,
  },
];

/* -------------------- componente -------------------- */
export default function PetList() {
  const nav = useNavigate();
  const me = useAuth((s) => s.user); // <-- NOVO
  const [pets, setPets] = useState([]);
  const [q, setQ] = useState("");
  const [species, setSpecies] = useState("todas");

  // só pode editar se for o dono do pet; exemplos (sem ownerId) ficam read-only
  const canEdit = (p) => p.ownerId ? p.ownerId === me.user?.id : !!me.user; ; 
  
  useEffect(() => {
    // carrega do storage; fallback para exemplos
    try {
      const data = storageListPets?.() || [];
      setPets(Array.isArray(data) && data.length ? data : EXAMPLES);
    } catch {
      setPets(EXAMPLES);
    }
  }, []);

  const speciesOptions = useMemo(() => {
    const set = new Set(
      pets
        .map((p) => p.species)
        .filter(Boolean)
        .map((s) => s.toLowerCase())
    );
    return ["todas", ...Array.from(set)];
  }, [pets]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return pets.filter((p) => {
      const okSpecies =
        species === "todas" || (p.species || "").toLowerCase() === species;
      const txt = `${p.name || ""} ${p.breed || ""} ${
        p.species || ""
      }`.toLowerCase();
      const okQuery = term.length === 0 || txt.includes(term);
      return okSpecies && okQuery;
    });
  }, [pets, q, species]);

  function onRemove(p) {
    if (!p?.id) return;
    const ok = confirm(`Remover "${p.name}"?`);
    if (!ok) return;
    try {
      storageRemovePet?.(p.id);
    } catch {
      // se estiver usando exemplos, só remove local
    }
    setPets((prev) => prev.filter((x) => x.id !== p.id));
  }

  function Stat({ icon: Ico, children }) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] leading-none text-white/90">
        <Ico className="h-3.5 w-3.5 opacity-90" />
        <span>{children}</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-lg font-semibold">Meus Pets</h1>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value.toLowerCase())}
            placeholder="Buscar por nome, raça…"
            className="h-9 w-[280px] rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 dark:bg-white/5 dark:text-slate-100"
          />
        </div>

        <select
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none dark:bg-white/5 dark:text-slate-100"
        >
          <option value="todas">Todas</option>
          <option value="cão">Cão</option>
          <option value="gato">Gato</option>
        </select>

        <Link
          to="/pets/novo"
          title="Novo pet"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f77904] text-white"
        >
          +
        </Link>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-[var(--card-bg)] p-6 text-center dark:border-slate-800">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_18%,transparent)]">
            <PawPrint className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <h2 className="mb-1 text-lg font-semibold">Nenhum pet encontrado</h2>
          <p className="mb-4 text-sm opacity-70">
            Ajuste os filtros ou cadastre seu primeiro pet.
          </p>
          <Link
            to="/pets/novo"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f77904] text-white"
          >
            <Plus className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <li
              key={p.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-[var(--card-bg)] shadow-sm transition hover:shadow-md dark:border-slate-800"
            >
              {/* Cover */}
              <Link to={`/pets/${p.id}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={p.cover || p.avatar}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
              </Link>

              {/* Content */}
              <div className="space-y-3 p-4">
                <div className="flex items-start gap-3">
                  <img
                    src={p.avatar || p.cover}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-white dark:ring-slate-900"
                  />
                  <div className="min-w-0">
                    <Link
                      to={`/pets/${p.id}`}
                      className="group inline-flex items-center gap-1"
                    >
                      <h3 className="truncate text-base font-semibold leading-5 group-hover:underline">
                        {p.name || "Sem nome"}
                      </h3>
                      {p.gender === "macho" ? (
                        <Mars className="h-4 w-4 opacity-60" />
                      ) : (
                        <Venus className="h-4 w-4 opacity-60" />
                      )}
                      <ChevronRight className="h-4 w-4 opacity-60" />
                    </Link>
                    <p className="truncate text-xs opacity-70">
                      {title(p.species)} • {title(p.breed)} • {title(p.gender)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-md border border-slate-200 p-2 dark:border-slate-800">
                    <div className="mb-1 flex items-center gap-1 opacity-70">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Nasc.
                    </div>
                    <div className="font-medium">
                      {p.birthday
                        ? new Date(p.birthday).toLocaleDateString()
                        : "—"}
                      <span className="ml-1 opacity-70">
                        ({ageFrom(p.birthday)})
                      </span>
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-200 p-2 dark:border-slate-800">
                    <div className="mb-1 flex items-center gap-1 opacity-70">
                      <Ruler className="h-3.5 w-3.5" />
                      Porte
                    </div>
                    <div className="font-medium">{title(p.size)}</div>
                  </div>

                  <div className="rounded-md border border-slate-200 p-2 dark:border-slate-800">
                    <div className="mb-1 flex items-center gap-1 opacity-70">
                      <Weight className="h-3.5 w-3.5" />
                      Peso
                    </div>
                    <div className="font-medium">{fmtKg(p.weight)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs opacity-80">
                    <Syringe className="h-3.5 w-3.5" />
                    <span>{p.vaccines ?? 0} registros</span>
                  </div>

                  {/* ações só para o dono do pet */}
                  {canEdit(p) && (
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/pets/${p.id}/editar`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f77904] text-white"
                        title="Editar"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => onRemove(p)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f77904] text-white"
                        title="Remover"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
