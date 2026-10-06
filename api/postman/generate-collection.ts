import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

interface PostmanHeader {
  key: string
  value: string
  type?: string
  description?: string
}

interface PostmanUrl {
  raw: string
  host: string[]
  path: string[]
  query?: Array<{ key: string; value: string; description?: string }>
  variable?: Array<{ key: string; value: string; description?: string }>
}

interface PostmanBody {
  mode: 'raw' | 'formdata' | 'urlencoded'
  raw?: string
  options?: {
    raw?: {
      language: string
    }
  }
  formdata?: Array<{ key: string; type: string; src?: string; value?: string; description?: string }>
}

interface PostmanEvent {
  listen: 'test' | 'prerequest'
  script: {
    type: string
    exec: string[]
  }
}

interface PostmanRequestItem {
  name: string
  event?: PostmanEvent[]
  request: {
    method: string
    header: PostmanHeader[]
    body?: PostmanBody
    url: PostmanUrl
    description?: string
  }
  response?: any[]
}

interface PostmanFolderItem {
  name: string
  description?: string
  item: PostmanRequestItem[]
}

interface PostmanCollection {
  info: {
    _postman_id: string
    name: string
    description: string
    schema: string
  }
  item: PostmanFolderItem[]
  variable?: Array<{ key: string; value: string; type: string }>
}

interface PostmanEnvironment {
  id: string
  name: string
  values: Array<{
    key: string
    value: string
    type?: string
    enabled: boolean
  }>
  _postman_variable_scope: string
}

function parseUrl(rawUrl: string): PostmanUrl {
  const [baseAndPath, queryString] = rawUrl.split('?')
  const cleanPath = baseAndPath.replace(/^\{\{baseUrl\}\}\/?/, '')
  const pathParts = cleanPath ? cleanPath.split('/') : []

  const query = queryString
    ? queryString.split('&').map(param => {
        const [k, v] = param.split('=')
        return { key: k, value: v || '' }
      })
    : undefined

  return {
    raw: rawUrl,
    host: ['{{baseUrl}}'],
    path: pathParts,
    ...(query ? { query } : {}),
  }
}

function standardHeaders(isProtected: boolean = true, isJson: boolean = true): PostmanHeader[] {
  const headers: PostmanHeader[] = []
  if (isProtected) {
    headers.push({
      key: 'Authorization',
      value: 'Bearer {{accessToken}}',
      type: 'text',
    })
  }
  if (isJson) {
    headers.push({
      key: 'Content-Type',
      value: 'application/json',
      type: 'text',
    })
  }
  return headers
}

function standardTest(expectedStatuses: number[] = [200, 201], customScript: string[] = []): PostmanEvent[] {
  const statusesStr = expectedStatuses.join(', ')
  const scriptLines = [
    `pm.test("Status code is ${statusesStr}", function () {`,
    `    pm.expect(pm.response.code).to.be.oneOf([${statusesStr}]);`,
    `});`,
    ...customScript,
  ]

  return [
    {
      listen: 'test',
      script: {
        type: 'text/javascript',
        exec: scriptLines,
      },
    },
  ]
}

