// src/features/pets/pages/PetDetail.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReportModal from "@/components/ReportModal";
import {
  Shield,
  ShieldAlert,
  Images,
  Syringe,
  Pill,
  Bug,
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
  UserPlus,
  UserMinus,
  Search,
  Users,
} from "lucide-react";
import Lightbox from "@/components/Lightbox";
import { useToast } from "@/components/ui/ToastProvider";
import { useConfirm, usePrompt } from "@/components/ui/ConfirmProvider";
import heic2any from "heic2any";

// APIs
import { getMyProfile, fetchUsersProfile, getUserProfile } from "@/api/user.api.js";
import { fetchAnimalsById } from "@/api/animal.api.js";
import { addOwner, removeOwner, transferPrimaryOwner, hidePetForMe } from "@/api/owner.api.js";
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
import {
  addDeworming,
  fetchDewormings,
  deleteDeworming,
  updateDeworming,
} from "@/api/deworming.api.js";
import {
  addMedication,
  fetchMedications,
  deleteMedication,
  updateMedication,
} from "@/api/medications.api.js";

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

/* ----------------------------- helpers img ------------------------------ */
// mantém o readAsDataURL existente se for usado em outro lugar
const isHeic = (file) =>
  file &&
  (/\.(heic|heif)$/i.test(file.name || "") ||
    /image\/hei(c|f)/i.test(file.type || ""));

/** Converte HEIC/HEIF para JPEG antes de qualquer processamento */
async function ensureJpeg(file) {
  if (!(file instanceof File)) return file;
  if (!isHeic(file)) return file;
  try {
    const blob = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.92,
    });
    return new File(
      [blob],
      (file.name || "image").replace(/\.(heic|heif)$/i, ".jpg"),
      { type: "image/jpeg" }
    );
  } catch {
    // fallback: se falhar a conversão, retorna o original
    return file;
  }
}

/**
 * Compressão adaptativa visando um teto de bytes.
 * - Converte HEIC → JPEG (se necessário)
 * - Redimensiona até máx. 1920x1920
 * - Ajusta qualidade até atingir targetMaxBytes (sem cair abaixo de minQuality)
 * - Se ainda ficar grande, reduz dimensões gradualmente
 * Retorna um File .jpg
 */
