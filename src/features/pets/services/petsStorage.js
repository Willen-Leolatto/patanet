const KEY = "patanet_pets";

export function loadPets() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function savePets(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

export function addPet(pet) {
  const list = loadPets();
  list.push(pet);
  savePets(list);
  return pet.id;
}

export function getPetById(id) {
  const nid = Number(id);
  return loadPets().find((p) => Number(p.id) === nid);
}

export function updatePet(id, updates) {
  const nid = Number(id);
  const list = loadPets().map((p) =>
    Number(p.id) === nid ? { ...p, ...updates } : p
  );
  savePets(list);
}

export function deletePet(id) {
  const nid = Number(id);
  const list = loadPets().filter((p) => Number(p.id) !== nid);
  savePets(list);
}