export function generatePostmanCollection(): PostmanCollection {
  const folders: PostmanFolderItem[] = [
    // -----------------------------------------------------------------------------------
    // 1. Auth
    // -----------------------------------------------------------------------------------
    {
      name: '1. Auth',
      description: 'Rotas de autenticação, sessão JWT e login social.',
      item: [
        {
          name: 'POST /auth/session - Login (Obter Token)',
          event: [
            {
              listen: 'test',
              script: {
                type: 'text/javascript',
                exec: [
                  'pm.test("Status code is 200 or 201", function () {',
                  '    pm.expect(pm.response.code).to.be.oneOf([200, 201]);',
                  '});',
                  '',
                  'if (pm.response.code === 200 || pm.response.code === 201) {',
                  '    var jsonData = pm.response.json();',
                  '    pm.environment.set("accessToken", jsonData.access_token);',
                  '}',
                ],
              },
            },
          ],
          request: {
            method: 'POST',
            header: standardHeaders(false, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  username: 'tutor.principal@patanet.app.br',
                  password: '{{testPassword}}',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/auth/session'),
            description: 'Autentica o usuário e define automaticamente a variável accessToken no ambiente.',
          },
        },
        {
          name: 'POST /auth/refresh - Atualizar Token',
          event: standardTest([200, 201], [
            'if (pm.response.code === 200 || pm.response.code === 201) {',
            '    var jsonData = pm.response.json();',
            '    if (jsonData.access_token) {',
            '        pm.environment.set("accessToken", jsonData.access_token);',
            '    }',
            '}',
          ]),
          request: {
            method: 'POST',
            header: standardHeaders(true, true),
            url: parseUrl('{{baseUrl}}/auth/refresh'),
            description: 'Atualiza o token de acesso utilizando o token atual autenticado.',
          },
        },
        {
          name: 'POST /auth/google - Login Social Google',
          event: standardTest([200, 201]),
          request: {
            method: 'POST',
            header: standardHeaders(false, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  idToken: 'simulated-google-oauth-token',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/auth/google'),
            description: 'Autentica ou cadastra usuário via token Google OAuth2.',
          },
        },
      ],
    },

    // -----------------------------------------------------------------------------------
    // 2. Users
    // -----------------------------------------------------------------------------------
    {
      name: '2. Users',
      description: 'Gestão de perfil de usuário, termos de uso LGPD, senha e dados de conta.',
      item: [
        {
          name: 'GET /users/me - Obter Perfil Atual',
          event: standardTest([200, 201], [
            'if (pm.response.code === 200) {',
            '    var user = pm.response.json();',
            '    if (user && user.id) {',
            '        pm.environment.set("defaultUserId", user.id);',
            '    }',
            '}',
          ]),
          request: {
            method: 'GET',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/users/me'),
            description: 'Retorna o perfil completo do usuário autenticado e armazena seu ID.',
          },
        },
        {
          name: 'PATCH /users - Atualizar Perfil Atual',
          event: standardTest([200, 201]),
          request: {
            method: 'PATCH',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  name: 'Mariana Santos',
                  about: 'Tutora apaixonada por pets e bem-estar animal.',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/users'),
            description: 'Atualiza nome, foto e dados biográficos do perfil.',
          },
        },
        {
          name: 'GET /users/me/terms - Consultar Aceite de Termos (LGPD)',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/users/me/terms'),
            description: 'Verifica se o usuário aceitou os Termos de Uso e Política de Privacidade.',
          },
        },
        {
          name: 'POST /users/me/terms/accept - Aceitar Termos de Uso',
          event: standardTest([200, 201]),
          request: {
            method: 'POST',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/users/me/terms/accept'),
            description: 'Registra o aceite do usuário aos Termos de Uso versão atual.',
          },
        },
        {
          name: 'GET /users/terms - Consultar Termos Gerais',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/users/terms'),
            description: 'Endpoint alternativo/legado de consulta de termos.',
          },
        },
        {
          name: 'POST /users/terms/accept - Aceitar Termos (Compatibilidade)',
          event: standardTest([200, 201]),
          request: {
            method: 'POST',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/users/terms/accept'),
            description: 'Endpoint alternativo para aceite de termos de uso.',
          },
        },
        {
          name: 'GET /users/:id - Buscar Usuário por ID',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/users/{{defaultUserId}}'),
            description: 'Retorna os dados públicos de um usuário pelo ID.',
          },
        },
        {
          name: 'GET /users - Listar Usuários (Paginação)',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/users?page=1&perPage=10'),
            description: 'Lista usuários cadastrados na plataforma com paginação.',
          },
        },
        {
          name: 'POST /users - Cadastrar Novo Usuário',
          event: standardTest([200, 201]),
          request: {
            method: 'POST',
            header: standardHeaders(false, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  name: 'Novo Tutor Postman',
                  username: 'novo.tutor.postman',
                  email: 'novo.tutor.postman@patanet.app.br',
                  password: '{{testPassword}}',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/users'),
            description: 'Registra uma nova conta de tutor no sistema.',
          },
        },
        {
          name: 'PATCH /users/password - Alterar Senha',
          event: standardTest([200, 201]),
          request: {
            method: 'PATCH',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  oldPassword: '{{testPassword}}',
                  newPassword: '{{testPassword}}',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/users/password'),
            description: 'Altera a senha do usuário autenticado.',
          },
        },
        {
          name: 'PATCH /users/:id/role - Alterar Papel do Usuário (Admin)',
          event: standardTest([200, 201]),
          request: {
            method: 'PATCH',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  role: 'TUTOR',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/users/{{defaultUserId}}/role'),
            description: 'Permite ao administrador alterar a role de um usuário.',
          },
        },
        {
          name: 'POST /users/me/google - Vincular Conta Google',
          event: standardTest([200, 201]),
          request: {
            method: 'POST',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  idToken: 'google-oauth-token-to-link',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/users/me/google'),
            description: 'Vincula a conta Google ao perfil autenticado.',
          },
        },
        {
          name: 'DELETE /users/me/google - Desvincular Conta Google',
          event: standardTest([200, 201, 204]),
          request: {
            method: 'DELETE',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/users/me/google'),
            description: 'Desvincula o login social Google da conta.',
          },
        },
        {
          name: 'POST /delete-account - Solicitar Exclusão de Conta (LGPD)',
          event: standardTest([200, 201]),
          request: {
            method: 'POST',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  reason: 'Solicitação de exclusão para testes de conformidade LGPD',
                  password: '{{testPassword}}',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/delete-account'),
            description: 'Inicia o fluxo de exclusão de conta e anonimização de dados pessoais.',
          },
        },
        {
          name: 'DELETE /users/:id - Deletar Usuário por ID (Admin)',
          event: standardTest([200, 201, 204]),
          request: {
            method: 'DELETE',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/users/{{defaultUserId}}'),
            description: 'Permite a exclusão de um usuário específico pelo Admin.',
          },
        },
        {
          name: 'DELETE /users - Deletar Usuário Atual',
          event: standardTest([200, 201, 204]),
          request: {
            method: 'DELETE',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/users'),
            description: 'Exclui a conta do usuário logado.',
          },
        },
      ],
    },

    // -----------------------------------------------------------------------------------
    // 3. Catalog
    // -----------------------------------------------------------------------------------
    {
      name: '3. Catalog',
      description: 'Catálogo taxonômico oficial de espécies e raças de animais.',
      item: [
        {
          name: 'GET /animals/species - Listar Espécies Oficiais',
          event: standardTest([200, 201], [
            'if (pm.response.code === 200) {',
            '    var species = pm.response.json();',
            '    if (Array.isArray(species) && species.length > 0) {',
            '        pm.environment.set("defaultSpecieId", species[0].id);',
            '    }',
            '}',
          ]),
          request: {
            method: 'GET',
            header: standardHeaders(false, false),
            url: parseUrl('{{baseUrl}}/animals/species'),
            description: 'Retorna a lista oficial de espécies registradas (ex: Cão, Gato).',
          },
        },
        {
          name: 'GET /animals/breeds - Listar Todas as Raças',
          event: standardTest([200, 201], [
            'if (pm.response.code === 200) {',
            '    var breeds = pm.response.json();',
            '    if (Array.isArray(breeds) && breeds.length > 0) {',
            '        pm.environment.set("defaultBreedId", breeds[0].id);',
            '    }',
            '}',
          ]),
          request: {
            method: 'GET',
            header: standardHeaders(false, false),
            url: parseUrl('{{baseUrl}}/animals/breeds'),
            description: 'Retorna a lista completa de raças oficiais do catálogo.',
          },
        },
        {
          name: 'GET /animals/breeds?specieId=... - Filtrar Raças por Espécie',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(false, false),
            url: parseUrl('{{baseUrl}}/animals/breeds?specieId={{defaultSpecieId}}'),
            description: 'Retorna raças filtradas pelo identificador da espécie.',
          },
        },
      ],
    },

    // -----------------------------------------------------------------------------------
    // 4. Pets
    // -----------------------------------------------------------------------------------
    {
      name: '4. Pets',
      description: 'Cadastro, edição, visibilidade e mídias de pets.',
      item: [
        {
          name: 'POST /animals - Cadastrar Pet',
          event: standardTest([200, 201], [
            'if (pm.response.code === 200 || pm.response.code === 201) {',
            '    var pet = pm.response.json();',
            '    if (pet && pet.id) {',
            '        pm.environment.set("defaultPetId", pet.id);',
            '    }',
            '}',
          ]),
          request: {
            method: 'POST',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  name: 'Pipoca',
                  about: 'Cãozinho muito alegre, dócil e companheiro.',
                  weight: 12.5,
                  size: 'MEDIUM',
                  gender: 'MALE',
                  breedId: '{{defaultBreedId}}',
                  isForAdoption: false,
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/animals'),
            description: 'Cadastra um novo animal associado ao tutor logado.',
          },
        },
        {
          name: 'GET /animals/:id - Obter Detalhes do Pet',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/animals/{{defaultPetId}}'),
            description: 'Retorna informações completas do animal especificado.',
          },
        },
        {
          name: 'PATCH /animals/:id - Atualizar Dados do Pet',
          event: standardTest([200, 201]),
          request: {
            method: 'PATCH',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  name: 'Pipoca Santos',
                  weight: 13.0,
                  about: 'Cãozinho alegre, dócil e com peso atualizado.',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/animals/{{defaultPetId}}'),
            description: 'Atualiza informações cadastrais e biométricas do pet.',
          },
        },
        {
          name: 'POST /animals/:animalId/hide - Ocultar Pet',
          event: standardTest([200, 201]),
          request: {
            method: 'POST',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/animals/{{defaultPetId}}/hide'),
            description: 'Oculta o pet da visualização pública no ecossistema.',
          },
        },
        {
          name: 'POST /animals/:animalId/unhide - Reexibir Pet',
          event: standardTest([200, 201]),
          request: {
            method: 'POST',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/animals/{{defaultPetId}}/unhide'),
            description: 'Restaura a visibilidade pública do pet.',
          },
        },
        {
          name: 'POST /animals/medias/:animalId - Upload de Mídia do Pet',
          event: standardTest([200, 201]),
          request: {
            method: 'POST',
            header: standardHeaders(true, false),
            body: {
              mode: 'formdata',
              formdata: [
                {
                  key: 'file',
                  type: 'file',
                  description: 'Arquivo de imagem do pet (JPEG/PNG)',
                },
              ],
            },
            url: parseUrl('{{baseUrl}}/animals/medias/{{defaultPetId}}'),
            description: 'Envia foto do pet para o armazenamento MinIO S3.',
          },
        },
        {
          name: 'GET /animals/medias/:animalId - Listar Mídias do Pet',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/animals/medias/{{defaultPetId}}'),
            description: 'Lista todas as fotos e mídias vinculadas ao pet.',
          },
        },
        {
          name: 'DELETE /animals/:animalId/medias/:mediaId - Remover Mídia do Pet',
          event: standardTest([200, 201, 204]),
          request: {
            method: 'DELETE',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/animals/{{defaultPetId}}/medias/{{defaultMediaId}}'),
            description: 'Exclui uma mídia previamente enviada do pet.',
          },
        },
        {
          name: 'DELETE /animals/:id - Deletar Pet',
          event: standardTest([200, 201, 204]),
          request: {
            method: 'DELETE',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/animals/{{defaultPetId}}'),
            description: 'Remove o cadastro do animal e seus dados associados.',
          },
        },
      ],
    },

    // -----------------------------------------------------------------------------------
    // 5. Owners
    // -----------------------------------------------------------------------------------
    {
      name: '5. Owners',
      description: 'Gestão de tutoria compartilhada, co-tutores e transferência de custódia.',
      item: [
        {
          name: 'GET /animals/owners/:id - Listar Pets do Tutor',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/animals/owners/{{defaultUserId}}'),
            description: 'Lista todos os pets sob a tutoria primária ou secundária do usuário.',
          },
        },
        {
          name: 'POST /animals/:animalId/owners/:ownerId - Adicionar Co-Tutor',
          event: standardTest([200, 201]),
          request: {
            method: 'POST',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/animals/{{defaultPetId}}/owners/{{cotutorUserId}}'),
            description: 'Concede acesso e permissão de co-tutoria a outro usuário.',
          },
        },
        {
          name: 'PATCH /animals/:animalId/owners/:ownerId/primary - Transferir Tutoria Primária',
          event: standardTest([200, 201]),
          request: {
            method: 'PATCH',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/animals/{{defaultPetId}}/owners/{{cotutorUserId}}/primary'),
            description: 'Transfere o papel de tutor primário/titular para o co-tutor.',
          },
        },
        {
          name: 'DELETE /animals/:animalId/owners/:ownerId - Remover Co-Tutor',
          event: standardTest([200, 201, 204]),
          request: {
            method: 'DELETE',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/animals/{{defaultPetId}}/owners/{{cotutorUserId}}'),
            description: 'Revoga o acesso de co-tutoria de um usuário ao animal.',
          },
        },
      ],
    },

    // -----------------------------------------------------------------------------------
    // 6. Health
    // -----------------------------------------------------------------------------------
    {
      name: '6. Health',
      description: 'Prontuário sanitário digital: vacinas, vermífugos e medicações.',
      item: [
        {
          name: 'POST /animals/vaccines/:animalId - Registrar Vacina',
          event: standardTest([200, 201], [
            'if (pm.response.code === 200 || pm.response.code === 201) {',
            '    var data = pm.response.json();',
            '    if (data && data.id) {',
            '        pm.environment.set("defaultVaccineId", data.id);',
            '    }',
            '}',
          ]),
          request: {
            method: 'POST',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  name: 'Antirrábica',
                  applicationDate: '2026-01-15T00:00:00.000Z',
                  nextApplicationDate: '2027-01-15T00:00:00.000Z',
                  laboratory: 'Zoetis',
                  batch: 'BR-987654',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/animals/vaccines/{{defaultPetId}}'),
            description: 'Registra uma nova dose de vacina na caderneta de saúde do pet.',
          },
        },
        {
          name: 'GET /animals/vaccines/:animalId - Listar Vacinas do Pet',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/animals/vaccines/{{defaultPetId}}'),
            description: 'Retorna a lista de todas as vacinas aplicadas no animal.',
          },
        },
        {
          name: 'PATCH /animals/:animalId/vaccines/:vaccineId - Atualizar Vacina',
          event: standardTest([200, 201]),
          request: {
            method: 'PATCH',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  laboratory: 'Zoetis Brasil',
                  batch: 'BR-987654-REV',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/animals/{{defaultPetId}}/vaccines/{{defaultVaccineId}}'),
            description: 'Atualiza lote ou laboratório de registro vacinal.',
          },
        },
        {
          name: 'DELETE /animals/:animalId/vaccines/:vaccineId - Remover Vacina',
          event: standardTest([200, 201, 204]),
          request: {
            method: 'DELETE',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/animals/{{defaultPetId}}/vaccines/{{defaultVaccineId}}'),
            description: 'Exclui um registro de vacina cadastrado por engano.',
          },
        },
        {
          name: 'POST /animals/dewormings/:animalId - Registrar Vermífugo',
          event: standardTest([200, 201], [
            'if (pm.response.code === 200 || pm.response.code === 201) {',
            '    var data = pm.response.json();',
            '    if (data && data.id) {',
            '        pm.environment.set("defaultDewormingId", data.id);',
            '    }',
            '}',
          ]),
          request: {
            method: 'POST',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  name: 'Drontal Plus',
                  applicationDate: '2026-02-10T00:00:00.000Z',
                  nextApplicationDate: '2026-05-10T00:00:00.000Z',
                  dose: '1 comprimido para 10kg',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/animals/dewormings/{{defaultPetId}}'),
            description: 'Adiciona registro de vermifugação ao prontuário.',
          },
        },
        {
          name: 'GET /animals/dewormings/:animalId - Listar Vermífugos do Pet',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/animals/dewormings/{{defaultPetId}}'),
            description: 'Retorna o histórico de vermifugação do pet.',
          },
        },
        {
          name: 'PATCH /animals/:animalId/dewormings/:dewormingId - Atualizar Vermífugo',
          event: standardTest([200, 201]),
          request: {
            method: 'PATCH',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  dose: '1.5 comprimidos',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/animals/{{defaultPetId}}/dewormings/{{defaultDewormingId}}'),
            description: 'Atualiza dosagem ou notas de vermífugo.',
          },
        },
        {
          name: 'DELETE /animals/:animalId/dewormings/:dewormingId - Remover Vermífugo',
          event: standardTest([200, 201, 204]),
          request: {
            method: 'DELETE',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/animals/{{defaultPetId}}/dewormings/{{defaultDewormingId}}'),
            description: 'Exclui o registro de vermifugação especificado.',
          },
        },
        {
          name: 'POST /animals/medications/:animalId - Registrar Medicação',
          event: standardTest([200, 201], [
            'if (pm.response.code === 200 || pm.response.code === 201) {',
            '    var data = pm.response.json();',
            '    if (data && data.id) {',
            '        pm.environment.set("defaultMedicationId", data.id);',
            '    }',
            '}',
          ]),
          request: {
            method: 'POST',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  name: 'Apoquel 16mg',
                  dosage: '16mg',
                  frequency: '1 comprimido a cada 12 horas',
                  startDate: '2026-03-01T00:00:00.000Z',
                  endDate: '2026-03-15T00:00:00.000Z',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/animals/medications/{{defaultPetId}}'),
            description: 'Registra novo tratamento medicamentoso do pet.',
          },
        },
        {
          name: 'GET /animals/medications/:animalId - Listar Medicações do Pet',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/animals/medications/{{defaultPetId}}'),
            description: 'Lista tratamentos e medicações ativas ou passadas do pet.',
          },
        },
        {
          name: 'PATCH /animals/:animalId/medications/:medicationId - Atualizar Medicação',
          event: standardTest([200, 201]),
          request: {
            method: 'PATCH',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  dosage: '8mg (dose reduzida)',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/animals/{{defaultPetId}}/medications/{{defaultMedicationId}}'),
            description: 'Atualiza dosagem e posologia do medicamento.',
          },
        },
        {
          name: 'DELETE /animals/:animalId/medications/:medicationId - Remover Medicação',
          event: standardTest([200, 201, 204]),
          request: {
            method: 'DELETE',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/animals/{{defaultPetId}}/medications/{{defaultMedicationId}}'),
            description: 'Exclui o registro medicamentoso especificado.',
          },
        },
      ],
    },

    // -----------------------------------------------------------------------------------
    // 7. Posts & Feed
    // -----------------------------------------------------------------------------------
    {
      name: '7. Posts & Feed',
      description: 'Rede social pet: postagens no feed, curtidas, comentários e filtros de bloqueio.',
      item: [
        {
          name: 'POST /posts - Criar Postagem',
          event: standardTest([200, 201], [
            'if (pm.response.code === 200 || pm.response.code === 201) {',
            '    var post = pm.response.json();',
            '    if (post && post.id) {',
            '        pm.environment.set("defaultPostId", post.id);',
            '    }',
            '}',
          ]),
          request: {
            method: 'POST',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  content: 'Dia de parque incrível com o Rex! 🐾🌳',
                  animalId: '{{defaultPetId}}',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/posts'),
            description: 'Publica um novo post no feed social do ecossistema.',
          },
        },
        {
          name: 'GET /posts/feed - Obter Feed Social',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/posts/feed?page=1&perPage=10'),
            description: 'Retorna a linha do tempo social filtrando usuários bloqueados.',
          },
        },
        {
          name: 'GET /posts/me - Listar Minhas Postagens',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/posts/me?page=1&perPage=10'),
            description: 'Retorna a lista de postagens criadas pelo usuário autenticado.',
          },
        },
        {
          name: 'GET /posts/user/:id - Listar Postagens de Outro Usuário',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/posts/user/{{defaultUserId}}?page=1&perPage=10'),
            description: 'Lista postagens públicas de um usuário específico.',
          },
        },
        {
          name: 'GET /posts/:id - Obter Detalhes do Post',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/posts/{{defaultPostId}}'),
            description: 'Retorna detalhes do post com comentários e curtidas.',
          },
        },
        {
          name: 'PATCH /posts/:postId - Atualizar Postagem',
          event: standardTest([200, 201]),
          request: {
            method: 'PATCH',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  content: 'Dia de parque incrível com o Rex! Atualizado com novas fotos! 🐾✨',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/posts/{{defaultPostId}}'),
            description: 'Edita a legenda de uma postagem do usuário.',
          },
        },
        {
          name: 'POST /posts/like/:id - Curtir Post',
          event: standardTest([200, 201]),
          request: {
            method: 'POST',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/posts/like/{{defaultPostId}}'),
            description: 'Adiciona curtida ao post especificado.',
          },
        },
        {
          name: 'DELETE /posts/like/:id - Descurtir Post',
          event: standardTest([200, 201, 204]),
          request: {
            method: 'DELETE',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/posts/like/{{defaultPostId}}'),
            description: 'Remove a curtida do post especificado.',
          },
        },
        {
          name: 'POST /posts/comment/:id - Adicionar Comentário',
          event: standardTest([200, 201], [
            'if (pm.response.code === 200 || pm.response.code === 201) {',
            '    var comment = pm.response.json();',
            '    if (comment && comment.id) {',
            '        pm.environment.set("defaultCommentId", comment.id);',
            '    }',
            '}',
          ]),
          request: {
            method: 'POST',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  content: 'Que pet mais lindo! Parabéns pelo cuidado! ❤️',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/posts/comment/{{defaultPostId}}'),
            description: 'Cria um comentário na postagem especificada.',
          },
        },
        {
          name: 'PATCH /posts/:postId/comment/:commentId - Atualizar Comentário',
          event: standardTest([200, 201]),
          request: {
            method: 'PATCH',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  content: 'Que pet mais lindo! Parabéns pelo cuidado! (Editado) ❤️🐕',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/posts/{{defaultPostId}}/comment/{{defaultCommentId}}'),
            description: 'Edita um comentário de autoria do usuário logado.',
          },
        },
        {
          name: 'DELETE /posts/:postId/comment/:commentId - Deletar Comentário',
          event: standardTest([200, 201, 204]),
          request: {
            method: 'DELETE',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/posts/{{defaultPostId}}/comment/{{defaultCommentId}}'),
            description: 'Exclui um comentário especificado da postagem.',
          },
        },
        {
          name: 'DELETE /posts/:id - Deletar Postagem',
          event: standardTest([200, 201, 204]),
          request: {
            method: 'DELETE',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/posts/{{defaultPostId}}'),
            description: 'Remove a postagem e seus comentários do feed.',
          },
        },
      ],
    },

    // -----------------------------------------------------------------------------------
    // 8. Connections
    // -----------------------------------------------------------------------------------
    {
      name: '8. Connections',
      description: 'Grafo de conexões sociais: seguir, deixar de seguir, seguidores e resumo de vínculos.',
      item: [
        {
          name: 'POST /connections/:id - Seguir Usuário',
          event: standardTest([200, 201]),
          request: {
            method: 'POST',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/connections/{{targetUserId}}'),
            description: 'Segue o usuário especificado pelo identificador.',
          },
        },
        {
          name: 'DELETE /connections/:id - Deixar de Seguir Usuário',
          event: standardTest([200, 201, 204]),
          request: {
            method: 'DELETE',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/connections/{{targetUserId}}'),
            description: 'Deixa de seguir o usuário especificado.',
          },
        },
        {
          name: 'GET /connections/summary/:id - Resumo de Conexões',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/connections/summary/{{targetUserId}}'),
            description: 'Retorna contagem de seguidores, seguindo e status mútuo de conexão.',
          },
        },
        {
          name: 'GET /connections/followers/:id - Listar Seguidores',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/connections/followers/{{targetUserId}}?page=1&perPage=10'),
            description: 'Retorna a lista paginada de seguidores do usuário.',
          },
        },
        {
          name: 'GET /connections/following/:id - Listar Seguindo',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/connections/following/{{targetUserId}}?page=1&perPage=10'),
            description: 'Retorna a lista paginada de perfis que o usuário segue.',
          },
        },
      ],
    },

    // -----------------------------------------------------------------------------------
    // 9. Moderation
    // -----------------------------------------------------------------------------------
    {
      name: '9. Moderation',
      description: 'Ferramentas de segurança comunitária: bloqueio entre usuários e denúncias de moderação.',
      item: [
        {
          name: 'POST /blocks/:id - Bloquear Usuário',
          event: standardTest([200, 201]),
          request: {
            method: 'POST',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/blocks/{{targetUserId}}'),
            description: 'Bloqueia o usuário especificado, ocultando interações no feed.',
          },
        },
        {
          name: 'GET /blocks - Listar Usuários Bloqueados',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/blocks?page=1&perPage=10'),
            description: 'Lista todos os usuários bloqueados pelo perfil autenticado.',
          },
        },
        {
          name: 'DELETE /blocks/:id - Desbloquear Usuário',
          event: standardTest([200, 201, 204]),
          request: {
            method: 'DELETE',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/blocks/{{targetUserId}}'),
            description: 'Remove o bloqueio aplicado ao usuário especificado.',
          },
        },
        {
          name: 'POST /reports - Criar Denúncia',
          event: standardTest([200, 201], [
            'if (pm.response.code === 200 || pm.response.code === 201) {',
            '    var report = pm.response.json();',
            '    if (report && report.id) {',
            '        pm.environment.set("defaultReportId", report.id);',
            '    }',
            '}',
          ]),
          request: {
            method: 'POST',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  reason: 'Comportamento suspeito ou violação dos Termos de Uso',
                  reportedUserId: '{{targetUserId}}',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/reports'),
            description: 'Registra uma denúncia contra um usuário ou conteúdo inapropriado.',
          },
        },
        {
          name: 'GET /reports/mine - Listar Minhas Denúncias',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/reports/mine?page=1&perPage=10'),
            description: 'Lista o histórico de denúncias abertas pelo usuário logado.',
          },
        },
        {
          name: 'PATCH /reports/:id/status - Atualizar Status da Denúncia (Admin)',
          event: standardTest([200, 201]),
          request: {
            method: 'PATCH',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  status: 'RESOLVED',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/reports/{{defaultReportId}}/status'),
            description: 'Permite ao Administrador deferir, analisar ou resolver uma denúncia.',
          },
        },
      ],
    },

    // -----------------------------------------------------------------------------------
    // 10. Events
    // -----------------------------------------------------------------------------------
    {
      name: '10. Events',
      description: 'Gestão de feiras, encontros comunitários e adoção presencial em eventos.',
      item: [
        {
          name: 'POST /events - Criar Evento Pet',
          event: standardTest([200, 201], [
            'if (pm.response.code === 200 || pm.response.code === 201) {',
            '    var ev = pm.response.json();',
            '    if (ev && ev.id) {',
            '        pm.environment.set("defaultEventId", ev.id);',
            '    }',
            '}',
          ]),
          request: {
            method: 'POST',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  title: 'Feira Comunitária de Adoção e Cuidados Pet',
                  description: 'Encontro com palestras veterinárias e oportunidade de adotar um melhor amigo.',
                  eventDate: '2026-11-20T10:00:00.000Z',
                  addressLine: 'Praça das Flores, 123',
                  addressCity: 'São Paulo',
                  addressState: 'SP',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/events'),
            description: 'Cadastra um novo evento público no calendário da comunidade.',
          },
        },
        {
          name: 'GET /events - Listar Eventos',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(false, false),
            url: parseUrl('{{baseUrl}}/events?page=1&perPage=10'),
            description: 'Lista eventos futuros disponíveis na plataforma.',
          },
        },
        {
          name: 'GET /events/:id - Obter Detalhes do Evento',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(false, false),
            url: parseUrl('{{baseUrl}}/events/{{defaultEventId}}'),
            description: 'Retorna informações detalhadas do evento especificado.',
          },
        },
        {
          name: 'PUT /events/:id - Atualizar Evento',
          event: standardTest([200, 201]),
          request: {
            method: 'PUT',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  title: 'Feira Comunitária de Adoção Pet (Edição Especial)',
                  description: 'Horário expandido e estande de doação de ração!',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/events/{{defaultEventId}}'),
            description: 'Atualiza o título, descrição ou dados de localização do evento.',
          },
        },
        {
          name: 'POST /events/:id/repost - Repostar Evento',
          event: standardTest([200, 201]),
          request: {
            method: 'POST',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/events/{{defaultEventId}}/repost'),
            description: 'Compartilha o evento no feed pessoal do usuário.',
          },
        },
        {
          name: 'GET /events/:id/attendees - Listar Participantes',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(false, false),
            url: parseUrl('{{baseUrl}}/events/{{defaultEventId}}/attendees'),
            description: 'Retorna a lista de pessoas confirmadas no evento.',
          },
        },
        {
          name: 'GET /events/:id/attend - Verificar Minha Presença',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/events/{{defaultEventId}}/attend'),
            description: 'Verifica se o usuário logado confirmou presença no evento.',
          },
        },
        {
          name: 'POST /events/:id/attend - Confirmar Presença',
          event: standardTest([200, 201]),
          request: {
            method: 'POST',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/events/{{defaultEventId}}/attend'),
            description: 'Confirma a participação no evento especificado.',
          },
        },
        {
          name: 'DELETE /events/:id/attend - Cancelar Presença',
          event: standardTest([200, 201, 204]),
          request: {
            method: 'DELETE',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/events/{{defaultEventId}}/attend'),
            description: 'Cancela a participação previamente confirmada no evento.',
          },
        },
        {
          name: 'POST /events/:id/adoptable-animals - Inscrever Animal para Adoção no Evento',
          event: standardTest([200, 201]),
          request: {
            method: 'POST',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  animalId: '{{defaultPetId}}',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/events/{{defaultEventId}}/adoptable-animals'),
            description: 'Inscreve um pet disponível para ser adotado presencialmente no evento.',
          },
        },
        {
          name: 'POST /events/:id/adoptable-animals/:animalId/transfer - Transferir Tutoria no Evento',
          event: standardTest([200, 201]),
          request: {
            method: 'POST',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  newOwnerId: '{{adopterUserId}}',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/events/{{defaultEventId}}/adoptable-animals/{{defaultPetId}}/transfer'),
            description: 'Conclui a formalização de adoção com transferência de custódia presencial.',
          },
        },
        {
          name: 'DELETE /events/:id - Deletar Evento',
          event: standardTest([200, 201, 204]),
          request: {
            method: 'DELETE',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/events/{{defaultEventId}}'),
            description: 'Remove o evento da plataforma.',
          },
        },
      ],
    },

    // -----------------------------------------------------------------------------------
    // 11. Adoptions
    // -----------------------------------------------------------------------------------
    {
      name: '11. Adoptions',
      description: 'Fluxo completo de Adoção Responsável: catálogo de adotáveis, candidaturas e aprovação.',
      item: [
        {
          name: 'GET /animals/adoptable - Vitrine de Animais para Adoção',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(false, false),
            url: parseUrl('{{baseUrl}}/animals/adoptable?page=1&perPage=10'),
            description: 'Lista os pets cadastrados que estão marcados como disponíveis para adoção.',
          },
        },
        {
          name: 'POST /animals/:id/adopt - Manifestar Interesse de Adoção',
          event: standardTest([200, 201]),
          request: {
            method: 'POST',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/animals/{{defaultPetId}}/adopt'),
            description: 'Demonstra interesse rápido de adoção de um pet disponível.',
          },
        },
        {
          name: 'POST /animals/:id/adoption-requests - Submeter Solicitação Formal de Adoção',
          event: standardTest([200, 201], [
            'if (pm.response.code === 200 || pm.response.code === 201) {',
            '    var reqData = pm.response.json();',
            '    if (reqData && reqData.id) {',
            '        pm.environment.set("defaultAdoptionRequestId", reqData.id);',
            '    }',
            '}',
          ]),
          request: {
            method: 'POST',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  notes: 'Possuo casa própria com quintal cercado, tempo para passeios diários e muito amor.',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/animals/{{defaultPetId}}/adoption-requests'),
            description: 'Submete uma proposta formal de adoção responsável com justificativa e condições.',
          },
        },
        {
          name: 'PATCH /adoption-requests/:id/approve - Aprovar Solicitação de Adoção',
          event: standardTest([200, 201]),
          request: {
            method: 'PATCH',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/adoption-requests/{{defaultAdoptionRequestId}}/approve'),
            description: 'O atual tutor ou ONG aprova a candidatura e formaliza a custódia.',
          },
        },
        {
          name: 'PATCH /adoption-requests/:id/reject - Rejeitar Solicitação de Adoção',
          event: standardTest([200, 201]),
          request: {
            method: 'PATCH',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  rejectionReason: 'Perfil não compatível com o temperamento ou necessidades de espaço do pet.',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/adoption-requests/{{defaultAdoptionRequestId}}/reject'),
            description: 'Recusa formalmente a solicitação de adoção fornecendo o motivo.',
          },
        },
      ],
    },

    // -----------------------------------------------------------------------------------
    // 12. Vet
    // -----------------------------------------------------------------------------------
    {
      name: '12. Vet',
      description: 'Módulo Clínico Veterinário: validação de CRMV, autorização clínica e prontuário médico.',
      item: [
        {
          name: 'POST /vet/apply - Solicitar Homologação de CRMV',
          event: standardTest([200, 201], [
            'if (pm.response.code === 200 || pm.response.code === 201) {',
            '    var vet = pm.response.json();',
            '    if (vet && vet.id) {',
            '        pm.environment.set("defaultVetProfileId", vet.id);',
            '    }',
            '}',
          ]),
          request: {
            method: 'POST',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  crmv: '12345/SP',
                  crmvState: 'SP',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/vet/apply'),
            description: 'Veterinário envia credenciais profissionais para auditoria pelo Admin.',
          },
        },
        {
          name: 'PATCH /admin/vet/:id/status - Aprovar/Rejeitar CRMV (Admin)',
          event: standardTest([200, 201]),
          request: {
            method: 'PATCH',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  status: 'APPROVED',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/admin/vet/{{defaultVetProfileId}}/status'),
            description: 'Administrador valida o CRMV do veterinário conferindo o status oficial.',
          },
        },
        {
          name: 'POST /animals/:id/authorize-vet - Autorizar Acesso Clínico ao Pet',
          event: standardTest([200, 201]),
          request: {
            method: 'POST',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  veterinarianUserId: '{{vetUserId}}',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/animals/{{defaultPetId}}/authorize-vet'),
            description: 'Tutor concede permissão para o veterinário emitir laudos e visualizar prontuário.',
          },
        },
        {
          name: 'POST /animals/:id/medical-records - Criar Prontuário Médico Digital',
          event: standardTest([200, 201]),
          request: {
            method: 'POST',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  title: 'Consulta Clínica de Rotina e Profilaxia',
                  description: 'Animal em excelente estado nutricional, frequência cardíaca normal e pelagem íntegra.',
                  diagnosis: 'Paciente saudável e sem queixas',
                  prescription: 'Manter vacinação anual e vermifugação a cada 3 meses',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/animals/{{defaultPetId}}/medical-records'),
            description: 'Veterinário homologado registra anotação clínica oficial assinada pelo CRMV.',
          },
        },
      ],
    },

    // -----------------------------------------------------------------------------------
    // 13. Petshops
    // -----------------------------------------------------------------------------------
    {
      name: '13. Petshops',
      description: 'Credenciamento de Petshops Parceiras PJ e auditoria administrativa.',
      item: [
        {
          name: 'POST /petshops/apply - Solicitar Credenciamento de Petshop PJ',
          event: standardTest([200, 201], [
            'if (pm.response.code === 200 || pm.response.code === 201) {',
            '    var petshop = pm.response.json();',
            '    if (petshop && petshop.id) {',
            '        pm.environment.set("defaultPetshopProfileId", petshop.id);',
            '    }',
            '}',
          ]),
          request: {
            method: 'POST',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  cnpj: '12.345.678/0001-90',
                  businessName: 'Pet Center Amigo Fiel',
                  responsavelTecnicoNome: 'Dr. Carlos Eduardo Vet',
                  addressLine: 'Av. Paulista, 1000',
                  addressCity: 'São Paulo',
                  addressState: 'SP',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/petshops/apply'),
            description: 'Empresa envia CNPJ e dados cadastrais para se tornar parceira oficial.',
          },
        },
        {
          name: 'PATCH /admin/petshops/:id/status - Aprovar/Rejeitar Petshop PJ (Admin)',
          event: standardTest([200, 201]),
          request: {
            method: 'PATCH',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  status: 'APPROVED',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/admin/petshops/{{defaultPetshopProfileId}}/status'),
            description: 'Administrador analisa a documentação e aprova a petshop na plataforma.',
          },
        },
      ],
    },

    // -----------------------------------------------------------------------------------
    // 14. Support
    // -----------------------------------------------------------------------------------
    {
      name: '14. Support',
      description: 'Central de Ajuda: tickets de suporte, mensagens e atendimento ao tutor.',
      item: [
        {
          name: 'POST /support - Abrir Ticket de Suporte',
          event: standardTest([200, 201], [
            'if (pm.response.code === 200 || pm.response.code === 201) {',
            '    var ticket = pm.response.json();',
            '    if (ticket && ticket.id) {',
            '        pm.environment.set("defaultTicketId", ticket.id);',
            '    }',
            '}',
          ]),
          request: {
            method: 'POST',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  subject: 'Dúvida sobre registro de carteira de vacinas',
                  description: 'Gostaria de saber como vincular a assinatura do meu veterinário nas doses anteriores.',
                  category: 'HEALTH',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/support'),
            description: 'Abre um chamado para atendimento pela equipe de suporte da PataNet.',
          },
        },
        {
          name: 'GET /support/mine - Listar Meus Tickets',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/support/mine?page=1&perPage=10'),
            description: 'Retorna a lista de chamados de suporte abertos pelo usuário.',
          },
        },
        {
          name: 'GET /support/all - Listar Todos os Tickets (Admin/Suporte)',
          event: standardTest([200, 201]),
          request: {
            method: 'GET',
            header: standardHeaders(true, false),
            url: parseUrl('{{baseUrl}}/support/all?page=1&perPage=10'),
            description: 'Visão administrativa de todos os chamados abertos no sistema.',
          },
        },
        {
          name: 'POST /support/:id/messages - Enviar Mensagem no Ticket',
          event: standardTest([200, 201]),
          request: {
            method: 'POST',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  message: 'Consegui localizar o CRMV do profissional, segue em anexo para conferência.',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/support/{{defaultTicketId}}/messages'),
            description: 'Adiciona uma mensagem de interação na conversa do ticket.',
          },
        },
        {
          name: 'PATCH /support/:id/status - Atualizar Status do Ticket (Suporte/Admin)',
          event: standardTest([200, 201]),
          request: {
            method: 'PATCH',
            header: standardHeaders(true, true),
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                {
                  status: 'RESOLVED',
                },
                null,
                2,
              ),
              options: { raw: { language: 'json' } },
            },
            url: parseUrl('{{baseUrl}}/support/{{defaultTicketId}}/status'),
            description: 'Atualiza o status de atendimento do ticket (IN_PROGRESS, RESOLVED, CLOSED).',
          },
        },
      ],
    },
  ]

  return {
    info: {
      _postman_id: 'c8a291f0-4df2-4f30-bfae-2895f8507026',
      name: 'PataNet Complete E2E',
      description:
        'Coleção completa de testes E2E do ecossistema PataNet cobrindo 100% das rotas e contratos da API NestJS, organizada rigorosamente nas 14 baterias funcionais.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: folders,
    variable: [
      {
        key: 'baseUrl',
        value: 'http://localhost:3001',
        type: 'string',
      },
    ],
  }
}

