// src/features/users/pages/UsersList.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchUsersProfile } from "@/api/user.api.js";
import {
  Users as UsersIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
} from "lucide-react";

/** Avatar seguro em formato circular (com fallback) */
function Avatar({ src, alt, size = 64, className = "" }) {
  if (!src) {
    return (
      <div
        className={`grid place-items-center rounded-full bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300 ${className}`}
        style={{ width: size, height: size }}
      >
        <UserIcon className="h-6 w-6" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`rounded-full object-cover ring-2 ring-white/70 dark:ring-zinc-900/70 ${className}`}
      style={{ width: size, height: size }}
      loading="lazy"
    />
  );
}

/** Cartão individual do usuário */
function UserCard({ user }) {
  const cover = user?.imageCover || "";
  const avatar = user?.image || "";
  const username = user?.username || "usuário";
  const name =
    user?.displayName || user?.name || (user?.email ?? "").split("@")[0];

  // placeholder enquanto a API não envia a contagem
  const petsCount = user?.petsCount ?? 0; // manter estático (0) por ora

  return (
    <Link
      to={`/usuario/${user.id}`}
      className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Capa */}
      <div className="relative aspect-[4/1.8] w-full bg-gradient-to-r from-amber-200 to-orange-300 dark:from-amber-800 dark:to-orange-800">
        {cover && (
          <img
            src={cover}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        )}
        {/* Avatar flutuante */}
        <div className="absolute left-4 bottom-[-28px]">
          <Avatar src={avatar} alt={name} size={64} />
        </div>
      </div>

      {/* Corpo */}
      <div className="px-4 pb-4 pt-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold leading-none">
                @{username}
              </span>
            </div>
            <div className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
              {name}
            </div>
          </div>

          {/* Métrica de pets (placeholder até vir da API) */}
          <div className="shrink-0 rounded-lg border border-zinc-200 px-2 py-1 text-center text-[11px] dark:border-zinc-700">
            <div className="font-semibold">{petsCount}</div>
            <div className="opacity-70">pets</div>
          </div>
        </div>

        {/* Sobre (opcional, discreto) */}
        {user?.about && (
          <p className="mt-3 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-300">
            {user.about}
          </p>
        )}
      </div>
    </Link>
  );
}

/** Página de listagem de usuários */
export default function UsersList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  // controles
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [order, setOrder] = useState(searchParams.get("o") || "AZ"); // "AZ" | "ZA"
  const [page, setPage] = useState(Number(searchParams.get("p") || 1));
  const [perPage] = useState(12);
  const [pages, setPages] = useState(1);

  // debounce para busca
  const typingRef = useRef(null);
  useEffect(() => {
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => {
      setPage(1); // reset pag ao buscar
      setSearchParams((sp) => {
        const next = new URLSearchParams(sp);
        if (query) next.set("q", query);
        else next.delete("q");
        next.set("o", order);
        next.set("p", "1");
        return next;
      });
    }, 350);
    return () => clearTimeout(typingRef.current);
  }, [query, order, setSearchParams]);

  // carrega usuários da API
  useEffect(() => {
    let cancel = false;
    async function run() {
      setLoading(true);
      try {
        const resp = await fetchUsersProfile({
          query: query || undefined,
          page,
          perPage,
        });
        // Estrutura esperada: { data: [...], pagination?: { pages, total, page } }
        const list = Array.isArray(resp?.data) ? resp.data : [];
        const pag = resp?.pagination || {};
        const nextPages =
          Number(pag.pages) ||
          (Number(pag.total)
            ? Math.max(1, Math.ceil(Number(pag.total) / perPage))
            : 1);

        if (!cancel) {
          setUsers(list);
          setPages(nextPages || 1);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    run();
    return () => {
      cancel = true;
    };
  }, [page, perPage, query]);

  // ordenação local (AZ / ZA) por username (fallback para name)
  const sortedUsers = useMemo(() => {
    const clone = users.slice();
    const keyOf = (u) =>
      (u?.username || u?.displayName || u?.name || "").toString().toLowerCase();
    clone.sort((a, b) => {
      const ka = keyOf(a);
      const kb = keyOf(b);
      if (order === "ZA") return kb.localeCompare(ka, "pt-BR");
      return ka.localeCompare(kb, "pt-BR");
    });
    return clone;
  }, [users, order]);

  // paginação simples
  const canPrev = page > 1;
  const canNext = page < pages;

  const goPrev = () => {
    if (!canPrev) return;
    const next = page - 1;
    setPage(next);
    setSearchParams((sp) => {
      const n = new URLSearchParams(sp);
      n.set("p", String(next));
      if (query) n.set("q", query);
      if (order) n.set("o", order);
      return n;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goNext = () => {
    if (!canNext) return;
    const next = page + 1;
    setPage(next);
    setSearchParams((sp) => {
      const n = new URLSearchParams(sp);
      n.set("p", String(next));
      if (query) n.set("q", query);
      if (order) n.set("o", order);
      return n;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
      {/* Cabeçalho */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-sm font-semibold opacity-80">
          <UsersIcon className="h-5 w-5" />
          Explorar usuários
        </div>

        {/* Filtros compactos */}
        <div className="flex w-full max-w-lg items-center gap-2">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome de usuário…"
              className="w-full rounded-lg border border-zinc-300 bg-white pl-8 pr-3 pt-[9px] pb-[9px] text-sm outline-none placeholder:text-zinc-400 focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <select
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-900"
            title="Ordenar"
          >
            <option value="AZ">A–Z</option>
            <option value="ZA">Z–A</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading && users.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`s-${i}`}
              className="h-48 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          Nenhum usuário encontrado.
        </div>
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedUsers.map((u) => (
              <li key={u.id}>
                <UserCard user={u} />
              </li>
            ))}
          </ul>

          {/* Paginação */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={goPrev}
              disabled={!canPrev}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </button>
            <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
              Página <span className="font-semibold">{page}</span>{" "}
              <span className="opacity-70">/ {pages}</span>
            </div>
            <button
              onClick={goNext}
              disabled={!canNext}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
            >
              Próxima <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
