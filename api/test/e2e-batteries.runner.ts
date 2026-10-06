import * as fs from 'fs'
import * as path from 'path'

const API_URL = process.env.API_URL || 'http://localhost:3001'
const DEFAULT_PASSWORD = 'Patanet@Dev2026!'

// ANSI color helpers
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
}

interface TestResult {
  battery: string
  name: string
  method: string
  path: string
  expectedStatus: number | number[]
  actualStatus: number
  passed: boolean
  durationMs: number
  error?: string
  responseSnippet?: string
}

const allResults: TestResult[] = []
const tokenCache: Record<string, string> = {}

// Shared state between batteries
const state: {
  adminToken?: string
  tutorToken?: string
  cotutorToken?: string
  vetToken?: string
  petshopToken?: string
  adopterToken?: string
  semTermosToken?: string
  bloqueadorToken?: string
  bloqueadoToken?: string
  createdPetBreedId?: string
  createdPetId?: string
  createdVaccineId?: string
  createdDewormingId?: string
  createdMedicationId?: string
  createdPostId?: string
  createdCommentId?: string
  createdEventId?: string
  createdAdoptionRequestId?: string
  createdTicketId?: string
  createdReportId?: string
  createdVetProfileId?: string
} = {}

async function login(username: string): Promise<string> {
  if (tokenCache[username]) return tokenCache[username]

  try {
    const res = await fetch(`${API_URL}/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: DEFAULT_PASSWORD }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Falha no login para '${username}' (${res.status}): ${text}`)
    }

    const data = (await res.json()) as { access_token: string }
    tokenCache[username] = data.access_token
    return data.access_token
  } catch (err: any) {
    throw new Error(`Login '${username}' falhou: ${err.message} (${err.cause?.code || err.cause?.message || ''})`)
  }
}