export function generatePostmanEnvironment(): PostmanEnvironment {
  return {
    id: 'e44d32e9-74d3-466d-b8d4-539665bc7291',
    name: 'PataNet Local Dev',
    values: [
      {
        key: 'baseUrl',
        value: 'http://localhost:3001',
        type: 'default',
        enabled: true,
      },
      {
        key: 'accessToken',
        value: '',
        type: 'secret',
        enabled: true,
      },
      {
        key: 'testPassword',
        value: 'Patanet@Dev2026!',
        type: 'default',
        enabled: true,
      },
      {
        key: 'defaultPetId',
        value: '',
        type: 'default',
        enabled: true,
      },
      {
        key: 'defaultUserId',
        value: '',
        type: 'default',
        enabled: true,
      },
      {
        key: 'targetUserId',
        value: '',
        type: 'default',
        enabled: true,
      },
      {
        key: 'cotutorUserId',
        value: '',
        type: 'default',
        enabled: true,
      },
      {
        key: 'adopterUserId',
        value: '',
        type: 'default',
        enabled: true,
      },
      {
        key: 'vetUserId',
        value: '',
        type: 'default',
        enabled: true,
      },
      {
        key: 'defaultSpecieId',
        value: '',
        type: 'default',
        enabled: true,
      },
      {
        key: 'defaultBreedId',
        value: '',
        type: 'default',
        enabled: true,
      },
      {
        key: 'defaultMediaId',
        value: '',
        type: 'default',
        enabled: true,
      },
      {
        key: 'defaultVaccineId',
        value: '',
        type: 'default',
        enabled: true,
      },
      {
        key: 'defaultDewormingId',
        value: '',
        type: 'default',
        enabled: true,
      },
      {
        key: 'defaultMedicationId',
        value: '',
        type: 'default',
        enabled: true,
      },
      {
        key: 'defaultPostId',
        value: '',
        type: 'default',
        enabled: true,
      },
      {
        key: 'defaultCommentId',
        value: '',
        type: 'default',
        enabled: true,
      },
      {
        key: 'defaultReportId',
        value: '',
        type: 'default',
        enabled: true,
      },
      {
        key: 'defaultEventId',
        value: '',
        type: 'default',
        enabled: true,
      },
      {
        key: 'defaultAdoptionRequestId',
        value: '',
        type: 'default',
        enabled: true,
      },
      {
        key: 'defaultVetProfileId',
        value: '',
        type: 'default',
        enabled: true,
      },
      {
        key: 'defaultPetshopProfileId',
        value: '',
        type: 'default',
        enabled: true,
      },
      {
        key: 'defaultTicketId',
        value: '',
        type: 'default',
        enabled: true,
      },
    ],
    _postman_variable_scope: 'environment',
  }
}

