// src/components/FeedComposer.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { ImagePlus, PawPrint } from "lucide-react";
// (mantive a UI/fluxo igual; se quiser, depois trocamos pets para API)
import { loadPets, mediaGetUrl } from "@/features/pets/services/petsStorage";
import { createPost } from "@/api/post.api.js";
import { getMyProfile } from "@/api/user.api.js";
import { fetchAnimalsByOwner } from "@/api/owner.api.js";
import { fetchAnimalsById } from "@/api/animal.api.js";

/* ---------- utils: compressão igual ao registro ---------- */
async function compressImage(
  file,
  { maxW = 1600, maxH = 1600, quality = 0.85 } = {}
) {
  if (!(file instanceof File)) return file;
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  const ratio = Math.min(maxW / width, maxH / height, 1);
  const w = Math.round(width * ratio);
  const h = Math.round(height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, w, h);

  const blob = await new Promise((res) =>
    canvas.toBlob(res, "image/jpeg", quality)
  );
  if (!blob) return file;
  return new File(
    [blob],
    file.name.replace(/\.(png|webp|gif|heic|heif)$/i, ".jpg"),
    { type: "image/jpeg" }
  );
}

function dataUrlToFile(dataUrl, name = "media.jpg") {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1] || "");
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], name, { type: mime });
}

export default function FeedComposer({ user }) {
  const [text, setText] = useState("");
  const [images, setImages] = useState([]); // dataURLs (UI)
  const [files, setFiles] = useState([]); // File[] (API)
  const [taggedPets, setTaggedPets] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // ids possíveis do usuário
  const [me, setMe] = useState(null);
  const [pets, setPets] = useState([]);
  const [petThumbs, setPetThumbs] = useState({});

  // Carrega pets (mesmo layout/fluxo)
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

  // Carrega pets do dono autenticado
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!me?.id) {
        setPets([]);
        return;
      }
      try {
        const resp = await fetchAnimalsByOwner({
          userId: me.id,
          page: 1,
          perPage: 100,
        });
        const list = Array.isArray(resp?.data)
          ? resp.data
          : Array.isArray(resp)
          ? resp
          : [];
        if (cancel) return;
        // mapeia campos principais
        setPets(
          list.map((p) => ({
            id: p.id || p._id,
            name: p.name || "Pet",
            image: p.image?.url || p.image || "", // avatar do pet (se houver)
            imageCover: p.imageCover?.url || p.imageCover || "",
            breedImage: p.breed?.image || "", // fallback: imagem da raça
          }))
        );
      } catch {
        if (!cancel) setPets([]);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [me?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pairs = await Promise.all(
        pets.map(async (p) => {
          let avatarUrl = p.image || p.breedImage || p.imageCover || "";
          if (!avatarUrl) {
            try {
              const full = await fetchAnimalsById({ animalId: p.id });
              avatarUrl =
                full?.image?.url ||
                full?.image ||
                full?.breed?.image ||
                full?.imageCover ||
                "";
            } catch {}
          }
          return [p.id, { name: p.name || "Pet", avatarUrl }];
        })
      );
      if (!cancelled) {
        const map = {};
        for (const [id, meta] of pairs) map[id] = meta;
        setPetThumbs(map);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pets]);

  async function onPickFiles(e) {
    const selected = Array.from(e.target.files || []);
    e.target.value = ""; // permite selecionar o mesmo arquivo novamente
    if (!selected.length) return;

    // Compressão + previews
    const previews = [];
    const compressed = [];
    for (const f of selected) {
      const cf = await compressImage(f);
      compressed.push(cf);
      previews.push(
        await new Promise((res, rej) => {
          const fr = new FileReader();
          fr.onload = () => res(fr.result);
          fr.onerror = rej;
          fr.readAsDataURL(cf);
        })
      );
    }

    setImages((g) => [...g, ...previews]);
    setFiles((g) => [...g, ...compressed]);
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
      // Garante Files (se só houver dataURL)
      let medias = files.slice();
      if (medias.length === 0 && images.length > 0) {
        medias = images.map((d, i) => dataUrlToFile(d, `media_${i + 1}.jpg`));
      }

      // Chamada de criação
      const created = await createPost({
        subtitle: String(text || ""),
        pets: taggedPets.map(String),
        medias, // File[]
      });

      // Limpa o formulário
      setText("");
      setImages([]);
      setFiles([]);
      setTaggedPets([]);

      // Notifica o Feed para atualizar imediatamente
      // Se a API retornar o post criado, enviamos no detail.
      window.dispatchEvent(
        new CustomEvent("patanet:feed-new-post", { detail: created })
      );
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

      {/* Seleção de pets (opcional) */}
      {pets.length > 0 ? (
        <div className="mt-3">
          <div className="mb-1 inline-flex items-center gap-2 text-xs font-medium opacity-80">
            <PawPrint className="h-4 w-4" />
            Marcar pets (opcional)
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
            {pets.map((p) => {
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
