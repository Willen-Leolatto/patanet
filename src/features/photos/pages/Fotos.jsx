import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../../components/PageHeader";
import ContentCard from "../../../components/ContentCard";
import { loadPhotos, deletePhoto, updatePhoto } from "@features/photos/services/photosStorage";
import { loadPets } from "@features/pets/services/petsStorage";
import { useToast } from "../../../components/ui/ToastProvider";
import { useConfirm } from "../../../components/ui/ConfirmProvider";
import { Plus, Trash2, Search, Pencil, Check, X } from "lucide-react";
import Lightbox from "../../../components/Lightbox";

export default function Fotos() {
  const [photos, setPhotos] = useState([]);
  const [pets, setPets] = useState([]);
  const [petFilter, setPetFilter] = useState("all");
  const [q, setQ] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(null); // sobre a lista filtrada

  const toast = useToast();
  const confirm = useConfirm();

  const refresh = () => {
    setPhotos(loadPhotos());
    setPets(loadPets());
  };
  useEffect(() => {
    refresh();
  }, []);

  const petNameById = useMemo(() => {
    const map = new Map();
    pets.forEach((p) => map.set(Number(p.id), p.name));
    return (id) => map.get(Number(id)) || null;
  }, [pets]);

  function photoHasPet(photo, idStr) {
    const id = Number(idStr);
    if (Array.isArray(photo.petIds) && photo.petIds.length)
      return photo.petIds.some((pid) => Number(pid) === id);
    if (photo.petId != null) return Number(photo.petId) === id; // compat legado
    return false;
  }

  const filtered = useMemo(() => {
    return photos.filter((p) => {
      if (petFilter !== "all") {
        if (!photoHasPet(p, petFilter)) return false;
      }
      if (q.trim()) {
        const t = q.trim().toLowerCase();
        const cap = (p.caption || "").toLowerCase();
        const petNames = (
          Array.isArray(p.petIds) ? p.petIds : p.petId != null ? [p.petId] : []
        )
          .map((pid) => (petNameById(pid) || "").toLowerCase())
          .join(" ");
        if (!cap.includes(t) && !petNames.includes(t)) return false;
      }
      return true;
    });
  }, [photos, petFilter, q, petNameById]);

  async function onDelete(id) {
    const ok = await confirm({
      title: "Excluir foto?",
      message: "Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      variant: "danger",
    });
    if (!ok) return;
    deletePhoto(id);
    refresh();
    toast.success("Foto excluída");
  }

  function startEditCaption(photo) {
    setEditingId(photo.id);
    setEditText(photo.caption || "");
  }
  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }
  function isEditing(photo) {
    return Number(editingId) === Number(photo.id);
  }
  async function saveEdit(photo) {
    await updatePhoto(photo.id, { caption: (editText || "").trim() });
    toast.success("Legenda atualizada");
    setEditingId(null);
    setEditText("");
    refresh();
  }

  function openLightboxAt(idxInFiltered) {
    setSelectedIndex(idxInFiltered);
  }
  function closeLightbox() {
    setSelectedIndex(null);
  }
  function prevLightbox() {
    if (selectedIndex == null) return;
    const n = filtered.length;
    setSelectedIndex((selectedIndex - 1 + n) % n);
  }
  function nextLightbox() {
    if (selectedIndex == null) return;
    const n = filtered.length;
    setSelectedIndex((selectedIndex + 1) % n);
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Fotos"
        description="Gerencie as fotos da sua família e dos seus pets."
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Fotos" },
        ]}
        actions={
          <Link
            to="/dashboard/fotos/nova"
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm
                       border-slate-300 hover:bg-slate-100
                       dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Nova Foto
          </Link>
        }
      />

      <ContentCard
        title="Galeria"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por legenda ou pet…"
                className="w-56 rounded-md border pl-8 pr-3 py-1.5 text-sm outline-none
                           border-slate-300 bg-white focus:border-slate-400
                           dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-600"
              />
            </div>

            <select
              value={petFilter}
              onChange={(e) => setPetFilter(e.target.value)}
              className="rounded-md border px-3 py-1.5 text-sm outline-none
                         border-slate-300 bg-white focus:border-slate-400
                         dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-600"
            >
              <option value="all">Todos os pets</option>
              {pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        }
      >
        {filtered.length === 0 ? (
          <div className="text-sm opacity-70">Sem fotos para este filtro.</div>
        ) : (
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
            {filtered.map((ph, idx) => {
              const ids =
                Array.isArray(ph.petIds) && ph.petIds.length
                  ? ph.petIds
                  : ph.petId != null
                  ? [ph.petId]
                  : [];
              return (
                <figure
                  key={ph.id}
                  className="group relative overflow-hidden rounded-lg border
                             border-slate-200 bg-slate-50
                             dark:border-slate-800 dark:bg-slate-900/40"
                >
                  {/* imagem (clique abre lightbox) */}
                  <button
                    type="button"
                    onClick={() => openLightboxAt(idx)}
                    className="block"
                    title="Ampliar"
                  >
                    <img
                      src={ph.src}
                      alt={ph.caption || "Foto"}
                      className="h-48 w-full object-cover"
                      loading="lazy"
                    />
                  </button>

                  {/* overlay inferior */}
                  <figcaption
                    className="pointer-events-none absolute inset-x-0 bottom-0
                                         bg-gradient-to-t from-black/60 to-transparent p-2 text-xs text-white
                                         opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <div className="truncate">
                      {ph.caption || "Sem legenda"}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1 opacity-90">
                      {ids.map((pid) => (
                        <span
                          key={pid}
                          className="rounded-full bg-black/40 px-2 py-0.5"
                        >
                          {petNameById(pid) || "—"}
                        </span>
                      ))}
                      {ids.length === 0 && (
                        <span className="rounded-full bg-black/40 px-2 py-0.5">
                          Sem pet
                        </span>
                      )}
                    </div>
                  </figcaption>

                  {/* ações topo */}
                  <div className="absolute right-2 top-2 flex gap-2">
                    {!isEditing(ph) ? (
                      <>
                        <button
                          type="button"
                          onClick={() => startEditCaption(ph)}
                          title="Editar legenda"
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs
                                     border-slate-300 bg-white/90 opacity-0 shadow-sm backdrop-blur transition-opacity
                                     hover:bg-white group-hover:opacity-100
                                     dark:border-slate-700 dark:bg-slate-900/90"
                        >
                          <Pencil className="h-4 w-4" /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(ph.id)}
                          title="Excluir"
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs
                                     border-slate-300 bg-white/90 opacity-0 shadow-sm backdrop-blur transition-opacity
                                     hover:bg-white group-hover:opacity-100
                                     dark:border-slate-700 dark:bg-slate-900/90"
                        >
                          <Trash2 className="h-4 w-4" /> Excluir
                        </button>
                      </>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(ph)}
                          title="Salvar"
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs
                                     border-emerald-600 bg-emerald-600 text-white hover:opacity-90"
                        >
                          <Check className="h-4 w-4" /> Salvar
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          title="Cancelar"
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs
                                     border-slate-300 bg-white/90 hover:bg-white
                                     dark:border-slate-700 dark:bg-slate-900/90"
                        >
                          <X className="h-4 w-4" /> Cancelar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* editor inline */}
                  {isEditing(ph) && (
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2">
                      <input
                        autoFocus
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        placeholder="Editar legenda…"
                        className="w-full rounded-md border px-2 py-1 text-xs outline-none
                                   border-white/30 bg-white/90 text-slate-900"
                      />
                    </div>
                  )}
                </figure>
              );
            })}
          </div>
        )}
      </ContentCard>

      {selectedIndex != null && (
        <Lightbox
          photos={filtered}
          index={selectedIndex}
          onClose={closeLightbox}
          onPrev={prevLightbox}
          onNext={nextLightbox}
          getPetName={petNameById}
        />
      )}
    </div>
  );
}
