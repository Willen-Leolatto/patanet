// src/features/pets/pages/PetDetail.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Syringe,
  Images,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Ruler,
  Weight,
  Pencil,
  Plus,
} from "lucide-react";
import { getPetById } from "@features/pets/services/petsStorage";
import { useToast } from "@/components/ui/ToastProvider";

// exemplos usados quando não há storage
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

function getExample(id) {
  return EXAMPLES.find((p) => p.id === id);
}

function formatKg(n) {
  if (n == null || n === "") return "—";
  const num = typeof n === "number" ? n : parseFloat(String(n).replace(",", "."));
  if (Number.isNaN(num)) return "—";
  return `${num.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`;
}

function formatDateIso(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function PetDetail() {
  const { id } = useParams();
  const toast = useToast();
  const nav = useNavigate();
  const fileRef = useRef(null);

  const pet = useMemo(() => getPetById(id) || getExample(id), [id]);

  // galeria local por pet
  const storageKey = `patanet_pet_media_${id}`;
  const [media, setMedia] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setMedia(raw ? JSON.parse(raw) : []);
    } catch {
      setMedia([]);
    }
  }, [storageKey]);

  function persistMedia(next) {
    setMedia(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    window.dispatchEvent(new Event("patanet:photos-updated"));
  }

  async function onPickFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      // lê como dataURL para persistir
      const readers = files.map(
        (f) =>
          new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = () => res({ id: crypto.randomUUID(), type: f.type, src: r.result });
            r.onerror = rej;
            r.readAsDataURL(f);
          })
      );
      const items = await Promise.all(readers);
      persistMedia([...items, ...media]); // mais novo primeiro
      toast.success("Mídia adicionada!");
    } catch {
      toast.error("Falha ao processar o arquivo.");
    } finally {
      e.target.value = "";
    }
  }

  const [tab, setTab] = useState("saude"); // 'saude' | 'galeria'
  const [openVac, setOpenVac] = useState(true);

  if (!pet) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-[var(--content-bd)] bg-[var(--content-bg)] p-6">
          Pet não encontrado.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="grid grid-cols-12 gap-6">
        {/* ESQUERDA - CARTÃO DO PET */}
        <section className="col-span-12 lg:col-span-5">
          <div className="rounded-2xl border border-[var(--content-bd)] bg-[var(--content-bg)] p-6">
            {/* Faixa avatar + nome + raça/espécie */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={pet.avatar}
                  alt={pet.name}
                  className="h-20 w-20 rounded-full object-cover ring-4 ring-black/10 dark:ring-white/10"
                />
                <button
                  type="button"
                  className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f77904] text-white shadow hover:opacity-90"
                  title="Editar perfil do pet"
                  onClick={() => nav(`/pets/${id}/editar`)}
                >
                  <Pencil size={16} />
                </button>
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold text-[var(--text-strong)]">
                  {pet.name}
                </h1>
                <p className="truncate text-sm opacity-80">
                  {pet.species} • {pet.breed}
                </p>
              </div>
            </div>

            {/* Descritivo */}
            <div className="mt-4 text-sm leading-relaxed opacity-90">
              {pet.bio || "Sem descrição adicionada."}
            </div>

            {/* Linhas: tamanho/peso/sexo */}
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <InfoCard icon={<Ruler size={14} />} label="Tamanho" value={pet.size || "—"} />
              <InfoCard icon={<Weight size={14} />} label="Peso" value={formatKg(pet.weight)} />
              <InfoCard icon={<span className="inline-block h-2 w-2 rounded-full bg-current" />} label="Sexo" value={pet.gender || "—"} />
            </div>

            {/* Datas importantes */}
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold tracking-wide opacity-90">
                Datas importantes
              </h3>

              <div className="space-y-3">
                <DateRow
                  icon={<CalendarDays size={16} />}
                  label="Nascimento"
                  value={formatDateIso(pet.birthday)}
                  rightHint={ageFrom(pet.birthday)}
                />
                <DateRow
                  icon={<CalendarDays size={16} />}
                  label="Adoção"
                  value={formatDateIso(pet.adoptedAt)}
                  rightHint=""
                />
              </div>
            </div>
          </div>
        </section>

        {/* DIVISOR VERTICAL */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="mx-auto h-full w-px bg-[var(--content-bd)]" />
        </div>

        {/* DIREITA - SAÚDE / GALERIA */}
        <section className="col-span-12 lg:col-span-6">
          {/* Pills */}
          <div className="mb-4 flex items-center gap-3 pt-2">
            <button
              onClick={() => setTab("saude")}
              className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-all ${
                tab === "saude"
                  ? "bg-[#f77904] text-white shadow"
                  : "bg-[var(--chip-bg)] text-[var(--text-weak)] hover:opacity-90"
              }`}
            >
              <Syringe size={16} /> Carteira de Saúde
            </button>
            <button
              onClick={() => setTab("galeria")}
              className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-all ${
                tab === "galeria"
                  ? "bg-[#f77904] text-white shadow"
                  : "bg-[var(--chip-bg)] text-[var(--text-weak)] hover:opacity-90"
              }`}
            >
              <Images size={16} /> Galeria
            </button>
          </div>

          <div className="rounded-2xl border border-[var(--content-bd)] bg-[var(--content-bg)] p-4 sm:p-6">
            {tab === "saude" ? (
              <div className="space-y-4">
                {/* Accordion Vacinas */}
                <div className="rounded-xl border border-[var(--content-bd)]">
                  <button
                    onClick={() => setOpenVac((v) => !v)}
                    className="flex w-full items-center justify-between gap-3 rounded-t-xl bg-[var(--content-soft)] px-4 py-3 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-500">
                        <Syringe size={16} />
                      </div>
                      <div className="leading-tight">
                        <div className="text-sm font-medium">Vacinas</div>
                        <div className="text-xs opacity-70">0 registro(s)</div>
                      </div>
                    </div>
                    {openVac ? (
                      <ChevronUp className="opacity-70" size={18} />
                    ) : (
                      <ChevronDown className="opacity-70" size={18} />
                    )}
                  </button>

                  <div
                    className={`overflow-hidden px-4 transition-[max-height] duration-300 ease-in-out ${
                      openVac ? "max-h-[480px] py-4" : "max-h-0"
                    }`}
                  >
                    <div className="rounded-lg border border-dashed border-[var(--content-bd)] p-4 text-sm opacity-80">
                      Nenhuma vacina registrada para este pet.
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-md bg-[#f77904] px-3 py-2 text-sm text-white hover:opacity-90"
                        onClick={() =>
                          toast.info("Gerenciador de vacinas entrará via modal na próxima etapa.")
                        }
                      >
                        <Plus size={16} /> Gerenciar vacinas
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Galeria
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm opacity-80">
                    {media.length} mídia(s) vinculadas
                  </p>
                  <div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      hidden
                      onChange={onPickFiles}
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-md bg-[#f77904] px-3 py-2 text-sm text-white hover:opacity-90"
                    >
                      <Plus size={16} /> Adicionar mídia
                    </button>
                  </div>
                </div>

                {/* grid da galeria */}
                {media.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[var(--content-bd)] p-6 text-sm opacity-80">
                    Nenhuma mídia ainda. Clique em “Adicionar mídia”.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {media.map((m) => (
                      <div
                        key={m.id}
                        className="group overflow-hidden rounded-xl border border-[var(--content-bd)] bg-[var(--content-soft)]"
                      >
                        {m.type?.startsWith("video/") ? (
                          <video
                            src={m.src}
                            controls
                            className="h-40 w-full object-cover"
                          />
                        ) : (
                          <img
                            src={m.src}
                            alt=""
                            className="h-40 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* -------- components auxiliares -------- */

function InfoCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-[var(--content-bd)] bg-[var(--content-soft)] px-4 py-3">
      <div className="mb-1 flex items-center gap-2 text-xs opacity-70">
        <span className="inline-flex items-center">{icon}</span>
        {label}
      </div>
      <div className="text-sm font-medium">{value || "—"}</div>
    </div>
  );
}

function DateRow({ icon, label, value, rightHint }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--content-bd)] bg-[var(--content-soft)] px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[var(--chip-bg)]">
          {icon}
        </span>
        <div className="text-sm">
          <div className="opacity-70">{label}</div>
          <div className="font-medium">{value}</div>
        </div>
      </div>
      <div className="text-xs opacity-70">{rightHint}</div>
    </div>
  );
}

function ageFrom(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(+d)) return "";
  const now = new Date();
  let y = now.getFullYear() - d.getFullYear();
  let m = now.getMonth() - d.getMonth();
  if (m < 0) {
    y -= 1;
    m += 12;
  }
  const ys = y > 0 ? `${y}a` : "";
  const ms = m > 0 ? `${m}m` : "";
  return [ys, ms].filter(Boolean).join(" ");
}
