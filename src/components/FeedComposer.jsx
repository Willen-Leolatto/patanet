// src/components/FeedComposer.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, PawPrint } from "lucide-react";
import { addPost } from "@/features/feed/services/feedStorage";
import { loadPets, mediaGetUrl } from "@/features/pets/services/petsStorage";

export default function FeedComposer({ user }) {
  const [text, setText] = useState("");
  const [images, setImages] = useState([]); // dataURLs
  const [taggedPets, setTaggedPets] = useState([]); // ids de pets marcados

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

  function onPickFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    Promise.all(
      files.map(
        (f) =>
          new Promise((res, rej) => {
            const fr = new FileReader();
            fr.onload = () => res(fr.result);
            fr.onerror = rej;
            fr.readAsDataURL(f);
          })
      )
    )
      .then((arr) => setImages((g) => [...g, ...arr]))
      .catch(() => {});
  }

  function togglePet(pid) {
    setTaggedPets((list) =>
      list.includes(pid) ? list.filter((x) => x !== pid) : [...list, pid]
    );
  }

  function canPost() {
    return user && (text.trim().length > 0 || images.length > 0);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!canPost()) return;

    const author = {
      id: user.id || user.uid || user.email || user.username,
      username: user.username || "",
      name: user.name || "",
      email: user.email || "",
      avatar: user.image || user.avatar || user.photoURL || "",
    };

    addPost(author, text, images, taggedPets);
    setText("");
    setImages([]);
    setTaggedPets([]);
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
