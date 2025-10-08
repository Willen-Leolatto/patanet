// src/features/pets/pages/PetDetail.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
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
  Check,
  CalendarDays,
  MapPin,
  NotebookText,
  X,
} from "lucide-react";
import Lightbox from "@/components/Lightbox";
import { useToast } from "@/components/ui/ToastProvider";
import {
  getPet as storageGetPet,
  updatePet as storageUpdatePet,
  mediaSaveBlob,
  mediaGetUrl,
  mediaDelete,
  addVaccine as addPetVaccine,
  updateVaccine as updatePetVaccine,
  removeVaccine as removePetVaccine,
} from "@/features/pets/services/petsStorage";
import { useConfirm, usePrompt } from "@/components/ui/ConfirmProvider";
import { useAuth } from "@/store/auth";

/* -------------------------------------------------------------
 *  Config local (futuro: puxar de user settings)
 * ------------------------------------------------------------- */
const DUE_SOON_DAYS = 7;

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
    media: [],
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

/* --------------------------------- helpers -------------------------------- */
const readAsDataURL = (file) =>
  new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });

async function fileToCompressedBlob(file, maxSide = 960, quality = 0.6) {
  const dataUrl = await readAsDataURL(file);
  const img = new Image();
  await new Promise((r, e) => {
    img.onload = r;
    img.onerror = e;
    img.src = dataUrl;
  });

  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);

  // 1ª tentativa: WebP
  let blob = await new Promise((res) =>
    canvas.toBlob((b) => res(b), "image/webp", quality)
  );
  if (!blob) {
    blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b), "image/jpeg", quality)
    );
  }

  // Se ainda ficou grande, recompacta
  if (blob && blob.size > 500 * 1024) {
    const canvas2 = document.createElement("canvas");
    const factor = 0.85;
    canvas2.width = Math.round(w * factor);
    canvas2.height = Math.round(h * factor);
    const ctx2 = canvas2.getContext("2d");
    ctx2.drawImage(canvas, 0, 0, canvas2.width, canvas2.height);
    blob = await new Promise((res) =>
      canvas2.toBlob((b) => res(b), "image/webp", Math.max(0.45, quality - 0.1))
    );
  }
  return blob;
}

