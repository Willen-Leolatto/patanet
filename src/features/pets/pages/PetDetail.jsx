// src/features/pets/pages/PetDetail.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Shield,
  Images,
  Syringe,
  // Pill,
  // Stethoscope,
  // Bandage,
  Plus,
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
import { useConfirm, usePrompt } from "@/components/ui/ConfirmProvider";

// APIs
import { getMyProfile } from "@/api/user.api.js";
import { fetchAnimalsById } from "@/api/animal.api.js";
import {
  fetchAnimalMedias,
  uploadAnimalMedias,
  deleteAnimalMedias,
} from "@/api/animal-media.api.js";
import {
  addVaccine,
  fetchVaccines,
  deleteVaccines,
  updateVaccine,
} from "@/api/vaccines.api.js";

/* ------------------------------------------------------------- */
const DUE_SOON_DAYS = 7;

/* --------------------------------- helpers -------------------------------- */
const readAsDataURL = (file) =>
  new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });

async function fileToCompressedBlob(file, maxSide = 960, quality = 0.6) {
  if (!(file instanceof File)) return null;
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

  let blob = await new Promise((res) =>
    canvas.toBlob((b) => res(b), "image/webp", quality)
  );
  if (!blob) {
    blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b), "image/jpeg", quality)
    );
  }
  if (blob && blob.size > 700 * 1024) {
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
  const str = String(s).trim();
  // Aceita "YYYY-MM-DD" e "YYYY-MM-DDTHH:mm:ss(.sss)Z"
  const datePart = str.includes("T") ? str.split("T")[0] : str;
  const [yStr, mStr, dStr] = datePart.split("-");
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);
  if (!y || !m || !d) return null;
  // Cria Date no fuso local, sem depender do horário/UTC
  return new Date(y, m - 1, d);
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

/* ------------------------------ sub-helpers UI ---------------------------- */
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

/* --------- Accordion com header clicável e ações separadas --------- */
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

/* -------------------------- mapeamentos PT-BR ----------------------------- */
function toPtSize(s) {
  const v = String(s || "").toUpperCase();
  if (v === "SMALL") return "pequeno";
  if (v === "MEDIUM") return "médio";
  if (v === "LARGE") return "grande";
  return (s || "").toString().toLowerCase();
}
function toPtGender(g) {
  const v = String(g || "").toUpperCase();
  if (v === "MALE") return "Macho";
  if (v === "FEMALE") return "Fêmea";
  return "não informado";
}
function toPtSpecies(sp) {
  const v = String(sp || "").toLowerCase();
  if (["dog", "canine", "cão", "cao", "cachorro"].includes(v)) return "cão";
  if (["cat", "feline", "gato", "felino"].includes(v)) return "gato";
  return sp || "—";
}

