import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Shield,
  Images,
  Syringe,
  Pill,
  Stethoscope,
  Bandage,
  Plus,
  Star,
  Edit3,
  Trash2,
  ChevronDown,
} from "lucide-react";
import Lightbox from "@/components/Lightbox";
import { useToast } from "@/components/ui/ToastProvider";
import {
  getPet as storageGetPet,
  updatePet as storageUpdatePet,
} from "@/features/pets/services/petsStorage";
import { useConfirm, usePrompt } from "@/components/ui/ConfirmProvider";

/* --------------------------- EXEMPLOS (ex-1..3) --------------------------- */
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
    description:
      "Companheiro fiel, ama passeios e água. Super sociável com outros cães.",
    avatar:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600&q=80&auto=format&fit=crop",
    cover:
      "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=1200&q=80&auto=format&fit=crop",
    media: [
      {
        id: "m1",
        url: "https://images.unsplash.com/photo-1619983081563-430f63602796?w=1200&q=80&auto=format&fit=crop",
        title: "Passeio no parque",
        kind: "image",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
      },
      {
        id: "m2",
        url: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=80&auto=format&fit=crop",
        title: "Banho de sol",
        kind: "image",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
      },
      {
        id: "m3",
        url: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=1200&q=80&auto=format&fit=crop",
        title: "Esperando petisco",
        kind: "image",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
      },
      {
        id: "m4",
        url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=1200&q=80&auto=format&fit=crop",
        title: "Carinha de pidão",
        kind: "image",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 45,
      },
    ],
    vaccines: [],
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
    description: "Energética e muito esperta.",
    avatar:
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&q=80&auto=format&fit=crop",
    cover:
      "https://images.unsplash.com/photo-1525253086316-d0c936c814f8?w=1200&q=80&auto=format&fit=crop",
    media: [],
    vaccines: [],
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
    description: "Sonequenta e dona do sofá.",
    avatar:
      "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600&q=80&auto=format&fit=crop",
    cover:
      "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=1200&q=80&auto=format&fit=crop",
    media: [],
    vaccines: [],
  },
];
const exampleById = (id) => EXAMPLES.find((p) => p.id === id) || null;