/* ----------------------- datas p/ vacinas (utils leves) ------------------- */
function parseISODateLocal(s) {
  if (!s) return null;
  const [y, m, d] = String(s).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
function formatPt(dateStr) {
  const d = parseISODateLocal(dateStr);
  return d ? d.toLocaleDateString("pt-BR") : "—";
}
function daysUntil(dateStr) {
  const d = parseISODateLocal(dateStr);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.floor((d - today) / 86400000);
}

/* -------------------------------- COMPONENTE ------------------------------- */
export default function PetDetail() {
  const { id } = useParams();
  const toast = useToast();
  const confirm = useConfirm();
  const askInput = usePrompt();

  const authUser = useAuth((s) => s.user);
  const isAuthenticated = !!authUser?.id;

  const isExample = id?.startsWith("ex-");
  const [pet, setPet] = useState(null);

  const [tab, setTab] = useState("health"); // 'health' | 'gallery'
  const [vaccinesOpen, setVaccinesOpen] = useState(true);

  // Lightbox
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);

  // URL cache para mídias do IndexedDB
  const [mediaUrls, setMediaUrls] = useState({}); // { [mediaId]: objectURL|string }
  // URLs resolvidas para avatar/capa (avatarId/coverId)
  const [avatarUrl, setAvatarUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  // Modal de Vacina (create/edit)
  const [vacModalOpen, setVacModalOpen] = useState(false);
  const [vacEditId, setVacEditId] = useState(null);
  const [vacForm, setVacForm] = useState({
    name: "",
    date: "",
    nextDoseDate: "",
    clinic: "",
    notes: "",
  });

  // Função para carregar do storage
  const loadFromStorage = () => {
    if (isExample) {
      setPet(exampleById(id));
      setMediaUrls({});
      return;
    }
    const data = storageGetPet?.(id);
    if (!data) {
      setPet(null);
      setMediaUrls({});
      return;
    }
    const media = Array.isArray(data.media)
      ? data.media
      : Array.isArray(data.gallery)
      ? data.gallery.map((g) =>
          typeof g === "string"
            ? {
                id:
                  crypto?.randomUUID?.() || String(Date.now() + Math.random()),
                url: g,
                title: "",
                kind: "image",
                createdAt: Date.now(),
              }
            : {
                id:
                  g.id ||
                  crypto?.randomUUID?.() ||
                  String(Date.now() + Math.random()),
                url: g.url,
                title: g.title || "",
                kind: g.kind || "image",
                createdAt: g.createdAt || Date.now(),
              }
        )
      : [];
    setPet({ ...data, media });
  };

  // Carregar pet (1ª vez)
  useEffect(() => {
    loadFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isExample]);

  // Reagir a alterações no storage (ex.: ao editar o pet)
  useEffect(() => {
    const onUpdated = () => loadFromStorage();
    window.addEventListener("patanet:pets-updated", onUpdated);
    return () => window.removeEventListener("patanet:pets-updated", onUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Resolver URLs de avatar/capa por IDB (avatarId/coverId)
  useEffect(() => {
    let cancelled = false;
    async function resolveHeaderImages() {
      if (!pet) {
        setAvatarUrl("");
        setCoverUrl("");
        return;
      }
      try {
        let aUrl = pet.avatar || "";
        if (!aUrl && pet.avatarId) {
          try {
            aUrl = await mediaGetUrl?.(pet.avatarId);
          } catch {
            aUrl = "";
          }
        }
        let cUrl = pet.cover || "";
        if (!cUrl && pet.coverId) {
          try {
            cUrl = await mediaGetUrl?.(pet.coverId);
          } catch {
            cUrl = "";
          }
        }
        if (!cancelled) {
          setAvatarUrl(aUrl || "");
          setCoverUrl(cUrl || "");
        }
      } catch {
        if (!cancelled) {
          setAvatarUrl(pet.avatar || "");
          setCoverUrl(pet.cover || "");
        }
      }
    }
    resolveHeaderImages();
    return () => {
      cancelled = true;
      [avatarUrl, coverUrl].forEach((u) => {
        if (u && u.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(u);
          } catch {}
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pet?.id, pet?.avatar, pet?.avatarId, pet?.cover, pet?.coverId]);

  // Resolver URLs das mídias (galeria) que estão no IndexedDB
  useEffect(() => {
    let cancelled = false;
    async function resolveUrls() {
      const entries = (pet?.media || []).filter((m) => m?.storage === "idb");
      if (!entries.length) {
        setMediaUrls({});
        return;
      }
      const pairs = await Promise.all(
        entries.map(async (m) => {
          try {
            const url = await mediaGetUrl?.(m.id);
            return [m.id, url];
          } catch {
            return [m.id, ""];
          }
        })
      );
      if (!cancelled) {
        const map = {};
        for (const [k, v] of pairs) map[k] = v;
        setMediaUrls(map);
      }
    }
    resolveUrls();
    return () => {
      cancelled = true;
      Object.values(mediaUrls || {}).forEach((u) => {
        if (typeof u === "string" && u.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(u);
          } catch {}
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pet?.id, (pet?.media || []).length]);

  // Persistência (salva no storage se não for exemplo)
  const persist = (patch) => {
    if (!pet) return;
    const next = { ...pet, ...patch };
    setPet(next);
    if (!isExample) storageUpdatePet?.(next.id, patch);
  };

  // Tutor do pet
  const ownerId = pet?.ownerId || pet?.userId || pet?.createdBy || null;
  const canEdit =
    !isExample && isAuthenticated && ownerId && authUser.id === ownerId;

  /* --------------------------- GALERIA / LIGHTBOX -------------------------- */
  const imagesOnly = useMemo(
    () =>
      (pet?.media || [])
        .filter((m) => (m.kind || "image") === "image")
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [pet]
  );

  // resolve URL para render (DataURL/https direto OU IndexedDB via mediaUrls)
  const resolveSrc = (m) =>
    m?.storage === "idb" ? mediaUrls[m.id] || "" : m?.url || "";

  const lbSlides = useMemo(
    () =>
      imagesOnly.map((m) => ({
        id: m.id,
        url: resolveSrc(m),
        title: m.title || "",
        alt: m.title || "",
        description: m.title || "",
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [imagesOnly, mediaUrls]
  );

  const openLightbox = (idx) => {
    setLbIndex(idx);
    setLbOpen(true);
  };

  const guard = () => {
    if (!canEdit) {
      toast.error("Apenas o tutor do pet pode realizar esta ação.");
      return false;
    }
    return true;
  };

  // Adicionar imagens
  const handleAddMedia = async (ev) => {
    if (!guard()) return;
    const files = Array.from(ev.target.files || []);
    ev.target.value = "";
    if (!files.length) return;

    try {
      const items = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        const blob = await fileToCompressedBlob(file);
        if (!blob) continue;

        const mediaId = await mediaSaveBlob?.(blob);
        if (!mediaId) continue;

        items.push({
          id: mediaId,
          title: file.name.replace(/\.[^.]+$/, ""),
          kind: "image",
          createdAt: Date.now(),
          storage: "idb",
        });
      }

      if (!items.length) {
        toast.error("Apenas imagens são aceitas.");
        return;
      }

      persist({ media: [...(pet?.media || []), ...items] });
      toast.success(items.length > 1 ? "Imagens adicionadas!" : "Imagem adicionada!");
    } catch (err) {
      console.error(err);
      toast.error(
        "Não foi possível salvar as imagens (armazenamento local cheio). Tente menos imagens ou menores."
      );
    }
  };

  // Definir capa da galeria
  const handleSetCover = async (item) => {
    if (!guard() || !item) return;

    const ok = await confirm({
      title: "Definir como capa da galeria?",
      description: "Esta imagem será usada como capa da galeria do pet.",
      confirmText: "Definir capa",
    });
    if (!ok) return;

    try {
      const patch =
        item.storage === "idb"
          ? { coverId: item.id, cover: "" }
          : { cover: item.url, coverId: "" };
      persist(patch);
      toast.success("Imagem definida como capa da galeria.");
    } catch (e) {
      toast.error("Não foi possível salvar a capa. Espaço insuficiente.");
    }
  };

  // Editar título
  const handleEditTitle = async (item) => {
    if (!guard() || !item) return;

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
    if (newTitle == null) return;

    try {
      const next = (pet?.media || []).map((m) =>
        m.id === item.id ? { ...m, title: String(newTitle).trim() } : m
      );
      persist({ media: next });
      toast.success("Título atualizado.");
    } catch (e) {
      toast.error("Não foi possível salvar. Espaço de armazenamento insuficiente.");
    }
  };

  // Remover imagem
  const handleDelete = async (item) => {
    if (!guard() || !item) return;
    const ok = await confirm({
      title: "Remover imagem?",
      description: "Esta ação não pode ser desfeita.",
      confirmText: "Remover",
      tone: "danger",
    });
    if (!ok) return;

    try {
      if (item.storage === "idb") {
        try {
          await mediaDelete?.(item.id);
        } catch {}
      }

      const next = (pet?.media || []).filter((m) => m.id !== item.id);
      const patch = { media: next };
      if (pet?.coverId === item.id) patch.coverId = "";
      if (pet?.cover && item.url && pet.cover === item.url) patch.cover = "";
      persist(patch);
      toast.success("Imagem removida.");

      if (lbOpen) {
        setLbIndex((i) => Math.max(0, i - 1));
        if (next.filter((m) => (m.kind || "image") === "image").length === 0) {
          setLbOpen(false);
        }
      }
    } catch {
      toast.error("Falha ao remover a imagem. Tente novamente.");
    }
  };

  const isCover = (m) =>
    (pet?.cover && m.url && pet.cover === m.url) ||
    (pet?.coverId && m.id === pet.coverId);

  if (!pet) {
    return <div className="p-6 text-sm opacity-70">Pet não encontrado.</div>;
  }

  // Header avatar: avatarId -> avatar -> coverId -> cover
  const headerAvatarSrc =
    avatarUrl || coverUrl || undefined; // evita string vazia no src

  /* --------------------------- VACINAS (UI + ações) ------------------------ */
  const vaccines = Array.isArray(pet?.vaccines) ? pet.vaccines : [];
  const vaccinesCount = vaccines.length;

  const vaccineBadge = (nextDoseDate) => {
    if (!nextDoseDate) return null;
    const d = daysUntil(nextDoseDate);
    if (d < 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium border-red-200 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          <CalendarDays className="h-3.5 w-3.5" />
          Atrasada
        </span>
      );
    }
    if (d === 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
          <CalendarDays className="h-3.5 w-3.5" />
          Hoje
        </span>
      );
    }
    if (d <= DUE_SOON_DAYS) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <CalendarDays className="h-3.5 w-3.5" />
          Próxima em {d}d
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
        <CalendarDays className="h-3.5 w-3.5" />
        Agendada
      </span>
    );
  };

  const openVacCreate = () => {
    if (!guard()) return;
    setVacEditId(null);
    setVacForm({ name: "", date: "", nextDoseDate: "", clinic: "", notes: "" });
    setVacModalOpen(true);
  };

  const openVacEdit = (vx) => {
    if (!guard()) return;
    setVacEditId(vx.id);
    setVacForm({
      name: vx.name || "",
      date: vx.date || "",
      nextDoseDate: vx.nextDoseDate || "",
      clinic: vx.clinic || "",
      notes: vx.notes || "",
    });
    setVacModalOpen(true);
  };

  const submitVaccine = async () => {
    if (!guard()) return;
    const name = String(vacForm.name || "").trim();
    const date = String(vacForm.date || "");
    if (!name || !date) {
      toast.error("Informe ao menos a vacina e a data.");
      return;
    }
    try {
      const payload = {
        name,
        date,
        nextDoseDate: vacForm.nextDoseDate || undefined,
        clinic: String(vacForm.clinic || "").trim(),
        notes: String(vacForm.notes || "").trim(),
      };

      if (!vacEditId) {
        const created = addPetVaccine(pet.id, payload);
        const next = [...(pet.vaccines || []), created];
        persist({ vaccines: next });
        toast.success("Vacina registrada.");
      } else {
        updatePetVaccine(pet.id, vacEditId, payload);
        const next = (pet.vaccines || []).map((v) =>
          v.id === vacEditId ? { ...v, ...payload } : v
        );
        persist({ vaccines: next });
        toast.success("Vacina atualizada.");
      }

      setVacModalOpen(false);
      setVacEditId(null);
    } catch {
      toast.error("Não foi possível salvar (armazenamento local cheio).");
    }
  };

  const markAsToday = async (vx) => {
    if (!guard()) return;
    const ok = await confirm({
      title: "Marcar como aplicada hoje?",
      description:
        "A data de aplicação será atualizada para hoje. A próxima dose (se houver) permanece.",
      confirmText: "Marcar",
      tone: "confirm",
    });
    if (!ok) return;
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(today.getDate()).padStart(2, "0")}`;
    updatePetVaccine(pet.id, vx.id, { date: iso });
    const next = (pet.vaccines || []).map((v) =>
      v.id === vx.id ? { ...v, date: iso } : v
    );
    persist({ vaccines: next });
    toast.success("Aplicação marcada para hoje.");
  };

  const removeVaccine = async (vx) => {
    if (!guard()) return;
    const ok = await confirm({
      title: "Excluir registro?",
      description: "Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      tone: "danger",
    });
    if (!ok) return;
    removePetVaccine(pet.id, vx.id);
    const next = (pet.vaccines || []).filter((v) => v.id !== vx.id);
    persist({ vaccines: next });
    toast.success("Registro removido.");
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* GRID: esquerda / divisor (>=xl) / direita */}
      <div className="grid grid-cols-12 gap-6">
        {/* ESQUERDA */}
        <section className="col-span-12 xl:col-span-5 rounded-2xl bg-[var(--content-bg)] text-[var(--content-fg)] shadow-sm ring-1 ring-black/5 dark:ring-white/5 p-5">
          {/* Header do pet */}
          <div className="flex items-start gap-4">
            <img
              src={headerAvatarSrc || undefined}
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
            <h3 className="mb-3 text-sm font-medium opacity-80">Datas importantes</h3>
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

        {/* DIREITA */}
        <section className="relative col-span-12 xl:col-span-7 rounded-2xl bg-[var(--content-bg)] text-[var(--content-fg)] shadow-sm ring-1 ring-black/5 dark:ring-white/5">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -left-3 top-0 hidden h-full w-px bg-black/10 dark:bg-white/10 xl:block"
          />

          {/* Pills */}
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
                {/* VACINAS */}
                <Accordion
                  open={vaccinesOpen}
                  onToggle={() => setVaccinesOpen((v) => !v)}
                  leftIcon={<Syringe className="h-4 w-4 opacity-70" />}
                  title="Vacinas"
                  rightActions={
                    <div className="flex items-center gap-2">
                      <span className="text-xs opacity-60">
                        {vaccinesCount} registro(s)
                      </span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={openVacCreate}
                          className="inline-flex items-center gap-1 rounded-full bg-[#f77904] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                          title="Adicionar vacina"
                        >
                          <Plus className="h-3.5 w-3.5" /> Adicionar
                        </button>
                      )}
                    </div>
                  }
                >
                  {vaccinesCount === 0 ? (
                    <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm opacity-70">
                      Nenhuma vacina registrada para este pet.
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {vaccines
                        .slice()
                        .sort(
                          (a, b) =>
                            (parseISODateLocal(b.date)?.getTime() || 0) -
                            (parseISODateLocal(a.date)?.getTime() || 0)
                        )
                        .map((v) => (
                          <li
                            key={v.id}
                            className="flex items-start justify-between gap-3 rounded-lg border border-black/10 p-3 text-sm dark:border-white/10"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium inline-flex items-center gap-2">
                                  <Syringe className="h-4 w-4 opacity-70" />
                                  {v.name}
                                </span>
                                {!!v.nextDoseDate && vaccineBadge(v.nextDoseDate)}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs opacity-80">
                                <span className="inline-flex items-center gap-1">
                                  <CalendarDays className="h-3.5 w-3.5" />
                                  Aplicada em: <strong>{formatPt(v.date)}</strong>
                                </span>
                                {v.nextDoseDate && (
                                  <span className="inline-flex items-center gap-1">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    Próxima dose:{" "}
                                    <strong>{formatPt(v.nextDoseDate)}</strong>
                                  </span>
                                )}
                                {v.clinic && (
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {v.clinic}
                                  </span>
                                )}
                              </div>
                              {v.notes && (
                                <div className="mt-1 text-xs opacity-80 inline-flex items-start gap-2">
                                  <NotebookText className="mt-[2px] h-3.5 w-3.5" />
                                  <span className="whitespace-pre-wrap">{v.notes}</span>
                                </div>
                              )}
                            </div>

                            {canEdit ? (
                              <div className="flex shrink-0 items-center gap-1">
                                <button
                                  title="Marcar aplicação hoje"
                                  className="inline-flex h-8 items-center gap-1 rounded-md border border-black/10 px-2 text-xs hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                                  onClick={() => markAsToday(v)}
                                >
                                  <Check className="h-3.5 w-3.5" /> Hoje
                                </button>
                                <button
                                  title="Editar"
                                  className="inline-flex h-8 items-center justify-center rounded-md border border-zinc-300 px-2 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/40"
                                  onClick={() => openVacEdit(v)}
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  title="Excluir"
                                  className="inline-flex h-8 items-center justify-center rounded-md border border-red-300 px-2 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
                                  onClick={() => removeVaccine(v)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span />
                            )}
                          </li>
                        ))}
                    </ul>
                  )}
                </Accordion>

                <StaticItem
                  icon={<Pill className="h-4 w-4 opacity-70" />}
                  title="Tratamentos antiparasitários"
                  showPlus={canEdit}
                />
                <StaticItem
                  icon={<Stethoscope className="h-4 w-4 opacity-70" />}
                  title="Intervenções médicas"
                  showPlus={canEdit}
                />
                <StaticItem
                  icon={<Bandage className="h-4 w-4 opacity-70" />}
                  title="Outros tratamentos"
                  showPlus={canEdit}
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

                    {canEdit && (
                      <label className="inline-flex items-center gap-2 rounded-md bg-[#f77904] px-3 py-1.5 text-white text-sm cursor-pointer hover:opacity-90">
                        <Plus className="h-4 w-4" />
                        Adicionar mídia
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleAddMedia}
                        />
                      </label>
                    )}
                  </div>

                  {imagesOnly.length === 0 ? (
                    <div className="rounded-lg border border-black/10 dark:border-white/10 p-6 text-sm opacity-70">
                      Nenhuma mídia ainda. {canEdit ? "Use “Adicionar mídia”." : "—"}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {imagesOnly.map((m, idx) => {
                        const src = resolveSrc(m);
                        return (
                          <div
                            key={m.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => openLightbox(idx)}
                            onKeyDown={(e) =>
                              (e.key === "Enter" || e.key === " ") && openLightbox(idx)
                            }
                            className="group relative overflow-hidden rounded-lg cursor-pointer"
                            title={m.title}
                          >
                            <img
                              src={src || undefined}
                              alt={m.title || ""}
                              className="aspect-[4/3] w-full object-cover"
                            />

                            {/* badge de capa da GALERIA */}
                            {isCover(m) && (
                              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                                <Star className="h-3 w-3 fill-white" /> capa
                              </span>
                            )}

                            {/* barra de ações (só para o tutor) */}
                            {canEdit && (
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
                                    title="Definir como capa da galeria"
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/50 hover:bg-black/60"
                                    onClick={() => handleSetCover(m)}
                                  >
                                    <Star
                                      className={`h-4 w-4 ${isCover(m) ? "fill-white" : ""}`}
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
                            )}
                          </div>
                        );
                      })}
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
        <Lightbox
          open={lbOpen}
          images={lbSlides.map((s) => s.url)}
          index={lbIndex}
          slides={lbSlides}
          onClose={() => setLbOpen(false)}
          onPrev={() => setLbIndex((i) => (i - 1 + lbSlides.length) % lbSlides.length)}
          onNext={() => setLbIndex((i) => (i + 1) % lbSlides.length)}
        />
      )}

      {/* MODAL: Create/Edit Vacina */}
      {vacModalOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Syringe className="h-5 w-5" />
                <h3 className="text-lg font-semibold">
                  {vacEditId ? "Editar vacina" : "Registrar vacina"}
                </h3>
              </div>
              <button
                className="rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => {
                  setVacModalOpen(false);
                  setVacEditId(null);
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 inline-flex items-center gap-2 text-sm font-medium">
                  <Syringe className="h-4 w-4" />
                  Vacina *
                </label>
                <input
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
                  value={vacForm.name}
                  onChange={(e) =>
                    setVacForm((s) => ({ ...s, name: e.target.value }))
                  }
                  placeholder="Ex.: V8, Antirrábica"
                />
              </div>
              <div>
                <label className="mb-1 inline-flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="h-4 w-4" />
                  Aplicada em *
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
                  value={vacForm.date}
                  onChange={(e) =>
                    setVacForm((s) => ({ ...s, date: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 inline-flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="h-4 w-4" />
                  Próxima dose
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
                  value={vacForm.nextDoseDate}
                  onChange={(e) =>
                    setVacForm((s) => ({ ...s, nextDoseDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 inline-flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4" />
                  Clínica
                </label>
                <input
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
                  value={vacForm.clinic}
                  onChange={(e) =>
                    setVacForm((s) => ({ ...s, clinic: e.target.value }))
                  }
                  placeholder="Opcional"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 inline-flex items-center gap-2 text-sm font-medium">
                  <NotebookText className="h-4 w-4" />
                  Observações
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
                  value={vacForm.notes}
                  onChange={(e) =>
                    setVacForm((s) => ({ ...s, notes: e.target.value }))
                  }
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
                onClick={() => {
                  setVacModalOpen(false);
                  setVacEditId(null);
                }}
              >
                Cancelar
              </button>
              <button
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
                onClick={submitVaccine}
              >
                {vacEditId ? "Salvar alterações" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
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

/** Card estático com ícone; o “+” só aparece se showPlus=true */
function StaticItem({ icon, title, showPlus = false }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[var(--chip-bg)] px-4 py-3 ring-1 ring-black/5 dark:ring-white/5">
      <span className="inline-flex items-center gap-2">
        {icon}
        {title}
      </span>
      {showPlus ? <span className="text-lg opacity-50">+</span> : <span />}
    </div>
  );
}

/* --------- Accordion com header clicável e ações separadas (sem nested buttons) --------- */
function Accordion({ title, open, onToggle, leftIcon, rightActions, children }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      const h = el.scrollHeight;
      setHeight(h);
      const id = setTimeout(() => setHeight("auto"), 300);
      return () => clearTimeout(id);
    } else {
      if (height === "auto") {
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
      {/* Cabeçalho: botão de toggle à esquerda, ações à direita */}
      <div className="flex w-full items-center justify-between rounded-xl bg-[var(--chip-bg)] px-4 py-3 text-sm font-medium">
        <button
          onClick={onToggle}
          className="inline-flex items-center gap-2 text-left"
          aria-expanded={open}
          type="button"
        >
          {leftIcon}
          {title}
          <ChevronDown
            className={`ml-2 h-4 w-4 transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* rightActions fora do botão para evitar nested buttons */}
        <div className="flex items-center gap-3">{rightActions}</div>
      </div>

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
