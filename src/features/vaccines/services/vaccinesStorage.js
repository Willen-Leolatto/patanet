const KEY = "patanet_vaccines";

export function loadVaccines() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveVaccines(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

export function addVaccine(vac) {
  const list = loadVaccines();
  list.push(vac);
  saveVaccines(list);
  return vac.id;
}

export function getVaccineById(id) {
  const nid = Number(id);
  return loadVaccines().find((v) => Number(v.id) === nid);
}

export function updateVaccine(id, updates) {
  const nid = Number(id);
  const list = loadVaccines().map((v) =>
    Number(v.id) === nid ? { ...v, ...updates } : v
  );
  saveVaccines(list);
}

export function deleteVaccine(id) {
  const nid = Number(id);
  const list = loadVaccines().filter((v) => Number(v.id) !== nid);
  saveVaccines(list);
}
