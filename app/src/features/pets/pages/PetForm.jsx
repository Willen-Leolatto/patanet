// src/features/pets/pages/PetForm.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// APIs reais (apenas consumo)
import { fetchAnimalsById, createAnimal, updateAnimal } from "@/api/animal.api.js";
import { fetchSpecies } from "@/api/specie.api.js";
import { fetchBreeds } from "@/api/breed.api.js";

const INPUT =
  "w-full rounded-md border px-3 py-2 text-sm outline-none " +
  "border-slate-300 focus:border-orange-400 " +
  "dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-600";

export default function PetForm() {
  const nav = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);

  // species/breeds
  const [speciesList, setSpeciesList] = useState([]);
  const [speciesUI, setSpeciesUI] = useState("Cachorro"); // "Cachorro" | "Gato" (mantém layout/label)
  const [specieId, setSpecieId] = useState(null);
  const [breeds, setBreeds] = useState([]);
  const [breedQuery, setBreedQuery] = useState("");

  const [form, setForm] = useState({
    name: "",
    species: "Cachorro",
    breed: "",
    breedId: "",
    gender: "Macho",
    size: "Médio",
    weight: "",
    birthdate: "",
    adoptionDate: "",
    notes: "",
    avatar: "",
  });

  const fileRef = useRef(null);
  const [avatarFile, setAvatarFile] = useState(null);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  /* ---------------------------- carregar species ---------------------------- */
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const resp = await fetchSpecies({ page: 1, perPage: 100 });
        const list =
          (resp && Array.isArray(resp.data) && resp.data) ||
          (Array.isArray(resp) && resp) ||
          (resp && Array.isArray(resp.items) && resp.items) ||
          [];
        if (!cancel) setSpeciesList(list);
      } catch {
        if (!cancel) setSpeciesList([]);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  // map UI ("Cachorro"/"Gato") -> specieId
  useEffect(() => {
    const wanted =
      speciesUI.toLowerCase() === "gato"
        ? ["gato", "felino", "cat"]
        : ["cachorro", "cão", "cao", "dog", "canino"];
    const found =
      speciesList.find((s) =>
        wanted.includes(String(s.name || s.title || "").toLowerCase())
      ) || null;
    setSpecieId(found?.id || null);
    setForm((f) => ({ ...f, species: speciesUI }));
    // reset de raça ao trocar espécie
    setForm((f) => ({ ...f, breed: "", breedId: "" }));
  }, [speciesUI, speciesList]);

  // buscar breeds conforme specieId e texto
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!specieId) {
        setBreeds([]);
        return;
      }
      try {
        const resp = await fetchBreeds({
          specieId,
          query: breedQuery || undefined,
          page: 1,
          perPage: 100,
        });
        const list =
          (resp && Array.isArray(resp.data) && resp.data) ||
          (Array.isArray(resp) && resp) ||
          (resp && Array.isArray(resp.items) && resp.items) ||
          [];
        if (!cancel) setBreeds(list);
      } catch {
        if (!cancel) setBreeds([]);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [specieId, breedQuery]);

  /* ------------------------------ editar: carregar pet ------------------------------ */
  const current = useMemo(() => (editing ? { id } : null), [editing, id]);

  useEffect(() => {
    let cancel = false;
    if (!editing) return;
    (async () => {
      try {
        const full = await fetchAnimalsById({ animalId: id });
        const a = full?.data || full || {};
        if (cancel) return;

        const uiSpecies = (() => {
          const s = String(a.species || a.specie || "").toLowerCase();
          if (["gato", "felino", "cat"].includes(s)) return "Gato";
          return "Cachorro";
        })();

        setSpeciesUI(uiSpecies);

        setForm({
          name: a.name || "",
          species: uiSpecies,
          breed: a?.breed?.name || a.breed || "",
          breedId: a?.breed?.id || a.breedId || "",
          gender: a.gender || "Macho",
          size: a.size || "Médio",
          weight: a.weight ?? "",
          birthdate: a.birthday || a.birthDate || a.birthdate || "",
          adoptionDate: a.adoption || a.adoptionDate || "",
          notes: a.about || a.description || "",
          avatar: a?.image?.url || a.image || "",
        });
      } catch (e) {
        // noop
      }
    })();
    return () => {
      cancel = true;
    };
  }, [editing, id]);

  /* ------------------------------ avatar picker ------------------------------ */
  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;

    // Mantém layout: preview imediato
    const url = URL.createObjectURL(file);
    set("avatar", url);
    setAvatarFile(file);
  };

  /* --------------------------------- submit --------------------------------- */
  async function onSubmit(e) {
    e.preventDefault();

    try {
      // Normaliza campos conforme API
      const payload = {
        name: String(form.name || "").trim(),
        about: String(form.notes || ""),
        birthDate: form.birthdate || "",
        adoptionDate: form.adoptionDate || "",
        weight: Number(form.weight || 0) || 0,
        size: form.size || "",
        gender: form.gender || "",
        breedId: form.breedId || "",
      };

      // avatar (opcional) — envia como File se selecionado
      if (avatarFile instanceof File) {
        payload.image = avatarFile;
      }

      if (editing) {
        await updateAnimal({ animalId: id, ...payload });
        // notifica outras telas (lista/detalhe)
        window.dispatchEvent(new CustomEvent("patanet:pets-updated"));
        nav(`/pets/${id}`);
      } else {
        const created = await createAnimal(payload);
        const newId =
          created?.id ||
          created?.data?.id ||
          created?.animal?.id ||
          created?.animalId;
        nav(`/pets/${newId || ""}` || "/pets");
      }
    } catch (err) {
      console.error(err);
      alert("Não foi possível salvar. Tente novamente.");
    }
  }

  return (
    <div className="content-container">
      <h1 className="mb-4 text-xl font-semibold">
        {editing ? "Editar pet" : "Novo pet"}
      </h1>

      <form onSubmit={onSubmit} className="card p-4 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2 flex items-center gap-4">
          <img
            src={
              form.avatar ||
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"></svg>'
            }
            alt=""
            className="h-20 w-20 rounded-full object-cover border"
          />
          <div>
            <label className="text-sm font-medium">Avatar</label>
            <div className="mt-1">
              <input
                type="file"
                accept="image/*"
                onChange={onPickAvatar}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Nome */}
        <div>
          <label className="text-sm font-medium">Nome</label>
          <input
            className={INPUT}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ex.: Max, Nina…"
          />
        </div>

        {/* Espécie */}
        <div>
          <label className="text-sm font-medium">Espécie</label>
          <select
            className={INPUT}
            value={speciesUI}
            onChange={(e) => setSpeciesUI(e.target.value)}
          >
            <option>Cachorro</option>
            <option>Gato</option>
          </select>
        </div>

        {/* Raça (busca + select lista) */}
        <div>
          <label className="text-sm font-medium">Buscar raça</label>
          <input
            className={INPUT}
            value={breedQuery}
            onChange={(e) => setBreedQuery(e.target.value)}
            placeholder={`Buscar raça de ${speciesUI.toLowerCase()}…`}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Raça</label>
          <select
            className={INPUT}
            value={form.breedId}
            onChange={(e) => {
              const id = e.target.value;
              const b = breeds.find((x) => String(x.id) === String(id));
              set("breedId", id);
              set("breed", b?.name || "");
            }}
          >
            <option value="">Selecione</option>
            {breeds.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sexo */}
        <div>
          <label className="text-sm font-medium">Sexo</label>
          <select
            className={INPUT}
            value={form.gender}
            onChange={(e) => set("gender", e.target.value)}
          >
            <option>Macho</option>
            <option>Fêmea</option>
          </select>
        </div>

        {/* Porte */}
        <div>
          <label className="text-sm font-medium">Porte</label>
          <select
            className={INPUT}
            value={form.size}
            onChange={(e) => set("size", e.target.value)}
          >
            <option>Pequeno</option>
            <option>Médio</option>
            <option>Grande</option>
          </select>
        </div>

        {/* Peso */}
        <div>
          <label className="text-sm font-medium">Peso (kg)</label>
          <input
            type="number"
            step="0.1"
            className={INPUT}
            value={form.weight}
            onChange={(e) => set("weight", e.target.value)}
            placeholder="Ex.: 8.5"
          />
        </div>

        {/* Datas */}
        <div>
          <label className="text-sm font-medium">Nascimento</label>
          <input
            type="date"
            className={INPUT}
            value={form.birthdate}
            onChange={(e) => set("birthdate", e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Adoção</label>
          <input
            type="date"
            className={INPUT}
            value={form.adoptionDate}
            onChange={(e) => set("adoptionDate", e.target.value)}
          />
        </div>

        {/* Observações */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Observações</label>
          <textarea
            rows={4}
            className={INPUT}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button type="submit" className="btn-action rounded-md px-4 py-2 text-sm">
            {editing ? "Salvar alterações" : "Cadastrar pet"}
          </button>
        </div>
      </form>
    </div>
  );
}
