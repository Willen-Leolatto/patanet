// petsStorage.js — drop-in

const KEY = "patanet_pets";

function uid() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2, 10);
}

/* ======================= CRUD de Pets (inalterado) ======================= */
export function loadPets() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function savePets(arr) {
  localStorage.setItem(KEY, JSON.stringify(arr));
  window.dispatchEvent(new Event("patanet:pets-updated")); // ⬅️ importante
}

export function getPet(id) {
  return loadPets().find((p) => p.id === id) || null;
}

function getLoggedUserIdOrNull() {
  try {
    const raw = localStorage.getItem("auth:user");
    return raw ? JSON.parse(raw)?.id || null : null;
  } catch {
    return null;
  }
}

// petsStorage.js
export function addPet(input) {
  const pets = loadPets();
  const id = crypto?.randomUUID?.() || Date.now().toString();
  const now = Date.now();

  console.log(input);

  const pet = {
    id,
    name: (input.name || "").trim() || "Sem nome",
    species: input.species || "Cachorro",
    breed: input.breed || "",
    gender: input.gender || "fêmea",
    size: input.size || "médio",
    weight: typeof input.weight === "number" ? input.weight : 0,
    birthday: input.birthday || "",
    adoption: input.adoption || "",
    description: input.description || "",
    avatar: input.avatar || "", // <---
    media: Array.isArray(input.media) ? input.media : [], // <---
    createdAt: now,
    ownerId: input.ownerId ?? input.userId ?? input.createdBy ?? null, 
  };

  pets.push(pet);
  localStorage.setItem(KEY, JSON.stringify(pets));
  return pet;
}

export function updatePet(id, patch) {
  const all = loadPets();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch };
  savePets(all);
  return all[idx];
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
  return loadPets().find((p) => p.id === id) || null;
}

/* =================== Raças (dados ricos, compatíveis) =================== */
/**
 * Cada raça mantém as chaves já usadas:
 *  - id, name, image, suggestedSize, weightTip, description
 * E acrescenta (opcionais):
 *  - appearance, temperament, trainability, exercise, grooming,
 *    heightTip, lifespan, healthNotes
 * Nada disso quebra o front existente.
 */