/* ------------------------------ COMPONENTE -------------------------------- */
export default function PetDetail() {
  const { id } = useParams();
  const toast = useToast();
  const confirm = useConfirm();
  const askInput = usePrompt();

  const isExample = id?.startsWith("ex-");
  const [pet, setPet] = useState(null);

  const [tab, setTab] = useState("health"); // 'health' | 'gallery'
  const [vaccinesOpen, setVaccinesOpen] = useState(true);

  // Lightbox
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);

  // Carregar pet
  useEffect(() => {
    if (isExample) setPet(exampleById(id));
    else {
      const data = storageGetPet?.(id);
      if (!data) return setPet(null);
      data.media = Array.isArray(data.media) ? data.media : [];
      setPet({ ...data });
    }
  }, [id, isExample]);

  // Persistência (real salva em storage, exemplo fica só em memória)
  const persist = (patch) => {
    if (!pet) return;
    const next = { ...pet, ...patch };
    setPet(next);
    if (!isExample) storageUpdatePet?.(next.id, patch);
  };

  /* --------------------------- GALERIA / LIGHTBOX -------------------------- */
  const imagesOnly = useMemo(
    () =>
      (pet?.media || [])
        .filter((m) => (m.kind || "image") === "image")
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [pet]
  );
  const lbImages = useMemo(() => imagesOnly.map((m) => m.url), [imagesOnly]);

  const openLightbox = (idx) => {
    setLbIndex(idx);
    setLbOpen(true);
  };

  const handleAddMedia = (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens por enquanto.");
      ev.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const item = {
        id: crypto?.randomUUID?.() || String(Date.now()),
        url: reader.result,
        title: file.name.replace(/\.[^.]+$/, ""),
        kind: "image",
        createdAt: Date.now(),
      };
      persist({ media: [...(pet?.media || []), item] });
      toast.success("Imagem adicionada!");
      ev.target.value = "";
    };
    reader.onerror = () => toast.error("Falha ao ler a imagem.");
    reader.readAsDataURL(file);
  };

  const handleSetCover = async (item) => {
    if (!item || pet?.avatar === item.url) return;
    const ok = await confirm({
      title: "Definir como capa?",
      description: "Esta imagem será usada como foto de capa do pet.",
      confirmText: "Definir capa",
    });
    if (!ok) return;
    persist({ avatar: item.url });
    toast.success("Imagem definida como capa.");
  };

  const handleEditTitle = async (item) => {
    if (!item) return;

    const newTitle = await askInput({
      title: "Editar título",
      description: "Dê um nome curto para esta foto.",
      label: "Título da foto",
      initialValue: item.title || "",
      placeholder: "Ex.: Max no parque",
      confirmText: "Salvar",
      cancelText: "Cancelar",
      validate: (v) => String(v).trim().length <= 80,
      validateError: "Use no máximo 80 caracteres.",
    });

    if (newTitle == null) return; // cancelado

    const next = (pet?.media || []).map((m) =>
      m.id === item.id ? { ...m, title: String(newTitle).trim() } : m
    );
    persist({ media: next });
    toast.success("Título atualizado.");
  };

  const handleDelete = async (item) => {
    if (!item) return;
    const ok = await confirm({
      title: "Remover imagem?",
      description: "Esta ação não pode ser desfeita.",
      confirmText: "Remover",
      tone: "danger",
    });
    if (!ok) return;

    const next = (pet?.media || []).filter((m) => m.id !== item.id);
    const patch = { media: next };
    if (pet?.avatar === item.url) patch.avatar = "";
    persist(patch);
    toast.success("Imagem removida.");

    // se o lightbox estiver aberto nessa imagem, ajusta o índice/fecha
    if (lbOpen) {
      const idx = imagesOnly.findIndex((m) => m.id === item.id);
      if (idx === lbIndex) {
        if (next.filter((m) => (m.kind || "image") === "image").length === 0) {
          setLbOpen(false);
        } else {
          setLbIndex((i) => Math.max(0, i - 1));
        }
      }
    }
  };

  const slides = imagesOnly.map((m) => ({
    id: m.id,
    url: m.url,
    title: m.title || "",
    alt: m.title || "",
    description: m.title || "",
  }));

  if (!pet) {
    return <div className="p-6 text-sm opacity-70">Pet não encontrado.</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* GRID: esquerda / divisor (>=xl) / direita */}
      <div className="grid grid-cols-12 gap-6">
        {/* ESQUERDA */}
        <section className="col-span-12 xl:col-span-5 rounded-2xl bg-[var(--content-bg)] text-[var(--content-fg)] shadow-sm ring-1 ring-black/5 dark:ring-white/5 p-5">
          {/* Header do pet */}
          <div className="flex items-start gap-4">
            <img
              src={pet.avatar || pet.cover}
              alt={pet.name}
              className="h-16 w-16 md:h-20 md:w-20 rounded-full object-cover ring-4 ring-black/10 dark:ring-white/10"
            />
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-semibold">{pet.name}</h1>
              <p className="text-xs md:text-sm opacity-70 capitalize">
                {pet.species} • {pet.breed}
              </p>
            </div>
          </div>

          {/* Sobre */}
          <div className="mt-5">
            <h3 className="text-sm font-medium opacity-80">
              Aparência e sinais distintos
            </h3>
            <p className="mt-2 text-sm leading-relaxed opacity-90">
              {pet.description || "—"}
            </p>
          </div>

          {/* Cards rápidos */}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <InfoCard label="Tamanho" value={pet.size} />
            <InfoCard label="Peso" value={`${pet.weight} kg`} />
            <InfoCard label="Sexo" value={pet.gender} />
          </div>

          {/* Datas */}
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-medium opacity-80">
              Datas importantes
            </h3>
            <div className="grid gap-3">
              <InfoRow
                label="Nascimento"
                value={formatDate(pet.birthday)}
                right={ageDiff(pet.birthday)}
              />
              <InfoRow
                label="Adoção"
                value={pet.adoption ? formatDate(pet.adoption) : "—"}
              />
            </div>
          </div>
        </section>

        {/* DIVISOR (xl+) */}
        {/* <div className="hidden xl:block xl:col-span-0 relative">
          <div className="absolute inset-y-0 -left-3 w-px bg-black/10 dark:bg-white/10" />
        </div> */}

        {/* DIREITA */}
        <section className="relative col-span-12 xl:col-span-7 rounded-2xl bg-[var(--content-bg)] text-[var(--content-fg)] shadow-sm ring-1 ring-black/5 dark:ring-white/5">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -left-3 top-0 hidden h-full w-px bg-black/10 dark:bg-white/10 xl:block"
          />
          {/* Pills (sem botão de upload aqui para não quebrar no mobile) */}
          <div className="flex items-center gap-2 p-4">
            <Tab
              active={tab === "health"}
              onClick={() => setTab("health")}
              icon={<Shield className="h-4 w-4 -translate-y-[1px]" />}
            >
              Carteira de Saúde
            </Tab>
            <Tab
              active={tab === "gallery"}
              onClick={() => setTab("gallery")}
              icon={<Images className="h-4 w-4 -translate-y-[1px]" />}
            >
              Galeria
            </Tab>
          </div>

          {/* Conteúdo */}
          <div className="px-4 pb-5">
            {tab === "health" ? (
              <div className="space-y-3">
                {/* VACINAS (accordion com transição suave) */}
                <Accordion
                  open={vaccinesOpen}
                  onToggle={() => setVaccinesOpen((v) => !v)}
                  leftIcon={<Syringe className="h-4 w-4 opacity-70" />}
                  title="Vacinas"
                  rightActions={
                    <span className="text-xs opacity-60">0 registro(s)</span>
                  }
                >
                  <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm opacity-70">
                    Nenhuma vacina registrada para este pet.
                  </div>
                </Accordion>

                {/* outros cards “placeholder” com ícones – já no mesmo estilo */}
                <StaticItem
                  icon={<Pill className="h-4 w-4 opacity-70" />}
                  title="Tratamentos antiparasitários"
                />
                <StaticItem
                  icon={<Stethoscope className="h-4 w-4 opacity-70" />}
                  title="Intervenções médicas"
                />
                <StaticItem
                  icon={<Bandage className="h-4 w-4 opacity-70" />}
                  title="Outros tratamentos"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl ring-1 ring-black/5 dark:ring-white/5 p-3">
                  {/* toolbar interna do card da galeria */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-medium opacity-80 flex items-center gap-2">
                      <Images className="h-4 w-4" />
                      Mídias do pet
                    </div>
                    <label className="inline-flex items-center gap-2 rounded-md bg-[#f77904] px-3 py-1.5 text-white text-sm cursor-pointer hover:opacity-90">
                      <Plus className="h-4 w-4" />
                      Adicionar mídia
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAddMedia}
                      />
                    </label>
                  </div>

                  {imagesOnly.length === 0 ? (
                    <div className="rounded-lg border border-black/10 dark:border-white/10 p-6 text-sm opacity-70">
                      Nenhuma mídia ainda. Use “Adicionar mídia”.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {imagesOnly.map((m, idx) => (
                        <button
                          key={m.id}
                          onClick={() => openLightbox(idx)}
                          className="group relative overflow-hidden rounded-lg"
                          title={m.title}
                        >
                          <img
                            src={m.url}
                            alt={m.title || ""}
                            className="aspect-[4/3] w-full object-cover"
                          />

                          {/* badge de capa */}
                          {pet.avatar === m.url && (
                            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                              <Star className="h-3 w-3 fill-white" /> capa
                            </span>
                          )}

                          {/* barra de ações – sempre visível em telas pequenas; no desktop aparece no hover */}
                          <div
                            className="
          absolute inset-x-0 bottom-0 flex items-center justify-between gap-2
          bg-gradient-to-t from-black/60 to-black/0 p-2
          text-white transition-opacity
          opacity-100 md:opacity-0 md:group-hover:opacity-100
        "
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="max-w-[60%] truncate text-xs">
                              {m.title || "Sem título"}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                title="Definir como capa"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/50 hover:bg-black/60"
                                onClick={() => handleSetCover(m)}
                              >
                                <Star
                                  className={`h-4 w-4 ${
                                    pet.avatar === m.url ? "fill-white" : ""
                                  }`}
                                />
                              </button>
                              <button
                                title="Editar título"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/50 hover:bg-black/60"
                                onClick={() => handleEditTitle(m)}
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                title="Remover"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/50 hover:bg-black/60"
                                onClick={() => handleDelete(m)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* LIGHTBOX + ações */}
      {lbOpen && (
        <>
          <Lightbox
            open={lbOpen}
            images={lbImages}
            index={lbIndex}
            slides={slides}
            onClose={() => setLbOpen(false)}
            onPrev={() =>
              setLbIndex((i) => (i - 1 + lbImages.length) % lbImages.length)
            }
            onNext={() => setLbIndex((i) => (i + 1) % lbImages.length)}
          />
        </>
      )}
    </div>
  );
}

/* ------------------------------ SUBCOMPONENTES ----------------------------- */

function Tab({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition-all ${
        active
          ? "bg-[#f77904] text-white shadow-sm"
          : "bg-[var(--chip-bg)] text-[var(--chip-fg)] hover:opacity-90"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl bg-[var(--chip-bg)] p-3 ring-1 ring-black/5 dark:ring-white/5">
      <div className="text-xs opacity-70">{label}</div>
      <div className="mt-1 font-medium capitalize">{value || "—"}</div>
    </div>
  );
}

function InfoRow({ label, value, right }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[var(--chip-bg)] px-3 py-2 ring-1 ring-black/5 dark:ring-white/5">
      <div className="text-xs opacity-70">{label}</div>
      <div className="flex items-center gap-2">
        <div className="font-medium">{value || "—"}</div>
        {right && <span className="text-xs opacity-70">{right}</span>}
      </div>
    </div>
  );
}

/** Item estático “card” com ícone, para manter o layout da carteira */
function StaticItem({ icon, title }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[var(--chip-bg)] px-4 py-3 ring-1 ring-black/5 dark:ring-white/5">
      <span className="inline-flex items-center gap-2">
        {icon}
        {title}
      </span>
      <span className="text-lg opacity-50">+</span>
    </div>
  );
}

/* --------- Accordion com transição suave (altura animada) --------- */
function Accordion({
  title,
  open,
  onToggle,
  leftIcon,
  rightActions,
  children,
}) {
  const ref = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      // abre suavemente: mede e anima até a altura do conteúdo
      const h = el.scrollHeight;
      setHeight(h);
      const id = setTimeout(() => setHeight("auto"), 300);
      return () => clearTimeout(id);
    } else {
      if (height === "auto") {
        // se estava aberto, volta para a altura atual antes de colapsar
        setHeight(ref.current.scrollHeight);
        requestAnimationFrame(() => setHeight(0));
      } else {
        setHeight(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="rounded-xl ring-1 ring-black/5 dark:ring-white/5">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-xl bg-[var(--chip-bg)] px-4 py-3 text-left text-sm font-medium"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2">
          {leftIcon}
          {title}
        </span>
        <div className="flex items-center gap-3">
          {rightActions}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      <div
        style={{
          overflow: "hidden",
          transition: "max-height 300ms ease",
          maxHeight: height === "auto" ? "9999px" : `${height}px`,
        }}
      >
        <div ref={ref} className="px-4 py-3">
          {children}
        </div>
      </div>
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
function ageDiff(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const y = now.getFullYear() - d.getFullYear();
  let m = now.getMonth() - d.getMonth();
  if (m < 0) m += 12;
  return `${y}a ${m}m`;
}
