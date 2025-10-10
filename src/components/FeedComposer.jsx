// src/components/FeedComposer.jsx
import React, { useEffect, useMemo, useState } from "react";
import { ImagePlus, PawPrint } from "lucide-react";
// Removidos: addPost (storage local)
import { loadPets, mediaGetUrl } from "@/features/pets/services/petsStorage";
// API real
import { createPost } from "@/api/post.api.js";

export default function FeedComposer({ user }) {
  const [text, setText] = useState("");
  const [images, setImages] = useState([]); // dataURLs (para UI)
  const [files, setFiles] = useState([]);   // File[] (para API)
  const [taggedPets, setTaggedPets] = useState([]); // ids de pets marcados
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // todos os ids possíveis do usuário (cobre contas antigas)
  const myIds = useMemo(
    () =>
      [user?.id, user?.uid, user?.email, user?.username]
        .filter(Boolean)
        .map(String),
    [user]
  );

  const [allPets, setAllPets] = useState([]);
  const [petThumbs, setPetThumbs] = useState({}); // { [petId]: { name, avatarUrl } }

  // Carrega pets e revalida quando atualizar no sistema
  useEffect(() => {
    const refresh = () => setAllPets(loadPets() || []);
    refresh();
    window.addEventListener("patanet:pets-updated", refresh);
    return () => window.removeEventListener("patanet:pets-updated", refresh);
  }, []);

  // Filtra apenas os pets do usuário logado (compatível com registros antigos)
  const myPets = useMemo(() => {
    if (!myIds.length) return [];
    return (allPets || []).filter((p) => {
      const owner = p.ownerId || p.userId || p.createdBy;
      return owner && myIds.includes(String(owner));
    });
  }, [allPets, myIds]);

  // Resolve avatar do pet (avatarId -> blob) com fallback para cover
  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      const pairs = await Promise.all(
        myPets.map(async (p) => {
          let avatarUrl = p.avatar || "";
          if (!avatarUrl && p.avatarId) {
            try {
              avatarUrl = await mediaGetUrl(p.avatarId);
            } catch {
              avatarUrl = "";
            }
          }
          if (!avatarUrl) {
            let coverUrl = p.cover || "";
            if (!coverUrl && p.coverId) {
              try {
                coverUrl = await mediaGetUrl(p.coverId);
              } catch {
                coverUrl = "";
              }
            }
            avatarUrl = coverUrl || "";
          }
          return [p.id, { name: p.name || "Pet", avatarUrl }];
        })
      );
      if (!cancelled) {
        const map = {};
        for (const [id, meta] of pairs) map[id] = meta;
        setPetThumbs(map);
      }
    }
    resolve();
    return () => {
      cancelled = true;
      Object.values(petThumbs).forEach(({ avatarUrl }) => {
        if (avatarUrl && avatarUrl.startsWith?.("blob:")) {
          try {
            URL.revokeObjectURL(avatarUrl);
          } catch {}
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPets.length]);

  // utils
  function dataUrlToFile(dataUrl, name = "media.jpg") {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1] || "");
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], name, { type: mime });
  }

  function onPickFiles(e) {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    // Previews (dataURL) para UI
    Promise.all(
      selected.map(
        (f) =>
          new Promise((res, rej) => {
            const fr = new FileReader();
            fr.onload = () => res(fr.result);
            fr.onerror = rej;
            fr.readAsDataURL(f);
          })
      )
    )
      .then((arr) => {
        setImages((g) => [...g, ...arr]);
        setFiles((g) => [...g, ...selected]);
      })
      .catch(() => {});
  }

  function togglePet(pid) {
    setTaggedPets((list) =>
      list.includes(pid) ? list.filter((x) => x !== pid) : [...list, pid]
    );
  }

  function canPost() {
    return user && !sending && (text.trim().length > 0 || images.length > 0);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canPost()) return;

    setSending(true);
    setError("");

    try {
      // Se o usuário só anexou imagens via preview (arrastar ou outra origem),
      // garantimos que também temos Files (fallback: converter dataURL -> File)
      let medias = files.slice();
      if (medias.length === 0 && images.length > 0) {
        medias = images.map((d, i) => dataUrlToFile(d, `media_${i + 1}.jpg`));
      }

      await createPost({
        subtitle: String(text || ""),
        pets: taggedPets.map(String),
        medias, // File[]
      });

      // Limpa o formulário
      setText("");
      setImages([]);
      setFiles([]);
      setTaggedPets([]);

      // Notifica o Feed para recarregar a página 1
      window.dispatchEvent(new CustomEvent("patanet:feed-new-post"));
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Não foi possível publicar.";
      setError(String(msg));
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <textarea
        className="w-full resize-none rounded-lg border border-zinc-300 bg-white/80 p-3 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800/60"
        rows={3}
        placeholder="Compartilhe algo com a comunidade…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {/* Galeria prévia */}
      {!!images.length && (
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
          {images.map((src, i) => (
            <div key={i} className="overflow-hidden rounded-xl">
              <img
                src={src || null}
                alt=""
                className="aspect-video w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Seleção de pets (aparece se o usuário tem pets) */}
      {myPets.length > 0 ? (
        <div className="mt-3">
          <div className="mb-1 inline-flex items-center gap-2 text-xs font-medium opacity-80">
            <PawPrint className="h-4 w-4" />
            Marcar pets (opcional)
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
            {myPets.map((p) => {
              const active = taggedPets.includes(p.id);
              const src = petThumbs[p.id]?.avatarUrl || undefined;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePet(p.id)}
                  title={petThumbs[p.id]?.name || p.name || "Pet"}
                  className={`group inline-flex items-center gap-2 rounded-full px-2 py-1 ring-1 text-xs transition ${
                    active
                      ? "bg-[#f77904] text-white ring-[#f77904]"
                      : "bg-zinc-50 ring-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:ring-zinc-700"
                  }`}
                >
                  <PetChipAvatar src={src} />
                  <span className="pr-1">{p.name || "Pet"}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        // não bloqueia o post — só informa
        <div className="mt-3 rounded-lg border border-dashed border-zinc-300 p-3 text-xs text-zinc-500 dark:border-zinc-700">
          Você ainda não marcou pets neste dispositivo. Cadastre seus pets em{" "}
          <span className="font-medium">Meus Pets</span> para poder marcá-los
          nas postagens (opcional).
        </div>
      )}

      {/* Ações */}
      <div className="mt-3 flex items-center justify-between">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800">
          <ImagePlus className="h-4 w-4" />
          Adicionar mídia
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onPickFiles}
            className="hidden"
          />
        </label>

        <button
          type="submit"
          disabled={!canPost()}
          className="rounded-lg bg-[#f77904] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          Publicar
        </button>
      </div>

      {!!error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}
    </form>
  );
}

function PetChipAvatar({ src }) {
  if (!src) {
    return (
      <span className="inline-block h-6 w-6 rounded-full bg-zinc-300 dark:bg-zinc-700" />
    );
  }
  return (
    <img
      src={src || undefined}
      alt=""
      className="h-6 w-6 rounded-full object-cover ring-1 ring-white dark:ring-zinc-900"
    />
  );
}