function run() {
  const postmanDir = join(__dirname)
  if (!existsSync(postmanDir)) {
    mkdirSync(postmanDir, { recursive: true })
  }

  // 1. Gera e salva a Coleção Postman
  const collection = generatePostmanCollection()
  const collectionPath = join(postmanDir, 'PataNet_Complete_E2E.postman_collection.json')
  writeFileSync(collectionPath, JSON.stringify(collection, null, 2), 'utf-8')

  // Salva também na pasta de convenção postman/collections se existir
  const collectionsSubdir = join(postmanDir, 'collections')
  if (existsSync(collectionsSubdir)) {
    writeFileSync(join(collectionsSubdir, 'PataNet_Complete_E2E.json'), JSON.stringify(collection, null, 2), 'utf-8')
  }

  // 2. Gera e salva o Environment Postman
  const environment = generatePostmanEnvironment()
  const environmentPath = join(postmanDir, 'PataNet_Local_Dev.postman_environment.json')
  writeFileSync(environmentPath, JSON.stringify(environment, null, 2), 'utf-8')

  // Salva também na pasta de convenção postman/environments se existir
  const envSubdir = join(postmanDir, 'environments')
  if (existsSync(envSubdir)) {
    writeFileSync(join(envSubdir, 'PataNet_Local_Dev.json'), JSON.stringify(environment, null, 2), 'utf-8')
  }

  // 3. Imprime métricas e resumo
  let totalRequests = 0
  collection.item.forEach(folder => {
    totalRequests += folder.item.length
  })

  console.log('====================================================')
  console.log('  PataNet - Gerador de Coleção e Environment Postman ')
  console.log('====================================================')
  console.log(`✓ Coleção gerada com sucesso: ${collectionPath}`)
  console.log(`✓ Environment gerado com sucesso: ${environmentPath}`)
  console.log(`✓ Total de Pastas Funcionais: ${collection.item.length}`)
  console.log(`✓ Total de Requisições / Endpoints: ${totalRequests}`)
  console.log('====================================================')
}

if (require.main === module) {
  run()
}