export const BREEDS = {
  Cachorro: [
    {
      id: "dog-labrador",
      name: "Labrador",
      suggestedSize: "Grande",
      weightTip: "25–36 kg",
      heightTip: "54–57 cm",
      lifespan: "11–13 anos",
      image:
        "https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&q=80&auto=format&fit=crop",
      description: "Amigável, ativo e excelente com famílias.",
      appearance:
        "Corpo atlético; pelagem curta (amarelo, preto ou chocolate); orelhas caídas.",
      temperament:
        "Muito sociável, paciente com crianças, costuma gostar de água.",
      trainability: "Alta — aprende comandos com facilidade.",
      exercise:
        "Alto — precisa de caminhadas, natação ou brincadeiras diárias.",
      grooming: "Baixo a médio — escovação semanal.",
      healthNotes: "Atenção a displasia e controle de peso.",
    },
    {
      id: "dog-border-collie",
      name: "Border Collie",
      suggestedSize: "Médio",
      weightTip: "14–20 kg",
      heightTip: "48–53 cm",
      lifespan: "12–15 anos",
      image:
        "https://images.unsplash.com/photo-1557977275-2b0c5810b6d5?w=800&q=80&auto=format&fit=crop",
      description:
        "Muito inteligente e energético; excelente para adestramento.",
      appearance:
        "Pelagem média a longa (geralmente preto/branco), olhar atento.",
      temperament: "Vigilante, focado, sensível a comandos.",
      trainability: "Muito alta — raça de trabalho.",
      exercise:
        "Muito alto — precisa de atividade mental e física (agility, pastoreio).",
      grooming: "Médio — escovação frequente.",
      healthNotes: "Propensão a displasia, sensibilidade a estímulos.",
    },
    {
      id: "dog-golden",
      name: "Golden Retriever",
      suggestedSize: "Grande",
      weightTip: "25–34 kg",
      heightTip: "55–60 cm",
      lifespan: "10–12 anos",
      image:
        "https://images.unsplash.com/photo-1507149833265-60c372daea22?w=800&q=80&auto=format&fit=crop",
      description: "Companheiro dócil, carinhoso e brincalhão.",
      appearance: "Pelagem densa e dourada; orelhas médias; expressão doce.",
      temperament: "Extrovertido, apegado, paciente.",
      trainability: "Alta — colabora bem em treinos positivos.",
      exercise: "Alto — caminhadas e natação ajudam muito.",
      grooming: "Médio — solta pelos; escovar 2–3x/semana.",
      healthNotes: "Atenção a quadril/cotovelo; tendência à obesidade.",
    },
    {
      id: "dog-pug",
      name: "Pug",
      suggestedSize: "Pequeno",
      weightTip: "6–8 kg",
      heightTip: "25–30 cm",
      lifespan: "12–14 anos",
      image:
        "https://images.unsplash.com/photo-1507149833265-3a541e6f1b99?w=800&q=80&auto=format&fit=crop",
      description:
        "Simpático e carismático; braquicefálico (cuidados com calor).",
      appearance: "Focinho curto, enrugado; olhos grandes; pelagem curta.",
      temperament: "Companheiro, brincalhão, adora colo.",
      trainability: "Média — respostas curtas e positivas funcionam melhor.",
      exercise: "Baixo a médio — passeios curtos e regulares.",
      grooming: "Baixo — escovação leve; limpar dobras faciais.",
      healthNotes: "Sensível a calor; atenção a respiração/olhos.",
    },
    {
      id: "dog-srd",
      name: "SRD (Vira-lata)",
      suggestedSize: "Médio",
      weightTip: "Variável",
      heightTip: "Variável",
      lifespan: "12–16 anos",
      image:
        "https://images.unsplash.com/photo-1489417139533-915815598d31?w=800&q=80&auto=format&fit=crop",
      description: "Únicos e resistentes; tamanhos e looks variados.",
      appearance: "Misturas diversas; cada cão é único.",
      temperament: "Personalidade rica; costumam ser resilientes e leais.",
      trainability: "Média a alta — varia do indivíduo.",
      exercise: "Variável — acompanhe nível de energia do cão.",
      grooming: "Variável — conforme o tipo de pelagem.",
      healthNotes: "Em geral saudáveis; vacinação e checkups são essenciais.",
    },
    {
      id: "dog-husky",
      name: "Husky Siberiano",
      suggestedSize: "Médio",
      weightTip: "16–27 kg",
      heightTip: "50–60 cm",
      lifespan: "12–14 anos",
      image:
        "https://images.unsplash.com/photo-1534367610401-9f51ce501a43?w=800&q=80&auto=format&fit=crop",
      description: "Atlético, vocal e independente.",
      appearance:
        "Pelagem dupla e densa; olhos azuis ou bicolores; cauda farta.",
      temperament: "Sociável, porém teimoso; gosta de companhia canina.",
      trainability: "Média — exige consistência.",
      exercise: "Muito alto — precisa correr e gastar energia.",
      grooming: "Alto em troca de pelos — escovação frequente.",
      healthNotes: "Tolerante a frio; cuidado com calor.",
    },
    {
      id: "dog-german-shepherd",
      name: "Pastor Alemão",
      suggestedSize: "Grande",
      weightTip: "22–40 kg",
      heightTip: "55–65 cm",
      lifespan: "9–13 anos",
      image:
        "https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&q=80&auto=format&fit=crop",
      description: "Protetor, leal e versátil.",
      appearance: "Linhas fortes; orelhas eretas; pelagem dupla.",
      temperament: "Devotado, confiante, guardião.",
      trainability: "Muito alta — excelente para trabalhos.",
      exercise: "Alto — precisa de tarefas e treinos.",
      grooming: "Médio/alto — solta bastante pelo.",
      healthNotes: "Atenção a displasia e coluna.",
    },
    {
      id: "dog-dachshund",
      name: "Dachshund (Salsicha)",
      suggestedSize: "Pequeno",
      weightTip: "5–12 kg",
      heightTip: "15–25 cm",
      lifespan: "12–16 anos",
      image:
        "https://images.unsplash.com/photo-1537151625747-768eb6cf92b6?w=800&q=80&auto=format&fit=crop",
      description: "Curioso e valente; costas exigem cuidados.",
      appearance: "Corpo longo, pernas curtas; versões pelo curto/duro/longo.",
      temperament: "Vivaz, alerta, às vezes teimoso.",
      trainability: "Média — sessões curtas e positivas.",
      exercise: "Médio — passeios e brincadeiras controladas.",
      grooming: "Baixo a médio — depende do tipo de pelagem.",
      healthNotes: "Evitar saltos para proteger a coluna.",
    },
    {
      id: "dog-shih-tzu",
      name: "Shih Tzu",
      suggestedSize: "Pequeno",
      weightTip: "4–7 kg",
      heightTip: "20–28 cm",
      lifespan: "12–16 anos",
      image:
        "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80&auto=format&fit=crop",
      description: "Companheiro afetuoso; ótimo cão de apartamento.",
      appearance: "Pelagem longa e sedosa; focinho curto.",
      temperament: "Doce, calmo, adaptável.",
      trainability: "Média — respostas suaves funcionam melhor.",
      exercise: "Baixo a médio.",
      grooming: "Alto se mantiver pelagem longa — tosas frequentes.",
      healthNotes: "Atenção a olhos e vias aéreas.",
    },
    {
      id: "dog-poodle",
      name: "Poodle",
      suggestedSize: "Médio",
      weightTip: "6–30 kg (mini/médio/standard)",
      heightTip: "28–60 cm",
      lifespan: "12–15 anos",
      image:
        "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80&auto=format&fit=crop",
      description: "Inteligente e hipoalergênico (varia por porte).",
      appearance: "Pelagem encaracolada; variedade de cores.",
      temperament: "Esperto, sensível, brincalhão.",
      trainability: "Muito alta.",
      exercise: "Médio a alto — depende do porte.",
      grooming: "Alto — manutenção de pelagem/tosa.",
      healthNotes: "Atenção a ouvidos e pele.",
    },
    {
      id: "dog-yorkshire",
      name: "Yorkshire",
      suggestedSize: "Pequeno",
      weightTip: "2–4 kg",
      heightTip: "18–23 cm",
      lifespan: "13–16 anos",
      image:
        "https://images.unsplash.com/photo-1537151625747-768eb6cf92b6?w=800&q=80&auto=format&fit=crop",
      description: "Pequeno porte e grande atitude.",
      appearance: "Pelagem sedosa; coloração típica azul/aço e dourado.",
      temperament: "Alerta, apegado, corajoso.",
      trainability: "Média.",
      exercise: "Médio — passeios curtos diários.",
      grooming: "Médio/alto — escovar com frequência.",
      healthNotes: "Fragilidade dentária; cuidado com quedas.",
    },
    {
      id: "dog-bulldog",
      name: "Bulldog Inglês",
      suggestedSize: "Médio",
      weightTip: "18–25 kg",
      heightTip: "31–40 cm",
      lifespan: "8–10 anos",
      image:
        "https://images.unsplash.com/photo-1525253086316-d0c936c814f8?w=800&q=80&auto=format&fit=crop",
      description: "Calmo e carinhoso; braquicefálico.",
      appearance: "Peito largo, focinho curto, rugas marcantes.",
      temperament: "Tranquilo, leal, ótimo companheiro.",
      trainability: "Média/baixa — pode ser teimoso.",
      exercise: "Baixo a médio — evitar calor.",
      grooming: "Baixo — higiene das dobras é essencial.",
      healthNotes: "Atenção a respiração e temperatura.",
    },
    {
      id: "dog-rott",
      name: "Rottweiler",
      suggestedSize: "Grande",
      weightTip: "35–60 kg",
      heightTip: "56–69 cm",
      lifespan: "9–10 anos",
      image:
        "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=800&q=80&auto=format&fit=crop",
      description: "Forte e protetor; precisa de socialização.",
      appearance: "Musculoso; marcações preto/castanho típicas.",
      temperament: "Confiante, guardião, dedicado.",
      trainability: "Alta com liderança consistente.",
      exercise: "Alto — treinos e atividades estruturadas.",
      grooming: "Baixo — escovação semanal.",
      healthNotes: "Quadril/cotovelo; atenção a peso.",
    },
    {
      id: "dog-beagle",
      name: "Beagle",
      suggestedSize: "Médio",
      weightTip: "9–14 kg",
      heightTip: "33–40 cm",
      lifespan: "12–15 anos",
      image:
        "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&q=80&auto=format&fit=crop",
      description: "Farejador brincalhão, ótimo com crianças.",
      appearance: "Orelhas longas; pelagem curta tricolor.",
      temperament: "Sociável, curioso, vocal.",
      trainability: "Média — nariz manda!",
      exercise: "Médio — caminhadas e jogos de faro.",
      grooming: "Baixo — fácil manutenção.",
      healthNotes: "Controle de peso; ouvido sensível.",
    },
    {
      id: "dog-schnauzer",
      name: "Schnauzer",
      suggestedSize: "Médio",
      weightTip: "7–23 kg (mini/standard/giant)",
      heightTip: "30–70 cm",
      lifespan: "12–15 anos",
      image:
        "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80&auto=format&fit=crop",
      description: "Vigilante e fiel; três tamanhos.",
      appearance: "Sobrancelhas e barba marcantes.",
      temperament: "Esperto, protetor, ativo.",
      trainability: "Alta.",
      exercise: "Médio a alto.",
      grooming: "Médio — manutenção da barba/pelos.",
      healthNotes: "Atenção a pele e olhos.",
    },
    // + algumas escolhas populares
    {
      id: "dog-boxer",
      name: "Boxer",
      suggestedSize: "Grande",
      weightTip: "25–32 kg",
      heightTip: "53–63 cm",
      lifespan: "10–12 anos",
      image:
        "https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?w=800&q=80&auto=format&fit=crop",
      description: "Brincalhão, leal e atlético.",
      appearance: "Musculoso; focinho curto; pelagem curta.",
      temperament: "Afetuoso, enérgico, ótimo com família.",
      trainability: "Alta com reforço positivo.",
      exercise: "Alto.",
      grooming: "Baixo.",
      healthNotes: "Atenção a calor e articulações.",
    },
    {
      id: "dog-corgi",
      name: "Corgi (Pembroke)",
      suggestedSize: "Pequeno",
      weightTip: "10–14 kg",
      heightTip: "25–30 cm",
      lifespan: "12–13 anos",
      image:
        "https://images.unsplash.com/photo-1546975490-8f14c5c8e3f3?w=800&q=80&auto=format&fit=crop",
      description: "Baixinhos carismáticos; pastores por natureza.",
      appearance: "Pernas curtas, orelhas pontudas, cauda curta.",
      temperament: "Alerta, dócil, engraçado.",
      trainability: "Alta.",
      exercise: "Médio — precisa gastar energia mental.",
      grooming: "Médio — solta bastante pelo.",
      healthNotes: "Atenção a coluna e peso.",
    },
  ],
  Gato: [
    {
      id: "cat-srd",
      name: "SRD (Sem raça definida)",
      suggestedSize: "Pequeno",
      weightTip: "3–6 kg",
      heightTip: "23–28 cm",
      lifespan: "12–18 anos",
      image:
        "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&q=80&auto=format&fit=crop",
      description: "Carinhosos e diversos, personalidade única.",
      appearance: "Grande variedade de cores e padrões.",
      temperament: "Afetuoso e adaptável (varia bastante).",
      trainability: "Média — respondem a brincadeiras/recompensas.",
      exercise: "Médio — ambientes enriquecidos ajudam.",
      grooming: "Baixo a médio — conforme pelagem.",
      healthNotes: "Checkups regulares e enriquecimento ambiental.",
    },
    {
      id: "cat-siamese",
      name: "Siamês",
      suggestedSize: "Pequeno",
      weightTip: "2.5–5 kg",
      heightTip: "20–25 cm",
      lifespan: "12–15 anos",
      image:
        "https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?w=800&q=80&auto=format&fit=crop",
      description: "Vocal, afetuoso e muito sociável.",
      appearance: "Olhos azuis; máscara/orelhas/cauda escuras.",
      temperament: "Grudinho, adora atenção.",
      trainability: "Alta — aprende truques/brinquedos interativos.",
      exercise: "Médio — gosta de brincar.",
      grooming: "Baixo — pelagem curta.",
      healthNotes: "Atenção a problemas dentários.",
    },
    {
      id: "cat-persian",
      name: "Persa",
      suggestedSize: "Pequeno",
      weightTip: "3–5.5 kg",
      heightTip: "24–28 cm",
      lifespan: "12–15 anos",
      image:
        "https://images.unsplash.com/photo-1510337550647-e84f83e341ca?w=800&q=80&auto=format&fit=crop",
      description: "Peludo e calmo; ótimo para ambientes tranquilos.",
      appearance: "Rosto achatado; pelagem longa e farta.",
      temperament: "Dócil e sereno.",
      trainability: "Média.",
      exercise: "Baixo a médio.",
      grooming: "Alto — escovação diária e cuidados oculares.",
      healthNotes: "Atenção a vias aéreas/olhos.",
    },
    {
      id: "cat-maine",
      name: "Maine Coon",
      suggestedSize: "Grande",
      weightTip: "5–9 kg",
      heightTip: "25–41 cm",
      lifespan: "12–15 anos",
      image:
        "https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?w=800&q=80&auto=format&fit=crop",
      description: "Gigante gentil; sociável e brincalhão.",
      appearance: "Pelagem espessa; cauda longa; tufos nas orelhas.",
      temperament: "Amigável, confiante.",
      trainability: "Alta — gosta de jogos.",
      exercise: "Médio.",
      grooming: "Médio/alto — escovar com frequência.",
      healthNotes: "Atenção a cardiopatias hereditárias.",
    },
    {
      id: "cat-bengal",
      name: "Bengal",
      suggestedSize: "Médio",
      weightTip: "4–7 kg",
      heightTip: "20–25 cm",
      lifespan: "12–16 anos",
      image:
        "https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800&q=80&auto=format&fit=crop",
      description: "Ativo e curioso; pelagem pintada.",
      appearance: "Manchas/rosetas; aspecto selvagem.",
      temperament: "Extrovertido, energético.",
      trainability: "Alta — precisa de estímulos.",
      exercise: "Alto — arranhadores, prateleiras, brinquedos.",
      grooming: "Baixo.",
      healthNotes: "Necessita enriquecimento para evitar tédio.",
    },
    {
      id: "cat-ragdoll",
      name: "Ragdoll",
      suggestedSize: "Grande",
      weightTip: "4.5–9 kg",
      heightTip: "23–28 cm",
      lifespan: "12–15 anos",
      image:
        "https://images.unsplash.com/photo-1544717305-996b815c338c?w=800&q=80&auto=format&fit=crop",
      description: "Muito dócil; relaxa no colo.",
      appearance: "Olhos azuis; pelagem semilonga; bicolor/colourpoint.",
      temperament: "Tranquilo, extremamente manso.",
      trainability: "Média/alta.",
      exercise: "Médio.",
      grooming: "Médio — escovação regular.",
      healthNotes: "Atenção a peso (tendem a ser gulosos).",
    },
    {
      id: "cat-british",
      name: "British Shorthair",
      suggestedSize: "Médio",
      weightTip: "4–7.5 kg",
      heightTip: "30–35 cm",
      lifespan: "12–17 anos",
      image:
        "https://images.unsplash.com/photo-1501706362039-c06b2d715385?w=800&q=80&auto=format&fit=crop",
      description: "Tranquilo e independente.",
      appearance: "Corpo robusto; olhos grandes; pelagem densa.",
      temperament: "Calmo, reservado, carinhoso ao jeito dele.",
      trainability: "Média.",
      exercise: "Médio — brincadeiras curtas.",
      grooming: "Baixo/médio.",
      healthNotes: "Cuidado com sobrepeso.",
    },
    {
      id: "cat-sphynx",
      name: "Sphynx",
      suggestedSize: "Pequeno",
      weightTip: "3–5 kg",
      heightTip: "20–25 cm",
      lifespan: "12–15 anos",
      image:
        "https://images.unsplash.com/photo-1555685812-58b5d4f5f7c1?w=800&q=80&auto=format&fit=crop",
      description: "Sem pelos; afetuoso e calorento.",
      appearance: "Pele exposta; rugas; orelhas grandes.",
      temperament: "Muito apegado, curioso.",
      trainability: "Média/alta.",
      exercise: "Médio.",
      grooming: "Especial — banhos/limpeza da pele rotineiros.",
      healthNotes: "Sensível a frio/sol; atenção a pele/oleosidade.",
    },
    {
      id: "cat-abyssinian",
      name: "Abissínio",
      suggestedSize: "Pequeno",
      weightTip: "3–5 kg",
      heightTip: "20–25 cm",
      lifespan: "12–15 anos",
      image:
        "https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&q=80&auto=format&fit=crop",
      description: "Muito ativo e curioso.",
      appearance: "Pelagem “ticked”; corpo atlético.",
      temperament: "Explorador, brincalhão.",
      trainability: "Alta — adora desafios.",
      exercise: "Alto.",
      grooming: "Baixo.",
      healthNotes: "Precisa de estímulos diários.",
    },
    {
      id: "cat-norwegian",
      name: "Floresta Norueguesa",
      suggestedSize: "Grande",
      weightTip: "5–9 kg",
      heightTip: "25–40 cm",
      lifespan: "12–16 anos",
      image:
        "https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=800&q=80&auto=format&fit=crop",
      description: "Robusto e afetuoso; pelagem própria para o frio.",
      appearance: "Pelagem dupla; tufos nas orelhas e patas.",
      temperament: "Gentil, confiante.",
      trainability: "Média/alta.",
      exercise: "Médio.",
      grooming: "Médio/alto — escovação frequente.",
      healthNotes: "Atenção a bolas de pelos e peso.",
    },
    {
      id: "cat-russian",
      name: "Azul Russo",
      suggestedSize: "Médio",
      weightTip: "3–6 kg",
      heightTip: "25–30 cm",
      lifespan: "12–15 anos",
      image:
        "https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800&q=80&auto=format&fit=crop",
      description: "Elegante e reservado; muito afetuoso com a família.",
      appearance: "Pelagem azul-acinzentada; olhos verdes.",
      temperament: "Tímido com estranhos, carinhoso com os seus.",
      trainability: "Média.",
      exercise: "Médio.",
      grooming: "Baixo — pelagem curta.",
      healthNotes: "Geralmente saudáveis; atenção a estresse.",
    },
  ],
};

/* ====== Acesso auxiliar ====== */
export function getBreedsBySpecies(species = "Cachorro") {
  return BREEDS[species] || [];
}
export function searchBreeds(query, species) {
  const q = String(query || "").toLowerCase();
  const base = species
    ? getBreedsBySpecies(species)
    : [...BREEDS.Cachorro, ...BREEDS.Gato];
  return base.filter((b) => b.name.toLowerCase().includes(q));
}
export function getBreedById(id) {
  return (
    BREEDS.Cachorro.find((b) => b.id === id) ||
    BREEDS.Gato.find((b) => b.id === id) ||
    null
  );
}
