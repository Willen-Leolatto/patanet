// src/features/pets/pages/PetCreate.jsx
import React, { useMemo, useRef, useState } from "react";
import {
  addPet,
  getBreedsBySpecies,
  getBreedById,
  mediaSaveBlob,
} from "@/features/pets/services/petsStorage";
import { useAuth } from "@/store/auth.jsx";

/* --------------------------------- estilo -------------------------------- */
const Styles = () => (
  <style>{`
    .pc-pill[data-active="true"]{
      box-shadow: 0 0 0 6px rgba(255,147,62,.28), 0 6px 18px rgba(255,147,62,.30);
    }
    .pc-range{ -webkit-appearance:none; width:100%; height:6px; border-radius:9999px;
      background:linear-gradient(90deg, rgba(255,147,62,.9), rgba(255,147,62,.5)); outline:none }
    .pc-range::-webkit-slider-thumb{ -webkit-appearance:none; height:22px; width:22px; border-radius:50%;
      background:#fff; border:none; cursor:pointer;
      box-shadow:0 2px 8px rgba(0,0,0,.25), 0 0 0 3px rgba(255,147,62,.55) }
    .dark .pc-range::-webkit-slider-thumb{ background:#0a0a0a;
      box-shadow:0 2px 8px rgba(0,0,0,.45), 0 0 0 3px rgba(255,147,62,.6) }
    .pc-range::-moz-range-track{ height:6px; background:linear-gradient(90deg, rgba(255,147,62,.9), rgba(255,147,62,.5));
      border-radius:9999px }
    .pc-range::-moz-range-thumb{ height:22px; width:22px; border:none; border-radius:50%; background:#fff;
      box-shadow:0 2px 8px rgba(0,0,0,.25), 0 0 0 3px rgba(255,147,62,.55) }
  `}</style>
);

/* --------------------------------- UI ------------------------------------ */
const Pill = ({ active, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    data-active={active ? "true" : "false"}
    className="
      pc-pill inline-flex items-center gap-2 rounded-full px-4 h-9 text-sm font-medium
      transition-all duration-300 bg-orange-500 text-white shadow-sm hover:bg-orange-600
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400
    "
  >
    {children}
  </button>
);

const Card = ({ className = "", children, ...rest }) => (
  <section
    {...rest}
    className={`rounded-2xl shadow-lg bg-[color-mix(in_oklab,canvas,black_6%)]
      dark:bg-[color-mix(in_oklab,canvas,white_6%)] backdrop-blur-sm ${className}`}
  >
    {children}
  </section>
);

const BreedTile = ({ breed, active, onClick }) => {
  const cover = breed?.image;
  return (
    <button
      type="button"
      title={breed?.name}
      onClick={onClick}
      data-active={active ? "true" : "false"}
      className="
        group relative overflow-hidden rounded-xl w-full aspect-[4/3]
        ring-1 ring-black/5 dark:ring-white/5 hover:ring-orange-400/50
        transition-all duration-300
        data-[active=true]:ring-2 data-[active=true]:ring-orange-500
        data-[active=true]:shadow-[0_0_0_6px_rgba(255,147,62,.25)]
        bg-neutral-100 dark:bg-neutral-900
      "
    >
      {!!cover && (
        <img
          src={cover}
          alt={breed?.name}
          className="
            absolute inset-0 h-full w-full object-cover
            transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]
            group-hover:scale-[1.05]
            data-[active=true]:scale-[1.02]
            data-[active=true]:brightness-110 data-[active=true]:saturate-125
          "
        />
      )}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
      <div className="absolute left-0 right-0 bottom-0 px-3 pb-2 flex items-end justify-between">
        <span className="text-white/95 font-semibold drop-shadow-sm">
          {breed?.name}
        </span>
        {active && (
          <span className="ml-2 rounded-full bg-orange-500 px-2 py-0.5 text-[11px] text-white shadow">
            selecionado
          </span>
        )}
      </div>
    </button>
  );
};