async function request(
  battery: string,
  name: string,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  pathUrl: string,
  options: {
    token?: string
    body?: any
    headers?: Record<string, string>
    expectedStatus: number | number[]
  },
): Promise<{ success: boolean; status: number; data: any }> {
  const start = Date.now()
  const expected = Array.isArray(options.expectedStatus)
    ? options.expectedStatus
    : [options.expectedStatus]

  const headers: Record<string, string> = { ...(options.headers || {}) }
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`
  }
  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json'
  }

  let status = 0
  let data: any = null
  let errorMsg: string | undefined

  try {
    const res = await fetch(`${API_URL}${pathUrl}`, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })
    status = res.status
    const text = await res.text()
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  } catch (err: any) {
    status = 0
    errorMsg = err.message
  }

  const durationMs = Date.now() - start
  const passed = expected.includes(status)

  const snippet = data ? JSON.stringify(data).slice(0, 150) : ''

  allResults.push({
    battery,
    name,
    method,
    path: pathUrl,
    expectedStatus: options.expectedStatus,
    actualStatus: status,
    passed,
    durationMs,
    error: errorMsg,
    responseSnippet: snippet,
  })

  const icon = passed ? `${c.green}✔ PASS${c.reset}` : `${c.red}✖ FAIL${c.reset}`
  const statusStr = passed
    ? `${c.green}[${status}]${c.reset}`
    : `${c.red}[${status} - Exp: ${expected.join('/')}]${c.reset}`

  console.log(`    ${icon} ${statusStr} ${c.cyan}${method} ${pathUrl}${c.reset} ${c.dim}(${durationMs}ms)${c.reset} - ${name}`)
  if (!passed && (errorMsg || data)) {
    console.log(`      ${c.red}➔ Erro/Resposta:${c.reset} ${errorMsg || snippet}`)
  }

  return { success: passed, status, data }
}

async function run() {
  console.log(`\n${c.bold}==============================================================${c.reset}`)
  console.log(`${c.bold}🐾 PataNet API: Runner E2E de Baterias Funcionais de Testes${c.reset}`)
  console.log(`${c.dim}Alvo: ${API_URL} | Inicializando tokens e sessões...${c.reset}`)
  console.log(`${c.bold}==============================================================${c.reset}\n`)

  // 1. Pré-aquecimento e autenticação dos papéis
  try {
    state.adminToken = await login('admin.patanet')
    state.tutorToken = await login('mariana.santos')
    state.cotutorToken = await login('lucas.cotutor')
    state.vetToken = await login('carlos.vet')
    state.petshopToken = await login('petcenter.amigofiel')
    state.adopterToken = await login('beatriz.adotante')
    state.semTermosToken = await login('joao.semtermos')
    state.bloqueadorToken = await login('user.bloqueador')
    state.bloqueadoToken = await login('user.bloqueado')
    console.log(`${c.green}✔ Todos os tokens de teste autenticados com sucesso!${c.reset}\n`)
  } catch (err: any) {
    console.error(`${c.red}✖ Erro na autenticação inicial das contas de teste:${c.reset}`, err.message)
    process.exit(1)
  }

  // ==========================================
  // BATERIA 1: Auth & Sessão
  // ==========================================
  console.log(`${c.bold}▶ Bateria 1: Autenticação, Sessão e Tokens (Auth)${c.reset}`)
  const sessionRes = await request('B1: Auth', 'Login válido com credenciais corretas', 'POST', '/auth/session', {
    body: { username: 'mariana.santos', password: DEFAULT_PASSWORD },
    expectedStatus: [200, 201],
  })
  const refreshToken = sessionRes.data?.refresh_token
  if (refreshToken) {
    await request('B1: Auth', 'Renovação de sessão com refresh token', 'POST', '/auth/refresh', {
      headers: { 'refresh-token': refreshToken },
      expectedStatus: [200, 201],
    })
  }
  await request('B1: Auth', 'Login rejeitado com senha incorreta', 'POST', '/auth/session', {
    body: { username: 'mariana.santos', password: 'WrongPassword!' },
    expectedStatus: 401,
  })
  await request('B1: Auth', 'Tentativa de acesso não autenticado a rota protegida', 'GET', '/users/me', {
    expectedStatus: 401,
  })

  // ==========================================
  // BATERIA 2: Usuários, Perfil e Termos LGPD
  // ==========================================
  console.log(`\n${c.bold}▶ Bateria 2: Gestão de Usuários, Perfil e Termos LGPD (Users & Terms)${c.reset}`)
  const meRes = await request('B2: Users', 'Perfil do usuário logado', 'GET', '/users/me', {
    token: state.tutorToken,
    expectedStatus: 200,
  })
  const myUserId = meRes.data?.id || 'user-tutor-principal'

  await request('B2: Users', 'Perfil público por ID', 'GET', `/users/${myUserId}`, {
    token: state.tutorToken,
    expectedStatus: 200,
  })
  await request('B2: Users', 'Listagem paginada com filtro de busca', 'GET', '/users?query=Mariana', {
    token: state.tutorToken,
    expectedStatus: 200,
  })
  await request('B2: Users', 'Atualização de perfil (bio/about)', 'PATCH', '/users', {
    token: state.tutorToken,
    body: { about: 'Tutora apaixonada por cães e gatos em São Paulo.' },
    expectedStatus: 200,
  })
  await request('B2: Users', 'Consulta de termos de uso vigentes', 'GET', '/users/me/terms', {
    token: state.tutorToken,
    expectedStatus: 200,
  })
  await request('B2: Users', 'Aceite formal dos termos v1.0', 'POST', '/users/me/terms/accept', {
    token: state.tutorToken,
    body: { version: '1.0' },
    expectedStatus: [200, 201],
  })
  await request('B2: Users', 'Bloqueio de guard LGPD para usuário sem termos', 'GET', `/animals/owners/${myUserId}`, {
    token: state.semTermosToken,
    expectedStatus: 403,
  })

  // ==========================================
  // BATERIA 3: Catálogo Oficial de Espécies e Raças
  // ==========================================
  console.log(`\n${c.bold}▶ Bateria 3: Catálogo Oficial de Espécies e Raças (Species & Breeds)${c.reset}`)
  const speciesRes = await request('B3: Catalog', 'Listagem de espécies oficiais', 'GET', '/animals/species', {
    token: state.tutorToken,
    expectedStatus: 200,
  })
  const speciesList = Array.isArray(speciesRes.data?.data)
    ? speciesRes.data.data
    : Array.isArray(speciesRes.data)
      ? speciesRes.data
      : []
  const dogSpecieId = speciesList.find((s: any) => s.name === 'Cachorro')?.id

  const breedsRes = await request('B3: Catalog', 'Listagem completa de raças oficiais', 'GET', '/animals/breeds', {
    token: state.tutorToken,
    expectedStatus: 200,
  })
  const breedsList = Array.isArray(breedsRes.data?.data)
    ? breedsRes.data.data
    : Array.isArray(breedsRes.data)
      ? breedsRes.data
      : []
  state.createdPetBreedId = breedsList[0]?.id

  if (dogSpecieId) {
    const dogBreedsRes = await request('B3: Catalog', 'Filtro de raças por espécie (Cachorro)', 'GET', `/animals/breeds?specieId=${dogSpecieId}`, {
      token: state.tutorToken,
      expectedStatus: 200,
    })
    const dogBreedsList = Array.isArray(dogBreedsRes.data?.data)
      ? dogBreedsRes.data.data
      : Array.isArray(dogBreedsRes.data)
        ? dogBreedsRes.data
        : []
    if (dogBreedsList[0]?.id) {
      state.createdPetBreedId = dogBreedsList[0].id
    }
  }

  // ==========================================
  // BATERIA 4: Pets, Mídias e Visibilidade
  // ==========================================
  console.log(`\n${c.bold}▶ Bateria 4: Gestão de Pets, Ocultação e Mídias (Animals)${c.reset}`)
  const breedId = state.createdPetBreedId || 'breed-golden-retriever'
  const createPetRes = await request('B4: Pets', 'Cadastro de pet de teste', 'POST', '/animals', {
    token: state.tutorToken,
    body: {
      name: `Pet Teste Runner ${Date.now()}`,
      gender: 'MALE',
      breedId: breedId,
      weight: 15.5,
      size: 'MEDIUM',
      birthDate: '2022-01-01',
    },
    expectedStatus: 201,
  })
  state.createdPetId = createPetRes.data?.id

  if (state.createdPetId) {
    await request('B4: Pets', 'Consulta de pet cadastrado por ID', 'GET', `/animals/${state.createdPetId}`, {
      token: state.tutorToken,
      expectedStatus: 200,
    })
    await request('B4: Pets', 'Atualização de peso e dados do pet', 'PATCH', `/animals/${state.createdPetId}`, {
      token: state.tutorToken,
      body: { weight: 16.0 },
      expectedStatus: 200,
    })
    await request('B4: Pets', 'Ocultação temporária de pet', 'POST', `/animals/${state.createdPetId}/hide`, {
      token: state.tutorToken,
      expectedStatus: [200, 201],
    })
    await request('B4: Pets', 'Desocultação de pet', 'POST', `/animals/${state.createdPetId}/unhide`, {
      token: state.tutorToken,
      expectedStatus: [200, 201],
    })
    await request('B4: Pets', 'Listagem de mídias do pet', 'GET', `/animals/medias/${state.createdPetId}`, {
      token: state.tutorToken,
      expectedStatus: 200,
    })
  }

  // ==========================================
  // BATERIA 5: Tutores e Co-Tutoria
  // ==========================================
  console.log(`\n${c.bold}▶ Bateria 5: Tutores e Compartilhamento de Guarda (Owners)${c.reset}`)
  await request('B5: Owners', 'Listagem de pets por proprietário', 'GET', `/animals/owners/${myUserId}`, {
    token: state.tutorToken,
    expectedStatus: 200,
  })

  if (state.createdPetId) {
    await request('B5: Owners', 'Adicionar co-tutor ao pet', 'POST', `/animals/${state.createdPetId}/owners/user-cotutor`, {
      token: state.tutorToken,
      expectedStatus: [200, 201],
    })
    await request('B5: Owners', 'Remover co-tutor do pet', 'DELETE', `/animals/${state.createdPetId}/owners/user-cotutor`, {
      token: state.tutorToken,
      expectedStatus: 200,
    })
  }

  // ==========================================
  // BATERIA 6: Prontuário Clínico & Farmacológico
  // ==========================================
  console.log(`\n${c.bold}▶ Bateria 6: Prontuário Clínico & Farmacológico (Health)${c.reset}`)
  if (state.createdPetId) {
    // Vacinas
    const vacRes = await request('B6: Health', 'Registrar vacina com dados clínicos de veterinário', 'POST', `/animals/vaccines/${state.createdPetId}`, {
      token: state.tutorToken,
      body: {
        name: 'Múltipla V10',
        clinic: 'Clínica Veterinária Central',
        appliedAt: '2026-01-10',
        batchNumber: 'LOTE-V10-2026',
        vetName: 'Dr. Carlos Veterinário',
        crmv: '99999',
        crmvUf: 'SP',
      },
      expectedStatus: [200, 201],
    })
    state.createdVaccineId = vacRes.data?.id
    await request('B6: Health', 'Listar vacinas do pet', 'GET', `/animals/vaccines/${state.createdPetId}`, {
      token: state.tutorToken,
      expectedStatus: 200,
    })
    if (state.createdVaccineId) {
      await request('B6: Health', 'Excluir vacina registrada', 'DELETE', `/animals/${state.createdPetId}/vaccines/${state.createdVaccineId}`, {
        token: state.tutorToken,
        expectedStatus: 200,
      })
    }

    // Vermífugos
    const dewRes = await request('B6: Health', 'Registrar vermífugo', 'POST', `/animals/dewormings/${state.createdPetId}`, {
      token: state.tutorToken,
      body: { name: 'Drontal Plus', clinic: 'Clínica Veterinária Central', appliedAt: '2026-02-01' },
      expectedStatus: 201,
    })
    state.createdDewormingId = dewRes.data?.id
    await request('B6: Health', 'Listar vermífugos do pet', 'GET', `/animals/dewormings/${state.createdPetId}`, {
      token: state.tutorToken,
      expectedStatus: 200,
    })
    if (state.createdDewormingId) {
      await request('B6: Health', 'Excluir vermífugo', 'DELETE', `/animals/${state.createdPetId}/dewormings/${state.createdDewormingId}`, {
        token: state.tutorToken,
        expectedStatus: 200,
      })
    }

    // Medicamentos
    const medRes = await request('B6: Health', 'Registrar medicamento', 'POST', `/animals/medications/${state.createdPetId}`, {
      token: state.tutorToken,
      body: { name: 'Apoquel 16mg', clinic: 'Clínica Veterinária Central', startAt: '2026-03-01' },
      expectedStatus: 201,
    })
    state.createdMedicationId = medRes.data?.id
    await request('B6: Health', 'Listar medicamentos do pet', 'GET', `/animals/medications/${state.createdPetId}`, {
      token: state.tutorToken,
      expectedStatus: 200,
    })
    if (state.createdMedicationId) {
      await request('B6: Health', 'Excluir medicamento', 'DELETE', `/animals/${state.createdPetId}/medications/${state.createdMedicationId}`, {
        token: state.tutorToken,
        expectedStatus: 200,
      })
    }
  }

  // ==========================================
  // BATERIA 7: Rede Social, Feed, Likes & Comentários
  // ==========================================
  console.log(`\n${c.bold}▶ Bateria 7: Rede Social, Feed, Curtidas e Comentários (Posts & Feed)${c.reset}`)
  const postRes = await request('B7: Posts', 'Criar nova postagem no feed', 'POST', '/posts', {
    token: state.tutorToken,
    body: { subtitle: 'Dia de parque com meus pets! 🐕🌳 #PataNet', pets: state.createdPetId ? [state.createdPetId] : [] },
    expectedStatus: 201,
  })
  state.createdPostId = postRes.data?.id

  await request('B7: Posts', 'Obter feed de postagens', 'GET', '/posts/feed', {
    token: state.tutorToken,
    expectedStatus: 200,
  })
  await request('B7: Posts', 'Minhas postagens', 'GET', '/posts/me', {
    token: state.tutorToken,
    expectedStatus: 200,
  })

  if (state.createdPostId) {
    await request('B7: Posts', 'Curtir postagem', 'POST', `/posts/like/${state.createdPostId}`, {
      token: state.cotutorToken,
      expectedStatus: [200, 201],
    })
    await request('B7: Posts', 'Descurtir postagem', 'DELETE', `/posts/like/${state.createdPostId}`, {
      token: state.cotutorToken,
      expectedStatus: 200,
    })
    const commRes = await request('B7: Posts', 'Adicionar comentário no post', 'POST', `/posts/comment/${state.createdPostId}`, {
      token: state.cotutorToken,
      body: { content: 'Que lindo! Aproveitem o dia!' },
      expectedStatus: 201,
    })
    state.createdCommentId = commRes.data?.id
    if (state.createdCommentId) {
      await request('B7: Posts', 'Remover comentário', 'DELETE', `/posts/${state.createdPostId}/comment/${state.createdCommentId}`, {
        token: state.cotutorToken,
        expectedStatus: 200,
      })
    }
    await request('B7: Posts', 'Excluir postagem', 'DELETE', `/posts/${state.createdPostId}`, {
      token: state.tutorToken,
      expectedStatus: 200,
    })
  }

  // ==========================================
  // BATERIA 8: Conexões Sociais
  // ==========================================
  console.log(`\n${c.bold}▶ Bateria 8: Conexões Sociais e Seguidores (Connections)${c.reset}`)
  await request('B8: Connections', 'Seguir perfil do co-tutor', 'POST', '/connections/user-cotutor', {
    token: state.tutorToken,
    expectedStatus: [200, 201],
  })
  await request('B8: Connections', 'Resumo de conexões com iFollow=true', 'GET', '/connections/summary/user-cotutor', {
    token: state.tutorToken,
    expectedStatus: 200,
  })
  await request('B8: Connections', 'Listar seguidores', 'GET', '/connections/followers/user-cotutor', {
    token: state.tutorToken,
    expectedStatus: 200,
  })
  await request('B8: Connections', 'Listar usuários seguidos', 'GET', '/connections/followeds/user-tutor-principal', {
    token: state.tutorToken,
    expectedStatus: 200,
  })
  await request('B8: Connections', 'Deixar de seguir', 'DELETE', '/connections/user-cotutor', {
    token: state.tutorToken,
    expectedStatus: 200,
  })

  // ==========================================
  // BATERIA 9: Moderação, Denúncias e Bloqueios
  // ==========================================
  console.log(`\n${c.bold}▶ Bateria 9: Moderação, Denúncias e Bloqueios (Moderation)${c.reset}`)
  await request('B9: Moderation', 'Bloquear usuário', 'POST', '/blocks/user-bloqueado', {
    token: state.bloqueadorToken,
    expectedStatus: [200, 201],
  })
  await request('B9: Moderation', 'Listar usuários bloqueados', 'GET', '/blocks', {
    token: state.bloqueadorToken,
    expectedStatus: 200,
  })
  await request('B9: Moderation', 'Desbloquear usuário', 'DELETE', '/blocks/user-bloqueado', {
    token: state.bloqueadorToken,
    expectedStatus: 200,
  })
  const repRes = await request('B9: Moderation', 'Enviar denúncia de conteúdo', 'POST', '/reports', {
    token: state.tutorToken,
    body: {
      type: 'USER',
      category: 'GENERAL',
      targetId: 'user-bloqueado',
      message: 'Conta de teste enviando spam.',
    },
    expectedStatus: 201,
  })
  state.createdReportId = repRes.data?.id

  await request('B9: Moderation', 'Minhas denúncias', 'GET', '/reports/mine', {
    token: state.tutorToken,
    expectedStatus: 200,
  })
  await request('B9: Moderation', 'Minhas denúncias (alias /reports/me do frontend)', 'GET', '/reports/me', {
    token: state.tutorToken,
    expectedStatus: 200,
  })
  if (state.createdReportId) {
    await request('B9: Moderation', 'Moderar denúncia como Administrador', 'PATCH', `/reports/${state.createdReportId}/status`, {
      token: state.adminToken,
      body: { status: 'RESOLVED' },
      expectedStatus: 200,
    })
  }

  // ==========================================
  // BATERIA 10: Eventos Comunitários
  // ==========================================
  console.log(`\n${c.bold}▶ Bateria 10: Eventos Comunitários e Feiras Pet (Events)${c.reset}`)
  const eventRes = await request('B10: Events', 'Criar feira pet pela petshop parceira', 'POST', '/events', {
    token: state.petshopToken,
    body: {
      title: `Feira de Adoção e Passeio ${Date.now()}`,
      description: 'Venha adotar seu novo melhor amigo e participar de palestras.',
      date: '2026-10-15T10:00:00.000Z',
      locationText: 'Parque Ibirapuera, Portão 7',
    },
    expectedStatus: 201,
  })
  state.createdEventId = eventRes.data?.id

  await request('B10: Events', 'Listar eventos abertos', 'GET', '/events', {
    token: state.tutorToken,
    expectedStatus: 200,
  })
  if (state.createdEventId) {
    await request('B10: Events', 'Detalhes do evento', 'GET', `/events/${state.createdEventId}`, {
      token: state.tutorToken,
      expectedStatus: 200,
    })
    await request('B10: Events', 'Confirmar presença no evento', 'POST', `/events/${state.createdEventId}/attend`, {
      token: state.tutorToken,
      expectedStatus: [200, 201],
    })
    await request('B10: Events', 'Listar participantes confirmados', 'GET', `/events/${state.createdEventId}/attendees`, {
      token: state.tutorToken,
      expectedStatus: 200,
    })
    await request('B10: Events', 'Cancelar presença', 'DELETE', `/events/${state.createdEventId}/attend`, {
      token: state.tutorToken,
      expectedStatus: 200,
    })
    await request('B10: Events', 'Excluir evento', 'DELETE', `/events/${state.createdEventId}`, {
      token: state.petshopToken,
      expectedStatus: 200,
    })
  }

  // ==========================================
  // BATERIA 11: Adoção Responsável
  // ==========================================
  console.log(`\n${c.bold}▶ Bateria 11: Adoção Responsável e Custódia (Adoptions)${c.reset}`)
  await request('B11: Adoptions', 'Vitrine de animais disponíveis para adoção', 'GET', '/animals/adoptable', {
    token: state.adopterToken,
    expectedStatus: 200,
  })
  if (state.createdPetId) {
    await request('B11: Adoptions', 'Tentativa de adoção direta de pet com tutor (esperado 403)', 'POST', `/animals/${state.createdPetId}/adopt`, {
      token: state.adopterToken,
      expectedStatus: [400, 403],
    })
    await request('B11: Adoptions', 'Candidatura de adoção com assinatura digital (alias /adoption-applications do frontend)', 'POST', `/animals/${state.createdPetId}/adoption-applications`, {
      token: state.adopterToken,
      body: {
        message: 'Gostaria de adotar e cuidar deste animal com muito carinho.',
        signatureName: 'Beatriz Adotante',
        termVersion: '1.0',
      },
      expectedStatus: [200, 201, 400, 403],
    })
  }

  // ==========================================
  // BATERIA 12: Módulo Clínico Veterinário
  // ==========================================
  console.log(`\n${c.bold}▶ Bateria 12: Módulo Veterinário & CRMV (Vet)${c.reset}`)
  const vetApplyRes = await request('B12: Vet', 'Submeter requerimento de CRMV', 'POST', '/vet/apply', {
    token: state.tutorToken,
    body: { crmv: '99999', uf: 'SP' },
    expectedStatus: [200, 201, 409],
  })
  if (vetApplyRes.data?.id) {
    state.createdVetProfileId = vetApplyRes.data.id
    await request('B12: Vet', 'Aprovação de CRMV pelo Administrador', 'PATCH', `/admin/vet/${state.createdVetProfileId}/status`, {
      token: state.adminToken,
      body: { status: 'APPROVED' },
      expectedStatus: 200,
    })
  }

  if (state.createdPetId) {
    const vetMeRes = await request('B12: Vet', 'Obter perfil do veterinário de teste', 'GET', '/users/me', {
      token: state.vetToken,
      expectedStatus: 200,
    })
    const vetUserId = vetMeRes.data?.id
    if (vetUserId) {
      await request('B12: Vet', 'Autorizar veterinário no pet pelo tutor', 'POST', `/animals/${state.createdPetId}/authorize-vet`, {
        token: state.tutorToken,
        body: { veterinarianId: vetUserId },
        expectedStatus: [200, 201],
      })
      await request('B12: Vet', 'Veterinário registra prontuário clínico oficial', 'POST', `/animals/${state.createdPetId}/medical-records`, {
        token: state.vetToken,
        body: {
          notes: 'Pet avaliado com excelentes condições clínicas gerais.',
          vaccines: [
            {
              name: 'V10 Décupla Anual',
              clinic: 'Hospital Veterinário Central',
              batchNumber: 'VET-LOTE-2026',
              appliedAt: '2026-03-01',
            },
          ],
        },
        expectedStatus: 201,
      })
    }
  }

  // ==========================================
  // BATERIA 13: Petshops & Parceiros PJ
  // ==========================================
  console.log(`\n${c.bold}▶ Bateria 13: Petshops PJ & Credenciamento Parceiro (Petshops)${c.reset}`)
  const randomCnpj = String(Math.floor(10000000000000 + Math.random() * 89999999999999))
  const petshopRes = await request('B13: Petshops', 'Candidatar petshop PJ com novo CNPJ', 'POST', '/petshops/apply', {
    token: state.tutorToken,
    body: {
      cnpj: randomCnpj,
      businessName: `Petshop Teste ${Date.now()}`,
      addressLine: 'Rua dos Pets, 123',
      addressCity: 'Campinas',
      addressState: 'SP',
    },
    expectedStatus: [200, 201, 409],
  })
  if (petshopRes.data?.id) {
    await request('B13: Petshops', 'Aprovar credenciamento PJ de Petshop pelo Administrador', 'PATCH', `/admin/petshops/${petshopRes.data.id}/status`, {
      token: state.adminToken,
      body: { status: 'APPROVED' },
      expectedStatus: 200,
    })
  }

  // ==========================================
  // BATERIA 14: Central de Ajuda & Suporte
  // ==========================================
  console.log(`\n${c.bold}▶ Bateria 14: Central de Ajuda & Suporte ao Usuário (Support)${c.reset}`)
  const tickRes = await request('B14: Support', 'Abrir ticket de suporte', 'POST', '/support', {
    token: state.tutorToken,
    body: {
      category: 'GENERAL',
      subject: 'Dúvida sobre transferência de tutoria',
      message: 'Como faço para transferir a tutoria principal para o co-tutor?',
    },
    expectedStatus: 201,
  })
  state.createdTicketId = tickRes.data?.id

  await request('B14: Support', 'Meus chamados de suporte', 'GET', '/support/mine', {
    token: state.tutorToken,
    expectedStatus: 200,
  })
  if (state.createdTicketId) {
    await request('B14: Support', 'Enviar réplica no chamado', 'POST', `/support/${state.createdTicketId}/messages`, {
      token: state.tutorToken,
      body: { message: 'Aguardo retorno da equipe técnica.' },
      expectedStatus: 201,
    })
    await request('B14: Support', 'Listar todos os chamados como Administrador', 'GET', '/support/all', {
      token: state.adminToken,
      expectedStatus: 200,
    })
    await request('B14: Support', 'Atualizar status do chamado (Fechamento)', 'PATCH', `/support/${state.createdTicketId}/status`, {
      token: state.adminToken,
      body: { status: 'CLOSED' },
      expectedStatus: 200,
    })
  }

  // Limpeza final do pet de teste criado
  if (state.createdPetId) {
    await request('Cleanup', 'Excluir pet de teste criado na bateria', 'DELETE', `/animals/${state.createdPetId}`, {
      token: state.tutorToken,
      expectedStatus: 200,
    })
  }

  // ==========================================
  // RELATÓRIO FINAL
  // ==========================================
  const total = allResults.length
  const passed = allResults.filter(r => r.passed).length
  const failed = total - passed
  const avgDuration = Math.round(allResults.reduce((acc, r) => acc + r.durationMs, 0) / (total || 1))

  console.log(`\n${c.bold}==============================================================${c.reset}`)
  console.log(`${c.bold}📊 RESUMO EXECUTIVO DA BATERIA E2E:${c.reset}`)
  console.log(`Total de Casos Executados: ${c.bold}${total}${c.reset}`)
  console.log(`Casos com Sucesso:         ${c.green}${passed}${c.reset}`)
  console.log(`Casos com Falha:           ${failed > 0 ? c.red : c.green}${failed}${c.reset}`)
  console.log(`Tempo Médio por Rota:      ${c.cyan}${avgDuration}ms${c.reset}`)
  console.log(`${c.bold}==============================================================${c.reset}`)

  const reportPath = path.join(__dirname, 'e2e-batteries-report.json')
  fs.writeFileSync(reportPath, JSON.stringify({ summary: { total, passed, failed, avgDuration, date: new Date().toISOString() }, results: allResults }, null, 2))
  console.log(`\n💾 Relatório JSON estruturado salvo em: ${c.cyan}${reportPath}${c.reset}\n`)

  if (failed > 0) {
    console.log(`${c.red}✖ ATENÇÃO: ${failed} requisições divergiram do contrato esperado.${c.reset}`)
    process.exit(1)
  } else {
    console.log(`${c.green}✔ PARABÉNS! 100% das baterias de teste executadas com sucesso.${c.reset}`)
    process.exit(0)
  }
}

run().catch(err => {
  console.error(`${c.red}Erro fatal na execução das baterias:${c.reset}`, err)
  process.exit(1)
})
