const KEY = "patanet_pets";
function uid() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2, 10);
}

export function loadPets() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
export function savePets(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("patanet:pets-updated"));
}
export function getPet(id) {
  return loadPets().find((p) => p.id === id) || null;
}
export function addPet(input) {
  const now = Date.now();
  const pet = {
    id: uid(),
    createdAt: now,
    updatedAt: now,
    name: "",
    species: "Cachorro",
    breed: "",
    gender: "Macho",
    size: "Médio",
    weight: "",
    birthdate: "",
    adoptionDate: "",
    notes: "",
    avatar: "",
    gallery: [],
    vaccines: [],
    ...input,
  };
  const list = loadPets();
  list.push(pet);
  savePets(list);
  return pet;
}
export function updatePet(id, patch) {
  const list = loadPets();
  const i = list.findIndex((p) => p.id === id);
  if (i === -1) return null;
  list[i] = { ...list[i], ...patch, updatedAt: Date.now() };
  savePets(list);
  return list[i];
}
export function removePet(id) {
  const list = loadPets().filter((p) => p.id !== id);
  savePets(list);
}
export function addPetPhoto(id, { src, caption = "" }) {
  const pet = getPet(id);
  if (!pet) return;
  const photo = { id: uid(), src, caption };
  pet.gallery = pet.gallery || [];
  pet.gallery.push(photo);
  updatePet(id, { gallery: pet.gallery });
  return photo;
}
export function removePetPhoto(id, photoId) {
  const pet = getPet(id);
  if (!pet) return;
  pet.gallery = (pet.gallery || []).filter((ph) => ph.id !== photoId);
  updatePet(id, { gallery: pet.gallery });
}
export function addVaccine(id, v) {
  const pet = getPet(id);
  if (!pet) return;
  const item = {
    id: uid(),
    name: "",
    date: "",
    lot: "",
    vet: "",
    nextDose: "",
    notes: "",
    ...v,
  };
  pet.vaccines = pet.vaccines || [];
  pet.vaccines.push(item);
  updatePet(id, { vaccines: pet.vaccines });
  return item;
}
export function updateVaccine(id, vaccineId, patch) {
  const pet = getPet(id);
  if (!pet) return;
  pet.vaccines = (pet.vaccines || []).map((x) =>
    x.id === vaccineId ? { ...x, ...patch } : x
  );
  updatePet(id, { vaccines: pet.vaccines });
}
export function removeVaccine(id, vaccineId) {
  const pet = getPet(id);
  if (!pet) return;
  pet.vaccines = (pet.vaccines || []).filter((x) => x.id !== vaccineId);
  updatePet(id, { vaccines: pet.vaccines });
}

export function getPetById(id) {
  return loadPets().find(p => p.id === id) || null;
}