/* --------------------------------- Página --------------------------------- */
export default function PetCreate() {
  const auth = useAuth();
  const currentUserId =
    auth.user?.id ||
    auth.user?.uid ||
    auth.user?.email ||
    auth.user?.username ||
    "me";

  // básicos
  const [species, setSpecies] = useState("cão"); // cão | gato (armazenamos "Cachorro"/"Gato")
  const [sex, setSex] = useState("fêmea");
  const [size, setSize] = useState("médio");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const [weightUnit, setWeightUnit] = useState("kg");
  const [weight, setWeight] = useState(8.5);
  const [birth, setBirth] = useState("");
  const [adoption, setAdoption] = useState("");

  // raça
  const storageSpecies = species === "gato" ? "Gato" : "Cachorro";
  const [query, setQuery] = useState("");
  const breeds = useMemo(
    () =>
      (getBreedsBySpecies(storageSpecies) || []).filter((b) =>
        b.name.toLowerCase().includes(query.toLowerCase())
      ),
    [storageSpecies, query]
  );
  const [breed, setBreed] = useState(null);
  const breedInfo = useMemo(() => {
    if (!breed) return null;
    const b = getBreedById(breed.id);
    if (!b) return null;
    return {
      suggestedSize: b.suggestedSize || "",
      weightRange: b.weightTip || "",
      heightRange: b.heightTip || "",
      life: b.lifespan || "",
      description: b.description || "",
      appearance: b.appearance || "",
      temperament: b.temperament || "",
      trainability: b.trainability || "",
      exercise: b.exercise || "",
      coat: b.grooming || "",
      health: b.healthNotes || "",
    };
  }, [breed]);

  // Avatar e Capa (ambos via IndexedDB) + previews
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [avatarId, setAvatarId] = useState("");
  const [coverId, setCoverId] = useState("");

  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    try {
      setAvatarPreview(URL.createObjectURL(file));
      const id = await mediaSaveBlob(file);
      setAvatarId(id);
    } catch (err) {
      console.error("Falha ao salvar avatar no IndexedDB", err);
      alert("Não foi possível processar a imagem de perfil. Tente novamente.");
      setAvatarPreview("");
      setAvatarId("");
    } finally {
      e.target.value = "";
    }
  };

  const onPickCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    try {
      setCoverPreview(URL.createObjectURL(file));
      const id = await mediaSaveBlob(file);
      setCoverId(id);
    } catch (err) {
      console.error("Falha ao salvar capa no IndexedDB", err);
      alert("Não foi possível processar a imagem de capa. Tente novamente.");
      setCoverPreview("");
      setCoverId("");
    } finally {
      e.target.value = "";
    }
  };

  // peso exibido
  const sliderValue = useMemo(() => {
    if (weightUnit === "kg") return weight;
    return Math.round(weight * 2.20462 * 10) / 10;
  }, [weight, weightUnit]);
  const sliderValueKg =
    weightUnit === "kg"
      ? weight
      : Math.round((weight / 2.20462) * 10) / 10;

  // submit
  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: (name || "").trim() || "Sem nome",
        species: storageSpecies, // "Cachorro" | "Gato"
        breed: breed?.name || "",
        gender: sex,
        size,
        weight: Number(sliderValueKg),
        birthday: birth || "",
        adoption: adoption || "",
        description: desc || "",

        // ⚠️ Não persistimos DataURL no localStorage
        avatar: "", // sempre string vazia (quando usar avatarId)
        avatarId: avatarId || "",

        // Capa: prioriza coverId (upload do usuário); se não houver,
        // usa imagem "leve" da raça como cover (URL pública).
        coverId: coverId || "",
        cover: coverId ? "" : (breed?.image || ""),

        media: [], // galeria será gerida em PetDetail
        ownerId: currentUserId,
        createdAt: Date.now(),
      };

      addPet(payload);
      history.back();
    } catch (err) {
      if (String(err?.message) === "LOCAL_STORAGE_QUOTA_EXCEEDED") {
        alert(
          "Seu armazenamento local ficou cheio.\n" +
            "Remova Pets ou fotos antigas, reduza o tamanho das imagens, " +
            "ou migre para a versão com backend quando estiver disponível."
        );
      } else {
        alert("Não foi possível salvar o pet. Tente novamente.");
      }
      console.error(err);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-[1200px] px-4 py-8 space-y-8">
      <Styles />

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Adicionar novo Pet</h1>
          <p className="text-sm opacity-70">
            Preencha as informações principais do seu companheiro.
          </p>
        </div>
      </header>

      {/* Identificação + Avatar e Capa */}
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] items-start gap-6">
          {/* Avatar + Capa */}
          <div className="flex flex-col items-center gap-6">
            {/* Avatar */}
            <div className="relative w-24 h-24 rounded-full overflow-hidden ring-2 ring-white/10 shadow-md">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-xs text-white/70 bg-white/5">
                  sem avatar
                </div>
              )}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 grid place-items-center text-[11px] font-medium text-white/90 bg-black/40 opacity-0 hover:opacity-100 transition"
                title="Trocar avatar"
              >
                trocar avatar
              </button>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickAvatar}
            />

            {/* Capa */}
            <div className="relative w-44 h-28 rounded-xl overflow-hidden ring-2 ring-white/10 shadow-md">
              {coverPreview || breed?.image ? (
                <img
                  src={coverPreview || breed?.image}
                  alt="capa"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-xs text-white/70 bg-white/5">
                  sem capa
                </div>
              )}
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="absolute inset-0 grid place-items-center text-[11px] font-medium text-white/90 bg-black/40 opacity-0 hover:opacity-100 transition"
                title="Trocar capa"
              >
                trocar capa
              </button>
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickCover}
            />
          </div>

          {/* Infos do Pet */}
          <div className="space-y-2">
            <label className="text-xs font-medium opacity-70">Nome do pet</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Max, Nina, Mimi…"
              className="h-10 w-full rounded-lg px-3 ring-1 ring-black/10 dark:ring-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />

            <div className="flex flex-wrap gap-2 pt-1">
              <Pill active={species === "cão"} onClick={() => setSpecies("cão")}>
                Cão
              </Pill>
              <Pill active={species === "gato"} onClick={() => setSpecies("gato")}>
                Gato
              </Pill>
              <span className="mx-1 opacity-30">|</span>
              <Pill active={sex === "fêmea"} onClick={() => setSex("fêmea")}>
                Fêmea
              </Pill>
              <Pill active={sex === "macho"} onClick={() => setSex("macho")}>
                Macho
              </Pill>
              <span className="mx-1 opacity-30">|</span>
              <Pill active={size === "pequeno"} onClick={() => setSize("pequeno")}>
                Pequeno
              </Pill>
              <Pill active={size === "médio"} onClick={() => setSize("médio")}>
                Médio
              </Pill>
              <Pill active={size === "grande"} onClick={() => setSize("grande")}>
                Grande
              </Pill>
            </div>
          </div>
        </div>
      </Card>

      {/* Raça + Sobre a raça */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 sm:p-6 lg:col-span-2">
          <div className="mb-4">
            <h3 className="font-semibold">Raça</h3>
            <div className="mt-3">
              <label className="text-xs font-medium opacity-70">Buscar raça</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Buscar raça de ${species}…`}
                className="mt-1 h-10 w-full rounded-lg px-3 ring-1 ring-black/10 dark:ring-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {breeds.map((b) => (
              <BreedTile
                key={b.id}
                breed={b}
                active={breed?.id === b.id}
                onClick={() => setBreed(b)}
              />
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <h3 className="font-semibold mb-3">Sobre a raça</h3>
          {breedInfo ? (
            <div className="space-y-3 text-sm leading-relaxed">
              <p className="opacity-80">{breedInfo.description}</p>

              <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3">
                <h4 className="font-medium mb-2">Aparência</h4>
                <p className="opacity-80">{breedInfo.appearance}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3">
                  <h4 className="font-medium mb-1">Temperamento</h4>
                  <p className="opacity-80">{breedInfo.temperament}</p>
                </div>
                <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3">
                  <h4 className="font-medium mb-1">Treinabilidade</h4>
                  <p className="opacity-80">{breedInfo.trainability}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3">
                  <h4 className="font-medium mb-1">Exercício</h4>
                  <p className="opacity-80">{breedInfo.exercise}</p>
                </div>
                <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3">
                  <h4 className="font-medium mb-1">Pelagem</h4>
                  <p className="opacity-80">{breedInfo.coat}</p>
                </div>
              </div>

              <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3">
                <h4 className="font-medium mb-1">Saúde</h4>
                <p className="opacity-80">{breedInfo.health}</p>
              </div>
            </div>
          ) : (
            <p className="opacity-60 text-sm">Selecione uma raça para ver detalhes.</p>
          )}
        </Card>
      </div>

      {/* Medidas & datas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 sm:p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4">Medidas & datas</h3>

          {/* Peso */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Peso</label>
              <div className="flex gap-1 rounded-lg ring-1 ring-black/10 dark:ring-white/10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setWeightUnit("kg")}
                  className={`px-2 py-1 text-sm ${
                    weightUnit === "kg"
                      ? "bg-orange-500 text-white"
                      : "hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  kg
                </button>
                <button
                  type="button"
                  onClick={() => setWeightUnit("lb")}
                  className={`px-2 py-1 text-sm ${
                    weightUnit === "lb"
                      ? "bg-orange-500 text-white"
                      : "hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  lb
                </button>
              </div>
            </div>

            <div className="mt-3 rounded-xl p-4 bg-black/5 dark:bg-white/5">
              <div className="text-4xl font-semibold">
                {sliderValue}
                <span className="text-lg font-normal opacity-70 ml-1">
                  {weightUnit}
                </span>
              </div>

              <input
                type="range"
                min={weightUnit === "kg" ? 1 : 2.2}
                max={weightUnit === "kg" ? 80 : 176}
                step={weightUnit === "kg" ? 0.1 : 0.2}
                value={weightUnit === "kg" ? weight : weight * 2.20462}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (weightUnit === "kg") setWeight(v);
                  else setWeight(Math.round((v / 2.20462) * 10) / 10);
                }}
                className="pc-range mt-3 w-full"
              />
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium opacity-70">
                Data de nascimento
              </label>
              <input
                type="date"
                value={birth}
                onChange={(e) => setBirth(e.target.value)}
                className="h-10 w-full rounded-lg px-3 ring-1 ring-black/10 dark:ring-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium opacity-70">
                Data de adoção
              </label>
              <input
                type="date"
                value={adoption}
                onChange={(e) => setAdoption(e.target.value)}
                className="h-10 w-full rounded-lg px-3 ring-1 ring-black/10 dark:ring-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>
        </Card>

        {/* Sugestões */}
        <Card className="p-4 sm:p-6">
          <h3 className="font-semibold mb-3">Sugestões da raça</h3>
          {breedInfo ? (
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between rounded-lg bg-black/5 dark:bg-white/5 px-3 py-2">
                <dt className="opacity-70">Porte sugerido</dt>
                <dd className="font-medium">{breedInfo.suggestedSize}</dd>
              </div>
              <div className="flex justify-between rounded-lg bg-black/5 dark:bg-white/5 px-3 py-2">
                <dt className="opacity-70">Peso típico</dt>
                <dd className="font-medium">{breedInfo.weightRange}</dd>
              </div>
              <div className="flex justify-between rounded-lg bg-black/5 dark:bg-white/5 px-3 py-2">
                <dt className="opacity-70">Altura típica</dt>
                <dd className="font-medium">{breedInfo.heightRange}</dd>
              </div>
              <div className="flex justify-between rounded-lg bg-black/5 dark:bg-white/5 px-3 py-2">
                <dt className="opacity-70">Expectativa de vida</dt>
                <dd className="font-medium">{breedInfo.life}</dd>
              </div>
            </dl>
          ) : (
            <p className="opacity-60 text-sm">Selecione uma raça.</p>
          )}
        </Card>
      </div>

      {/* Sobre o pet */}
      <Card className="p-4 sm:p-6">
        <h3 className="font-semibold mb-3">Sobre o pet</h3>
        <textarea
          rows={4}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Conte um pouco sobre a aparência e o jeitinho dele(a)…"
          className="w-full rounded-xl p-3 ring-1 ring-black/10 dark:ring-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </Card>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => history.back()}
          className="h-10 px-4 rounded-lg ring-1 ring-black/10 dark:ring-white/10 hover:bg-black/5 dark:hover:bg-white/5"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="h-10 px-5 rounded-lg bg-orange-500 text-white shadow hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          Confirmar
        </button>
      </div>
    </form>
  );
}