async function compressImage(
  file,
  {
    maxW = 1920,
    maxH = 1920,
    initialQuality = 0.86,
    minQuality = 0.6,
    targetMaxBytes = 900 * 1024, // ~900 KB
    downscaleStep = 0.9, // reduz 10% se necessário
  } = {}
) {
  if (!(file instanceof File)) return file;

  // 1) Converter HEIC → JPEG
  const base = await ensureJpeg(file);

  // 2) Criar bitmap (com fallback via <img> se necessário)
  let bitmap;
  try {
    bitmap = await createImageBitmap(base);
  } catch {
    const url = URL.createObjectURL(base);
    bitmap = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        createImageBitmap(img)
          .then(resolve)
          .catch(() => resolve(img));
        URL.revokeObjectURL(url);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  // 3) Redimensionar para caber em maxW x maxH
  let { width, height } = bitmap;
  let ratio = Math.min(maxW / width, maxH / height, 1);
  let w = Math.max(1, Math.round(width * ratio));
  let h = Math.max(1, Math.round(height * ratio));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(bitmap, 0, 0, w, h);

  // 4) Ajustar qualidade até atingir o alvo
  let quality = initialQuality;
  let blob = await new Promise((res) =>
    canvas.toBlob(res, "image/jpeg", quality)
  );

  while (blob && blob.size > targetMaxBytes && quality > minQuality + 0.01) {
    quality = Math.max(minQuality, quality - 0.08);
    blob = await new Promise((res) =>
      canvas.toBlob(res, "image/jpeg", quality)
    );
  }

  // 5) Se ainda passou do alvo, reduzir dimensões mantendo qualidade mínima
  while (blob && blob.size > targetMaxBytes && (w > 640 || h > 640)) {
    w = Math.max(640, Math.round(w * downscaleStep));
    h = Math.max(640, Math.round(h * downscaleStep));
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(bitmap, 0, 0, w, h);
    blob = await new Promise((res) =>
      canvas.toBlob(res, "image/jpeg", minQuality)
    );
  }

  // 6) Retornar como File .jpg
  if (!blob) return base;
  return new File(
    [blob],
    (base.name || "image").replace(/\.(png|webp|gif|heic|heif)$/i, ".jpg"),
    { type: "image/jpeg" }
  );
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

  const showComingSoon = () => toast.info("Este item será habilitado em breve");
  const isNotImplemented = (err) => {
    const s = err?.response?.status;
    return s === 404 || s === 405 || s === 501;
  };

  const confirm = useConfirm();
  const askInput = usePrompt();

  const [me, setMe] = useState(null);
  const [pet, setPet] = useState(null);

  const [tab, setTab] = useState("health"); // 'health' | 'gallery'
  const [vaccinesOpen, setVaccinesOpen] = useState(true);
  const [dewormingsOpen, setDewormingsOpen] = useState(true);
  const [medicationsOpen, setMedicationsOpen] = useState(true);

  // Lightbox
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);

  // Galeria (do servidor)
  const [gallery, setGallery] = useState([]); // [{id,url,title,createdAt}]
  const [loadingGallery, setLoadingGallery] = useState(false);

  // Vacinas (do servidor)
  const [vaccines, setVaccines] = useState([]);
  const [loadingVaccines, setLoadingVaccines] = useState(false);

  // Vermifugação (do servidor)
  const [dewormings, setDewormings] = useState([]);
  const [loadingDewormings, setLoadingDewormings] = useState(false);

  // Medicamentos (do servidor)
  const [medications, setMedications] = useState([]);
  const [loadingMedications, setLoadingMedications] = useState(false);

  // Header (avatar/capa)
  const [avatarUrl, setAvatarUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  // Tutores (owners)
  const [owners, setOwners] = useState([]); // [{id, username, name, image}]
  const [tutorModalOpen, setTutorModalOpen] = useState(false);
  const [tutorQuery, setTutorQuery] = useState("");
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorResults, setTutorResults] = useState([]);

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

  // Modal de Vermifugação (create/edit)
  const [dewModalOpen, setDewModalOpen] = useState(false);
  const [dewEditId, setDewEditId] = useState(null);
  const [dewForm, setDewForm] = useState({
    name: "",
    date: "",
    nextDoseDate: "",
    clinic: "",
    notes: "",
  });

  // Modal de Medicamentos (create/edit)
  const [medModalOpen, setMedModalOpen] = useState(false);
  const [medEditId, setMedEditId] = useState(null);
  const [medForm, setMedForm] = useState({
    name: "",
    startAt: "",
    endAt: "",
    dosage: "",
    frequency: "",
    clinic: "",
    notes: "",
  });

  // Denúncia de pet (hooks precisam estar no topo do componente)
  const [report, setReport] = useState({ open: false, category: "PET_ABUSE" });
  const handleReportPet = (category = "PET_ABUSE") => {
    setReport({ open: true, category });
  };

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

        const ownerObjsFromArray = Array.isArray(a?.owners)
          ? a.owners
              .map((o) => ({
                id: o?.id,
                username: o?.username || "",
                name: o?.name || o?.displayName || "",
                image: o?.image?.url || o?.image || o?.avatar || "",
              }))
              .filter((o) => !!o.id)
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
          createdByOwnerId: a?.createdByOwnerId || a?.created_by_owner_id || null,
          ownerIds: ownersFromArray.length ? ownersFromArray : primaryOwnerId ? [primaryOwnerId] : [],
        });

        setOwners(
          ownerObjsFromArray.length
            ? ownerObjsFromArray
            : primaryOwnerId
            ? [{ id: primaryOwnerId }]
            : []
        );
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
  // Permissões
  // - Ações de saúde (vacinas/vermifugação/medicamentos): QUALQUER tutor do pet
  // - Gestão de tutores: SOMENTE tutor principal (ownerId)
  const myIdStr = me?.id ? String(me.id) : null;
  const ownerIdsStr = Array.isArray(pet?.ownerIds) ? pet.ownerIds.map(String) : [];
  const primaryOwnerIdStr = pet?.ownerId ? String(pet.ownerId) : null;

  const canEditHealth = useMemo(() => {
    if (!myIdStr) return false;
    return ownerIdsStr.includes(myIdStr) || myIdStr === primaryOwnerIdStr;
  }, [myIdStr, primaryOwnerIdStr, JSON.stringify(pet?.ownerIds || [])]);

  const canManageTutors = useMemo(() => {
    if (!myIdStr || !primaryOwnerIdStr) return false;
    return myIdStr === primaryOwnerIdStr;
  }, [myIdStr, primaryOwnerIdStr]);

  // Compat: código antigo usa canEdit como permissão de edição
  const canEdit = canEditHealth;

  const isPrimaryTutor = canManageTutors;
  const isOriginalCreator = !!myIdStr && String(pet?.createdByOwnerId || '') === myIdStr;




  // Completa dados dos tutores quando o backend só envia IDs
  useEffect(() => {
    let cancel = false;

    (async () => {
      const ids = Array.isArray(pet?.ownerIds) ? pet.ownerIds.map(String) : [];
      if (!ids.length) {
        setOwners([]);
        return;
      }

      const known = new Map();
      for (const o of owners || []) {
        if (o?.id) known.set(String(o.id), o);
      }

      const resolved = [];
      for (const id of ids) {
        const have = known.get(String(id));
        if (have && (have.username || have.name || have.image)) {
          resolved.push(have);
          continue;
        }
        try {
          const prof = await getUserProfile({ id });
          const u = prof?.data || prof || {};
          resolved.push({
            id: u?.id || id,
            username: u?.username || "",
            name: u?.name || u?.displayName || "",
            image: u?.imageCover?.url || u?.image?.url || u?.image || "",
          });
        } catch {
          resolved.push({ id });
        }
      }

      if (!cancel) setOwners(resolved);
    })();

    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(pet?.ownerIds || [])]);

  const openTutorModal = () => {
    if (!canEdit) {
      toast.error("Apenas um tutor pode gerenciar tutores.");
      return;
    }
    setTutorQuery("");
    setTutorResults([]);
    setTutorModalOpen(true);
  };

  const searchTutors = async (q) => {
    const query = String(q || "").trim();
    setTutorQuery(query);
    if (!query) {
      setTutorResults([]);
      return;
    }

    setTutorLoading(true);
    try {
      const resp = await fetchUsersProfile({ query, page: 1, perPage: 10 });
      const list = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : [];

      const existing = new Set((pet?.ownerIds || []).map(String));
      setTutorResults(list.filter((u) => !existing.has(String(u?.id))));
    } catch (e) {
      console.error(e);
      setTutorResults([]);
    } finally {
      setTutorLoading(false);
    }
  };

  const addTutorToPet = async (user) => {
    const ownerId = user?.id;
    if (!ownerId) return;
    try {
      await addOwner({ ownerId, animalId });
      toast.success("Tutor vinculado ao pet.");
      setPet((p) => {
        const ids = new Set([...(p?.ownerIds || []).map(String), String(ownerId)]);
        return { ...p, ownerIds: Array.from(ids) };
      });
      setOwners((curr) => {
        const ids = new Set(curr.map((o) => String(o?.id)));
        if (ids.has(String(ownerId))) return curr;
        return [
          ...curr,
          {
            id: user.id,
            username: user.username || "",
            name: user.name || user.displayName || "",
            image: user.image?.url || user.image || "",
          },
        ];
      });
      setTutorModalOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Falha ao vincular tutor.");
    }
  };

  const removeTutorFromPet = async (ownerId) => {
    const id = ownerId ? String(ownerId) : null;
    if (!id) return;

    // não permite remover tutor principal
    const primary = pet?.ownerId ? String(pet.ownerId) : null;
    if (primary && id === primary) {
      toast.error('Não é possível remover o tutor principal.');
      return;
    }

    // não deixa remover o último tutor
    const current = Array.isArray(pet?.ownerIds) ? pet.ownerIds.map(String) : [];
    if (current.length <= 1) {
      toast.error("O pet precisa ter pelo menos 1 tutor.");
      return;
    }

    const ok = await confirm({
      title: "Remover tutor?",
      description: "O perfil deixará de estar vinculado a este pet.",
      confirmText: "Remover",
      tone: "danger",
    });
    if (!ok) return;

    try {
      await removeOwner({ ownerId: id, animalId });
      toast.success("Tutor removido.");
      setPet((p) => ({
        ...p,
        ownerIds: (p?.ownerIds || []).map(String).filter((x) => x !== id),
      }));
      setOwners((curr) => curr.filter((o) => String(o?.id) != id));
    } catch (e) {
      console.error(e);
      toast.error("Falha ao remover tutor.");
    }
  };

  const makePrimaryTutor = async (ownerId) => {
    const id = ownerId ? String(ownerId) : null;
    if (!id) return;
    if (!isPrimaryTutor) {
      toast.error('Apenas o tutor principal pode transferir a tutoria.');
      return;
    }
    if (String(pet?.ownerId || '') === id) return;

    const ok = await confirm({
      title: 'Tornar tutor principal?',
      description: 'Você transferirá a tutoria principal. Depois disso, você não poderá remover o novo tutor principal.',
      confirmText: 'Transferir',
      tone: 'danger',
    });
    if (!ok) return;

    try {
      await transferPrimaryOwner({ animalId, ownerId: id });
      toast.success('Tutoria principal transferida.');
      setPet((p) => ({ ...p, ownerId: id }));
    } catch (e) {
      console.error(e);
      toast.error('Falha ao transferir tutoria.');
    }
  };

  const hideThisPetForMe = async () => {
    const ok = await confirm({
      title: 'Remover pet da minha lista?',
      description: 'Isso é um delete lógico: o pet não some do sistema, apenas deixa de aparecer para você.',
      confirmText: 'Remover da minha lista',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await hidePetForMe({ animalId });
      toast.success('Pet removido da sua lista.');
      navigate('/pets');
    } catch (e) {
      console.error(e);
      toast.error('Não foi possível remover da sua lista.');
    }
  };

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
      if (
        !file.type.startsWith("image/") &&
        !/\.(heic|heif)$/i.test(file.name || "")
      )
        return;
      const finalFile = await compressImage(file, {
        maxW: 1920,
        maxH: 1920,
        initialQuality: 0.86,
        minQuality: 0.6,
        targetMaxBytes: 900 * 1024,
      });
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
      if (isNotImplemented(e)) showComingSoon();
      else toast.error("Não foi possível salvar. Tente novamente.");
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
      if (isNotImplemented(e)) showComingSoon();
      else toast.error("Não foi possível atualizar a aplicação.");
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
    } catch (e) {
      console.error(e);
      if (isNotImplemented(e)) showComingSoon();
      else toast.error("Falha ao remover o registro.");
    }
  }



  /* ------------------------------ vermifugação ------------------------------ */
  const refetchDewormings = useRef(null);

  useEffect(() => {
    let cancel = false;
    async function loadDewormings() {
      if (!animalId) return;
      setLoadingDewormings(true);
      try {
        const resp = await fetchDewormings({ animalId, page: 1, perPage: 200 });
        const arr =
          (resp && Array.isArray(resp.data) && resp.data) ||
          (Array.isArray(resp) && resp) ||
          (resp && Array.isArray(resp.items) && resp.items) ||
          [];
        if (!cancel) {
          setDewormings(
            arr
              .map((d) => ({
                id: d.id || d._id,
                name: d.name || d.dewormer || d.vermifugo || "",
                date: d.appliedAt || d.date || "",
                nextDoseDate: d.nextDose || d.nextDoseDate || "",
                clinic: d.clinic || "",
                notes: d.observations || d.notes || "",
              }))
              .filter((d) => !!d.id || !!d.name)
          );
        }
      } catch {
        if (!cancel) setDewormings([]);
      } finally {
        if (!cancel) setLoadingDewormings(false);
      }
    }

    refetchDewormings.current = loadDewormings;
    loadDewormings();
    return () => {
      cancel = true;
    };
  }, [animalId]);

  const dewormingsCount = dewormings.length;

  const openDewCreate = () => {
    if (!canEdit) {
      toast.error("Apenas o tutor do pet pode realizar esta ação.");
      return;
    }
    setDewEditId(null);
    setDewForm({ name: "", date: "", nextDoseDate: "", clinic: "", notes: "" });
    setDewModalOpen(true);
  };

  const openDewEdit = (dw) => {
    if (!canEdit) {
      toast.error("Apenas o tutor do pet pode realizar esta ação.");
      return;
    }

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

    setDewEditId(dw.id);
    setDewForm({
      name: dw.name || "",
      date: toDateInput(dw.date) || "",
      nextDoseDate: toDateInput(dw.nextDoseDate) || "",
      clinic: dw.clinic || "",
      notes: dw.notes || "",
    });
    setDewModalOpen(true);
  };

  async function submitDeworming() {
    if (!canEdit) return;

    const name = String(dewForm.name || "").trim();
    const appliedAt = String(dewForm.date || "");
    const nextDose = dewForm.nextDoseDate || undefined;
    const clinic = String(dewForm.clinic || "").trim();
    const observations = String(dewForm.notes || "").trim();

    if (!name || !appliedAt) {
      toast.error("Informe ao menos o vermífugo e a data.");
      return;
    }

    try {
      if (dewEditId) {
        await updateDeworming({
          animalId,
          dewormingId: dewEditId,
          name,
          observations,
          clinic,
          appliedAt,
          nextDose,
        });
        toast.success("Vermifugação atualizada.");
      } else {
        await addDeworming({ animalId, name, observations, clinic, appliedAt, nextDose });
        toast.success("Vermifugação registrada.");
      }

      await refetchDewormings.current?.();
      setDewModalOpen(false);
      setDewEditId(null);
    } catch (e) {
      console.error(e);
      if (isNotImplemented(e)) showComingSoon();
      else toast.error("Não foi possível salvar. Tente novamente.");
    }
  }

  async function markDewAsToday(dw) {
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
      const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
        today.getDate()
      ).padStart(2, "0")}`;

      await updateDeworming({
        animalId,
        dewormingId: dw.id,
        name: dw.name,
        observations: dw.notes || "",
        clinic: dw.clinic || "",
        appliedAt: iso,
        nextDose: dw.nextDoseDate || undefined,
      });

      await refetchDewormings.current?.();
      toast.success("Aplicação marcada para hoje.");
    } catch (e) {
      console.error(e);
      if (isNotImplemented(e)) showComingSoon();
      else toast.error("Não foi possível atualizar a aplicação.");
    }
  }

  async function removeDeworming(dw) {
    if (!canEdit) return;
    const ok = await confirm({
      title: "Excluir registro?",
      description: "Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await deleteDeworming({ animalId, dewormingId: dw.id });
      setDewormings((list) => list.filter((d) => d.id !== dw.id));
      toast.success("Registro removido.");
    } catch (e) {
      console.error(e);
      if (isNotImplemented(e)) showComingSoon();
      else toast.error("Falha ao remover o registro.");
    }
  }

  /* ------------------------------ medicamentos ------------------------------ */
  const refetchMedications = useRef(null);

  useEffect(() => {
    let cancel = false;
    async function loadMedications() {
      if (!animalId) return;
      setLoadingMedications(true);
      try {
        const resp = await fetchMedications({ animalId, page: 1, perPage: 200 });
        const arr =
          (resp && Array.isArray(resp.data) && resp.data) ||
          (Array.isArray(resp) && resp) ||
          (resp && Array.isArray(resp.items) && resp.items) ||
          [];
        if (!cancel) {
          setMedications(
            arr
              .map((m) => ({
                id: m.id || m._id,
                name: m.name || m.medication || m.medicamento || "",
                startAt: m.startAt || m.startDate || m.appliedAt || m.date || "",
                endAt: m.endAt || m.endDate || "",
                dosage: m.dosage || "",
                frequency: m.frequency || m.interval || "",
                clinic: m.clinic || "",
                notes: m.observations || m.notes || "",
              }))
              .filter((m) => !!m.id || !!m.name)
          );
        }
      } catch {
        if (!cancel) setMedications([]);
      } finally {
        if (!cancel) setLoadingMedications(false);
      }
    }

    refetchMedications.current = loadMedications;
    loadMedications();
    return () => {
      cancel = true;
    };
  }, [animalId]);

  const medicationsCount = medications.length;

  const openMedCreate = () => {
    if (!canEdit) {
      toast.error("Apenas o tutor do pet pode realizar esta ação.");
      return;
    }
    setMedEditId(null);
    setMedForm({ name: "", startAt: "", endAt: "", dosage: "", frequency: "", clinic: "", notes: "" });
    setMedModalOpen(true);
  };

  const openMedEdit = (mx) => {
    if (!canEdit) {
      toast.error("Apenas o tutor do pet pode realizar esta ação.");
      return;
    }

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

    setMedEditId(mx.id);
    setMedForm({
      name: mx.name || "",
      startAt: toDateInput(mx.startAt) || "",
      endAt: toDateInput(mx.endAt) || "",
      dosage: mx.dosage || "",
      frequency: mx.frequency || "",
      clinic: mx.clinic || "",
      notes: mx.notes || "",
    });
    setMedModalOpen(true);
  };

  async function submitMedication() {
    if (!canEdit) return;

    const name = String(medForm.name || "").trim();
    const startAt = String(medForm.startAt || "");
    const endAt = medForm.endAt || undefined;
    const dosage = String(medForm.dosage || "").trim() || undefined;
    const frequency = String(medForm.frequency || "").trim() || undefined;
    const clinic = String(medForm.clinic || "").trim() || undefined;
    const observations = String(medForm.notes || "").trim() || undefined;

    if (!name || !startAt) {
      toast.error("Informe ao menos o medicamento e a data de início.");
      return;
    }

    try {
      if (medEditId) {
        await updateMedication({
          animalId,
          medicationId: medEditId,
          name,
          startAt,
          endAt,
          dosage,
          frequency,
          clinic,
          observations,
        });
        toast.success("Medicamento atualizado.");
      } else {
        await addMedication({ animalId, name, startAt, endAt, dosage, frequency, clinic, observations });
        toast.success("Medicamento registrado.");
      }

      await refetchMedications.current?.();
      setMedModalOpen(false);
      setMedEditId(null);
    } catch (e) {
      console.error(e);
      if (isNotImplemented(e)) showComingSoon();
      else toast.error("Não foi possível salvar. Tente novamente.");
    }
  }

  async function removeMedication(mx) {
    if (!canEdit) return;
    const ok = await confirm({
      title: "Excluir registro?",
      description: "Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await deleteMedication({ animalId, medicationId: mx.id });
      setMedications((list) => list.filter((m) => m.id !== mx.id));
      toast.success("Registro removido.");
    } catch (e) {
      console.error(e);
      if (isNotImplemented(e)) showComingSoon();
      else toast.error("Falha ao remover o registro.");
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
          <div className="flex items-start justify-between gap-4">
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

            {/* Denúncia de pet (bem destacada) */}
            <button
              type="button"
              onClick={() => handleReportPet("PET_ABUSE")}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200 dark:hover:bg-rose-950/30"
              title="Denunciar maus-tratos (pet)"
            >
              <ShieldAlert className="h-4 w-4" /> Maus-tratos (pet)
            </button>
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

          {/* Tutores */}
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium opacity-80 inline-flex items-center gap-2">
                <Users className="h-4 w-4 opacity-70" /> Tutores
              </h3>

              {canManageTutors && (
                <button
                  type="button"
                  onClick={openTutorModal}
                  className="inline-flex items-center gap-1 rounded-full bg-[#f77904] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                  title="Adicionar tutor"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Adicionar
                </button>
              )}
            </div>

            {owners.length === 0 ? (
              <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm opacity-70">
                —
              </div>
            ) : (
              <ul className="space-y-2">
                {owners.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-[var(--chip-bg)] px-3 py-2 ring-1 ring-black/5 dark:ring-white/5"
                  >
                    <Link
                      to={`/usuario/${o.id}`}
                      className="flex min-w-0 items-center gap-3 hover:opacity-90"
                      title="Ver perfil"
                    >
                      <img
                        src={
                          o.image ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            o?.name || o?.username || "User",
                          )}`
                        }
                        alt={o?.name || o?.username || "Tutor"}
                        className="h-9 w-9 rounded-full object-cover bg-zinc-200 dark:bg-zinc-700"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {o.username ? `@${o.username}` : o.name || 'usuário'}
                        </div>
                        {o.name && (
                          <div className="truncate text-xs opacity-70">{o.name}</div>
                        )}
                      </div>
                    </Link>

                    {canManageTutors && owners.length > 1 && String(o.id) !== String(pet?.ownerId) && String(o.id) !== String(me?.id) && (
                      <div className="flex items-center gap-2">
                        <button
                        type="button"
                        onClick={() => removeTutorFromPet(o.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                        title="Remover tutor"
                      >
                        <UserMinus className="h-3.5 w-3.5" /> Remover
                        </button>

                        <button
                          type="button"
                          onClick={() => makePrimaryTutor(o.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                          title="Tornar tutor principal"
                        >
                          Principal
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              

            {isOriginalCreator && !isPrimaryTutor && (pet?.ownerIds || []).length > 1 && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => removeTutorFromPet(me?.id)}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                >
                  Sair da tutoria
                </button>
              </div>
            )}
</ul>
            )}
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

                {/* VERMIFUGAÇÃO */}
                <Accordion
                  open={dewormingsOpen}
                  onToggle={() => setDewormingsOpen((v) => !v)}
                  leftIcon={<Bug className="h-4 w-4 opacity-70" />}
                  title="Vermifugação"
                  rightActions={
                    <div className="flex items-center gap-2">
                      <span className="text-xs opacity-60">
                        {loadingDewormings ? "…" : `${dewormingsCount} registro(s)`}
                      </span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={openDewCreate}
                          className="inline-flex items-center gap-1 rounded-full bg-[#f77904] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                          title="Adicionar vermifugação"
                        >
                          <Plus className="h-3.5 w-3.5" /> Adicionar
                        </button>
                      )}
                    </div>
                  }
                >
                  {loadingDewormings ? (
                    <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm opacity-70">
                      Carregando vermifugações…
                    </div>
                  ) : dewormings.length === 0 ? (
                    <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm opacity-70">
                      Nenhuma vermifugação registrada para este pet.
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {dewormings
                        .slice()
                        .sort(
                          (a, b) =>
                            (parseISODateLocal(b.date)?.getTime() || 0) -
                            (parseISODateLocal(a.date)?.getTime() || 0)
                        )
                        .map((d) => (
                          <li
                            key={d.id}
                            className="flex items-start justify-between gap-3 rounded-lg border border-black/10 p-3 text-sm dark:border-white/10"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium inline-flex items-center gap-2">
                                  <Bug className="h-4 w-4 opacity-70" />
                                  {d.name}
                                </span>
                                {!!d.nextDoseDate && vaccineBadge(d.nextDoseDate)}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs opacity-80">
                                <span className="inline-flex items-center gap-1">
                                  <CalendarDays className="h-3.5 w-3.5" />
                                  Aplicada em: <strong>{formatPt(d.date)}</strong>
                                </span>
                                {d.nextDoseDate && (
                                  <span className="inline-flex items-center gap-1">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    Próxima dose: <strong>{formatPt(d.nextDoseDate)}</strong>
                                  </span>
                                )}
                                {d.clinic && (
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {d.clinic}
                                  </span>
                                )}
                              </div>
                              {d.notes && (
                                <div className="mt-2 text-xs opacity-80">
                                  • {d.notes}
                                </div>
                              )}
                            </div>

                            {canEdit && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => markDewAsToday(d)}
                                  className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                                  title="Marcar como hoje"
                                >
                                  Hoje
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDewEdit(d)}
                                  className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white p-2 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                                  title="Editar"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeDeworming(d)}
                                  className="inline-flex items-center justify-center rounded-md border border-red-300 bg-white p-2 text-xs text-red-700 hover:bg-red-50 dark:border-red-900/40 dark:bg-zinc-900 dark:text-red-300 dark:hover:bg-red-950/20"
                                  title="Excluir"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </li>
                        ))}
                    </ul>
                  )}
                </Accordion>

                {/* MEDICAMENTOS */}
                <Accordion
                  open={medicationsOpen}
                  onToggle={() => setMedicationsOpen((v) => !v)}
                  leftIcon={<Pill className="h-4 w-4 opacity-70" />}
                  title="Medicamentos"
                  rightActions={
                    <div className="flex items-center gap-2">
                      <span className="text-xs opacity-60">
                        {loadingMedications ? "…" : `${medicationsCount} registro(s)`}
                      </span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={openMedCreate}
                          className="inline-flex items-center gap-1 rounded-full bg-[#f77904] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                          title="Adicionar medicamento"
                        >
                          <Plus className="h-3.5 w-3.5" /> Adicionar
                        </button>
                      )}
                    </div>
                  }
                >
                  {loadingMedications ? (
                    <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm opacity-70">
                      Carregando medicamentos…
                    </div>
                  ) : medications.length === 0 ? (
                    <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm opacity-70">
                      Nenhum medicamento registrado para este pet.
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {medications
                        .slice()
                        .sort(
                          (a, b) =>
                            (parseISODateLocal(b.startAt)?.getTime() || 0) -
                            (parseISODateLocal(a.startAt)?.getTime() || 0)
                        )
                        .map((m) => (
                          <li
                            key={m.id}
                            className="flex items-start justify-between gap-3 rounded-lg border border-black/10 p-3 text-sm dark:border-white/10"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium inline-flex items-center gap-2">
                                  <Pill className="h-4 w-4 opacity-70" />
                                  {m.name}
                                </span>
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs opacity-80">
                                <span className="inline-flex items-center gap-1">
                                  <CalendarDays className="h-3.5 w-3.5" />
                                  Início: <strong>{formatPt(m.startAt)}</strong>
                                </span>
                                {m.endAt && (
                                  <span className="inline-flex items-center gap-1">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    Fim: <strong>{formatPt(m.endAt)}</strong>
                                  </span>
                                )}
                                {m.dosage && (
                                  <span className="inline-flex items-center gap-1">
                                    • Dose: <strong>{m.dosage}</strong>
                                  </span>
                                )}
                                {m.frequency && (
                                  <span className="inline-flex items-center gap-1">
                                    • Frequência: <strong>{m.frequency}</strong>
                                  </span>
                                )}
                                {m.clinic && (
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {m.clinic}
                                  </span>
                                )}
                              </div>

                              {m.notes && (
                                <div className="mt-2 text-xs opacity-80">
                                  • {m.notes}
                                </div>
                              )}
                            </div>

                            {canEdit && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openMedEdit(m)}
                                  className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white p-2 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                                  title="Editar"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeMedication(m)}
                                  className="inline-flex items-center justify-center rounded-md border border-red-300 bg-white p-2 text-xs text-red-700 hover:bg-red-50 dark:border-red-900/40 dark:bg-zinc-900 dark:text-red-300 dark:hover:bg-red-950/20"
                                  title="Excluir"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
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
                          accept="image/*,.heic,.heif"
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



      {/* Modal: vermifugação */}
      {dewModalOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/10 dark:bg-zinc-900 dark:ring-white/10">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2">
                <Bug className="h-5 w-5" />
                <h3 className="text-lg font-semibold">
                  {dewEditId ? "Editar vermifugação" : "Registrar vermifugação"}
                </h3>
              </div>
              <button
                className="rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => {
                  setDewModalOpen(false);
                  setDewEditId(null);
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 inline-flex items-center gap-2 text-sm font-medium">
                  <Bug className="h-4 w-4" />
                  Vermífugo *
                </label>
                <input
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
                  value={dewForm.name}
                  onChange={(e) => setDewForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Ex.: Drontal, Endogard"
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
                  value={dewForm.date}
                  onChange={(e) => setDewForm((s) => ({ ...s, date: e.target.value }))}
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
                  value={dewForm.nextDoseDate}
                  onChange={(e) =>
                    setDewForm((s) => ({ ...s, nextDoseDate: e.target.value }))
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
                  value={dewForm.clinic}
                  onChange={(e) => setDewForm((s) => ({ ...s, clinic: e.target.value }))}
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
                  value={dewForm.notes}
                  onChange={(e) => setDewForm((s) => ({ ...s, notes: e.target.value }))}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
                onClick={() => {
                  setDewModalOpen(false);
                  setDewEditId(null);
                }}
              >
                Cancelar
              </button>
              <button
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
                onClick={submitDeworming}
              >
                {dewEditId ? "Salvar alterações" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: medicamentos */}
      {medModalOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/10 dark:bg-zinc-900 dark:ring-white/10">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2">
                <Pill className="h-5 w-5" />
                <h3 className="text-lg font-semibold">
                  {medEditId ? "Editar medicamento" : "Registrar medicamento"}
                </h3>
              </div>
              <button
                className="rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => {
                  setMedModalOpen(false);
                  setMedEditId(null);
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 inline-flex items-center gap-2 text-sm font-medium">
                  <Pill className="h-4 w-4" />
                  Medicamento *
                </label>
                <input
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
                  value={medForm.name}
                  onChange={(e) => setMedForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Ex.: Antibiótico, Anti-inflamatório"
                />
              </div>

              <div>
                <label className="mb-1 inline-flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="h-4 w-4" />
                  Início *
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
                  value={medForm.startAt}
                  onChange={(e) => setMedForm((s) => ({ ...s, startAt: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1 inline-flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="h-4 w-4" />
                  Fim
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
                  value={medForm.endAt}
                  onChange={(e) => setMedForm((s) => ({ ...s, endAt: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1 inline-flex items-center gap-2 text-sm font-medium">
                  • Dose
                </label>
                <input
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
                  value={medForm.dosage}
                  onChange={(e) => setMedForm((s) => ({ ...s, dosage: e.target.value }))}
                  placeholder="Ex.: 1 comprimido, 5ml"
                />
              </div>

              <div>
                <label className="mb-1 inline-flex items-center gap-2 text-sm font-medium">
                  • Frequência
                </label>
                <input
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
                  value={medForm.frequency}
                  onChange={(e) => setMedForm((s) => ({ ...s, frequency: e.target.value }))}
                  placeholder="Ex.: 12/12h, 1x ao dia"
                />
              </div>

              <div>
                <label className="mb-1 inline-flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4" />
                  Clínica
                </label>
                <input
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800"
                  value={medForm.clinic}
                  onChange={(e) => setMedForm((s) => ({ ...s, clinic: e.target.value }))}
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
                  value={medForm.notes}
                  onChange={(e) => setMedForm((s) => ({ ...s, notes: e.target.value }))}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
                onClick={() => {
                  setMedModalOpen(false);
                  setMedEditId(null);
                }}
              >
                Cancelar
              </button>
              <button
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
                onClick={submitMedication}
              >
                {medEditId ? "Salvar alterações" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal: adicionar tutor */}
      {tutorModalOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/10 dark:bg-zinc-900 dark:ring-white/10">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-sm font-semibold">
                <UserPlus className="h-4 w-4" /> Selecionar tutor
              </div>
              <button
                className="rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => setTutorModalOpen(false)}
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                value={tutorQuery}
                onChange={(e) => searchTutors(e.target.value)}
                placeholder="Buscar por nome ou @username…"
                className="w-full rounded-lg border border-zinc-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>

            <div className="mt-3 max-h-[50vh] overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              {tutorLoading ? (
                <div className="p-4 text-sm opacity-70">Buscando…</div>
              ) : tutorQuery && tutorResults.length === 0 ? (
                <div className="p-4 text-sm opacity-70">Nenhum perfil encontrado.</div>
              ) : tutorResults.length === 0 ? (
                <div className="p-4 text-sm opacity-70">Digite para buscar perfis.</div>
              ) : (
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {tutorResults.map((u) => (
                    <li key={u.id} className="flex items-center justify-between gap-3 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <img
                          src={
                            (u?.image?.url || u?.image) ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              u?.name || u?.username || "User",
                            )}`
                          }
                          alt={u?.name || u?.username || "Tutor"}
                          className="h-10 w-10 rounded-full object-cover bg-zinc-200 dark:bg-zinc-700"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">
                            {u?.username ? `@${u.username}` : u?.name || "usuário"}
                          </div>
                          {u?.name && (
                            <div className="truncate text-xs opacity-70">{u.name}</div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => addTutorToPet(u)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#f77904] px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
                      >
                        <Check className="h-3.5 w-3.5" /> Vincular
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setTutorModalOpen(false)}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <ReportModal
        open={report.open}
        onClose={() => setReport((r) => ({ ...r, open: false }))}
        initialType="ANIMAL"
        initialCategory={report.category}
        targetId={pet?.id}
        contextText={`Pet: ${pet?.name || ""}\nID: ${pet?.id || ""}`}
      />
    </div>
  );
}