/* -------------------------------- COMPONENTE ------------------------------ */
export default function PetDetail() {
  const { id: animalId } = useParams();
  const toast = useToast();
  const confirm = useConfirm();
  const askInput = usePrompt();

  const [me, setMe] = useState(null);
  const [pet, setPet] = useState(null);

  const [tab, setTab] = useState("health"); // 'health' | 'gallery'
  const [vaccinesOpen, setVaccinesOpen] = useState(true);

  // Lightbox
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);

  // Galeria (do servidor)
  const [gallery, setGallery] = useState([]); // [{id,url,title,createdAt}]
  const [loadingGallery, setLoadingGallery] = useState(false);

  // Vacinas (do servidor)
  const [vaccines, setVaccines] = useState([]);
  const [loadingVaccines, setLoadingVaccines] = useState(false);

  // Header (avatar/capa)
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

  /* -------------------------- carregamentos iniciais ----------------------- */
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const u = await getMyProfile();
        if (!cancel) setMe(u || null);
      } catch {
        if (!cancel) setMe(null);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const full = await fetchAnimalsById({ animalId });
        const a = full?.data || full || {};

        // <- NOVO: coleta segura dos owners conforme a estrutura nova
        const ownersFromArray = Array.isArray(a?.owners)
          ? a.owners.map((o) => o?.id).filter(Boolean)
          : [];

        const primaryOwnerId =
          a?.ownerId || // se existir
          ownersFromArray[0] || // ou primeiro da lista
          a?.user?.id || // fallback antigos
          a?.owner?.id ||
          a?.userId ||
          null;

        if (cancel) return;
        const specieName =
          a?.breed?.specie?.name ||
          a?.specie?.name ||
          a?.species ||
          a?.specie ||
          "";
        setPet({
          id: a.id,
          name: a.name,
          species: toPtSpecies(specieName), // ← espécie correta (PT-BR)
          breed: a?.breed?.name || a.breed || "—", // ← nome da raça
          gender: toPtGender(a.gender), // ← “Macho/Fêmea”
          weight: a.weight,
          size: toPtSize(a.size),
          description: a.about || a.description,
          birthday: a.birthday || a.birthDate || a.birthdate,
          adoption: a.adoption || a.adoptionDate,
          // avatar com fallback na imagem da raça
          image: a?.image?.url || a.image || a?.breed?.image || "",
          imageCover: a?.imageCover?.url || a.imageCover || "",
          ownerId: primaryOwnerId,
          ownerIds: ownersFromArray,
        });
        // Header usa o mesmo fallback para não ficar sem foto
        setAvatarUrl(a?.image?.url || a.image || a?.breed?.image || "");
        PetDetail;

        setAvatarUrl(a?.image?.url || a.image || "");
        setCoverUrl(a?.imageCover?.url || a.imageCover || "");
      } catch {
        setPet(null);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [animalId]);

  // LÓGICA de tutor: compara o me.id com ownerId e/ou owners[]
  const canEdit = useMemo(() => {
    const myId = me?.id ? String(me.id) : null;
    const primary = pet?.ownerId ? String(pet.ownerId) : null;
    const many = Array.isArray(pet?.ownerIds) ? pet.ownerIds.map(String) : [];
    if (!myId) return false;
    return myId === primary || many.includes(myId);
  }, [me?.id, pet?.ownerId, pet?.ownerIds]);

  /* -------------------------- galeria: listar/upload/delete ---------------- */
  const refetchGallery = useRef(null);

  useEffect(() => {
    let cancel = false;

    async function loadGallery() {
      if (!animalId) return;
      setLoadingGallery(true);
      try {
        const resp = await fetchAnimalMedias({
          animalId,
          page: 1,
          perPage: 200,
        });
        const arr =
          (resp && Array.isArray(resp.data) && resp.data) ||
          (Array.isArray(resp) && resp) ||
          (resp && Array.isArray(resp.items) && resp.items) ||
          [];
        if (!cancel) {
          setGallery(
            arr
              .map((m) => ({
                id: m.id || m.mediaId || m._id,
                url: m.url || m.path || m.src || "",
                title: m.title || m.name || "",
                createdAt:
                  (m.createdAt && new Date(m.createdAt).getTime()) ||
                  Date.now(),
              }))
              .filter((m) => !!m.id && !!m.url)
              .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
          );
        }
      } catch {
        if (!cancel) setGallery([]);
      } finally {
        if (!cancel) setLoadingGallery(false);
      }
    }

    refetchGallery.current = loadGallery;
    loadGallery();

    return () => {
      cancel = true;
    };
  }, [animalId]);

  async function handleAddMedia(ev) {
    if (!canEdit) {
      toast.error("Apenas o tutor do pet pode realizar esta ação.");
      return;
    }
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    try {
      if (!file.type.startsWith("image/")) return;
      const blob = await fileToCompressedBlob(file);
      if (!blob) return;
      const finalFile = new File(
        [blob],
        file.name.replace(/\.[^.]+$/, "") + ".webp",
        { type: blob.type || "image/webp" }
      );
      await uploadAnimalMedias({ animalId, media: finalFile });
      await refetchGallery.current?.();
      toast.success("Imagem adicionada!");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao enviar a imagem. Tente novamente.");
    }
  }

  async function handleDeleteMedia(item) {
    if (!canEdit) {
      toast.error("Apenas o tutor do pet pode realizar esta ação.");
      return;
    }
    const ok = await confirm({
      title: "Remover imagem?",
      description: "Esta ação não pode ser desfeita.",
      confirmText: "Remover",
      tone: "danger",
    });
    if (!ok) return;

    try {
      await deleteAnimalMedias({ animalId, mediaId: item.id });
      setGallery((g) => g.filter((m) => m.id !== item.id));
      toast.success("Imagem removida.");
      if (lbOpen) {
        setLbIndex((i) => Math.max(0, i - 1));
        if (gallery.length - 1 <= 0) setLbOpen(false);
      }
    } catch {
      toast.error("Falha ao remover a imagem.");
    }
  }

  /* --------------------------------- vacinas -------------------------------- */
  const refetchVaccines = useRef(null);

  useEffect(() => {
    let cancel = false;
    async function loadVaccines() {
      if (!animalId) return;
      setLoadingVaccines(true);
      try {
        const resp = await fetchVaccines({ animalId, page: 1, perPage: 200 });
        const arr =
          (resp && Array.isArray(resp.data) && resp.data) ||
          (Array.isArray(resp) && resp) ||
          (resp && Array.isArray(resp.items) && resp.items) ||
          [];
        if (!cancel) {
          setVaccines(
            arr
              .map((v) => ({
                id: v.id || v._id,
                name: v.name || v.vaccine || "",
                date: v.appliedAt || v.date || "",
                nextDoseDate: v.nextDose || v.nextDoseDate || "",
                clinic: v.clinic || "",
                notes: v.observations || v.notes || "",
              }))
              .filter((v) => !!v.id || !!v.name)
          );
        }
      } catch {
        if (!cancel) setVaccines([]);
      } finally {
        if (!cancel) setLoadingVaccines(false);
      }
    }
    refetchVaccines.current = loadVaccines;
    loadVaccines();
    return () => {
      cancel = true;
    };
  }, [animalId]);

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
    if (!canEdit) {
      toast.error("Apenas o tutor do pet pode realizar esta ação.");
      return;
    }
    setVacEditId(null);
    setVacForm({ name: "", date: "", nextDoseDate: "", clinic: "", notes: "" });
    setVacModalOpen(true);
  };

  const openVacEdit = (vx) => {
    if (!canEdit) {
      toast.error("Apenas o tutor do pet pode realizar esta ação.");
      return;
    }

    // converte ISO → "YYYY-MM-DD" (aceito pelo input date)
    const toDateInput = (val) => {
      if (!val) return "";
      try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return "";
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      } catch {
        return "";
      }
    };

    setVacEditId(vx.id);
    setVacForm({
      name: vx.name || "",
      date: toDateInput(vx.date) || "",
      nextDoseDate: toDateInput(vx.nextDoseDate) || "",
      clinic: vx.clinic || "",
      notes: vx.notes || "",
    });
    setVacModalOpen(true);
  };

  async function submitVaccine() {
    if (!canEdit) return;

    const name = String(vacForm.name || "").trim();
    const appliedAt = String(vacForm.date || "");
    const nextDose = vacForm.nextDoseDate || undefined;
    const clinic = String(vacForm.clinic || "").trim();
    const observations = String(vacForm.notes || "").trim();

    if (!name || !appliedAt) {
      toast.error("Informe ao menos a vacina e a data.");
      return;
    }

    try {
      if (vacEditId) {
        // EDITAR → usa a rota de atualização (sem deletar/recriar)
        await updateVaccine({
          animalId,
          vaccineId: vacEditId,
          name,
          observations,
          clinic,
          appliedAt,
          nextDose,
        });
        toast.success("Vacina atualizada.");
      } else {
        // CRIAR → mantém addVaccine
        await addVaccine({
          animalId,
          name,
          observations,
          clinic,
          appliedAt,
          nextDose,
        });
        toast.success("Vacina registrada.");
      }

      await refetchVaccines.current?.();
      setVacModalOpen(false);
      setVacEditId(null);
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível salvar. Tente novamente.");
    }
  }

  async function markAsToday(vx) {
    if (!canEdit) return;

    const ok = await confirm({
      title: "Marcar como aplicada hoje?",
      description:
        "A data de aplicação será atualizada para hoje. A próxima dose (se houver) permanece.",
      confirmText: "Marcar",
      tone: "confirm",
    });
    if (!ok) return;

    try {
      const today = new Date();
      const iso = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      await updateVaccine({
        animalId,
        vaccineId: vx.id,
        name: vx.name,
        observations: vx.notes || "",
        clinic: vx.clinic || "",
        appliedAt: iso,
        nextDose: vx.nextDoseDate || undefined,
      });

      await refetchVaccines.current?.();
      toast.success("Aplicação marcada para hoje.");
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível atualizar a aplicação.");
    }
  }

  async function removeVaccine(vx) {
    if (!canEdit) return;
    const ok = await confirm({
      title: "Excluir registro?",
      description: "Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await deleteVaccines({ animalId, vaccineId: vx.id });
      setVaccines((list) => list.filter((v) => v.id !== vx.id));
      toast.success("Registro removido.");
    } catch {
      toast.error("Falha ao remover o registro.");
    }
  }

  /* --------------------------- lightbox / slides --------------------------- */
  const lbSlides = useMemo(
    () =>
      (gallery || []).map((m) => ({
        id: m.id,
        url: m.url,
        title: m.title || "",
        alt: m.title || "",
        description: m.title || "",
      })),
    [gallery]
  );

  const openLightbox = (idx) => {
    setLbIndex(idx);
    setLbOpen(true);
  };

  if (!pet) {
    return <div className="p-6 text-sm opacity-70">Pet não encontrado.</div>;
  }

  const headerAvatarSrc = avatarUrl || coverUrl || undefined; // avatar já cai para breed.image
  const vaccinesCountLabel = loadingVaccines
    ? "…"
    : `${vaccinesCount} registro(s)`;

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
              <h1 className="text-lg md:text-xl font-semibold">{pet.name}</h1>{" "}
              <p className="text-xs md:text-sm opacity-70 capitalize">
                {pet.species} • {pet.breed} • {pet.gender}{" "}
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
                        {vaccinesCountLabel}
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
                  {loadingVaccines ? (
                    <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm opacity-70">
                      Carregando vacinas…
                    </div>
                  ) : vaccines.length === 0 ? (
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
                                {!!v.nextDoseDate &&
                                  vaccineBadge(v.nextDoseDate)}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs opacity-80">
                                <span className="inline-flex items-center gap-1">
                                  <CalendarDays className="h-3.5 w-3.5" />
                                  Aplicada em:{" "}
                                  <strong>{formatPt(v.date)}</strong>
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
                                  <span className="whitespace-pre-wrap">
                                    {v.notes}
                                  </span>
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

                {/* Seções ainda sem funcionalidade deixadas comentadas */}
                {/*
                <StaticItem icon={<Pill className="h-4 w-4 opacity-70" />} title="Tratamentos antiparasitários" showPlus={canEdit} />
                <StaticItem icon={<Stethoscope className="h-4 w-4 opacity-70" />} title="Intervenções médicas" showPlus={canEdit} />
                <StaticItem icon={<Bandage className="h-4 w-4 opacity-70" />} title="Outros tratamentos" showPlus={canEdit} />
                */}
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
                          className="hidden"
                          onChange={handleAddMedia}
                        />
                      </label>
                    )}
                  </div>

                  {loadingGallery ? (
                    <div className="rounded-lg border border-black/10 dark:border-white/10 p-6 text-sm opacity-70">
                      Carregando galeria…
                    </div>
                  ) : gallery.length === 0 ? (
                    <div className="rounded-lg border border-black/10 dark:border-white/10 p-6 text-sm opacity-70">
                      Nenhuma mídia ainda.{" "}
                      {canEdit ? "Use “Adicionar mídia”." : "—"}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {gallery.map((m, idx) => (
                        <div
                          key={m.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => openLightbox(idx)}
                          onKeyDown={(e) =>
                            (e.key === "Enter" || e.key === " ") &&
                            openLightbox(idx)
                          }
                          className="group relative overflow-hidden rounded-lg cursor-pointer"
                          title={m.title}
                        >
                          <img
                            src={m.url || undefined}
                            alt={m.title || ""}
                            className="aspect-[4/3] w-full object-cover"
                          />

                          {/* ações visíveis só para tutor */}
                          {canEdit && (
                            <div
                              className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/60 to-black/0 p-2 text-white transition-opacity opacity-100 md:opacity-0 md:group-hover:opacity-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="max-w-[60%] truncate text-xs">
                                {m.title || "Sem título"}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  title="Remover"
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/50 hover:bg-black/60"
                                  onClick={() => handleDeleteMedia(m)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* LIGHTBOX */}
      {lbOpen && (
        <Lightbox
          open={lbOpen}
          images={lbSlides.map((s) => s.url)}
          index={lbIndex}
          slides={lbSlides}
          onClose={() => setLbOpen(false)}
          onPrev={() =>
            setLbIndex((i) => (i - 1 + lbSlides.length) % lbSlides.length)
          }
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
