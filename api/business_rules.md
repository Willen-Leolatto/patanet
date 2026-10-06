# Regras de Negócio — Patanet

---

## Atores do Sistema

- **Usuário**: Qualquer pessoa física com conta ativa na plataforma.
- **Tutor**: Usuário responsável por um ou mais pets.
- **Tutor Principal**: Tutor com autoridade máxima sobre um pet específico (pode adicionar outros tutores ou transferir titularidade).
- **Veterinário**: Role adicional atribuída a um usuário (`VETERINARIAN`). Permite atuar como profissional da saúde animal (com ou sem vínculo com Petshop). Requer controle rigoroso: concessão **exclusiva pelo Administrador** após conferência e validação de documentos (CRMV ativo, UF, documento de identidade e comprovante de regularidade).
- **Petshop / Parceiro**: Conta institucional de Pessoa Jurídica (`PJ`), distinta de uma conta de usuário comum. Requer controle e auditoria rígidos com aprovação manual do Administrador (CNPJ, alvará de funcionamento, identificação do responsável técnico). Podem cadastrar catálogo de serviços, criar eventos, ter veterinários credenciados vinculados e gerenciar animais destinados à **Adoção Responsável**.
- **Administrador**: Usuário com acesso privilegiado, identificado por e-mail cadastrado nas configurações (`ADMIN_EMAILS`), responsável pela gestão da plataforma, moderação, validação documental de veterinários e parceiros.

---

## 1. Contas de Usuário e Segurança

### Cadastro
- Todo usuário precisa de nome, nome de usuário (único), e-mail (único) e senha.
- A senha deve ter no mínimo 8 caracteres.
- O nome de usuário e o e-mail não podem estar em uso por outra conta.
- A foto de perfil é opcional.

### Perfil
- O usuário pode atualizar nome, nome de exibição, bio, foto de perfil, foto de capa, nome de usuário e e-mail.
- Se o usuário trocar de foto de perfil, a foto antiga é removida do storage.
- Para alterar a senha, é necessário informar a senha atual.

### Exclusão de Conta (Conformidade Google Play Store & LGPD)
- O usuário pode solicitar a exclusão definitiva de sua conta tanto **diretamente pelo aplicativo** (Configurações > Excluir Conta) quanto por **link público web** (`/delete-account`), conforme exigido pelas políticas da Google Play Store e pelo Art. 18 da LGPD.
- Ao excluir, todos os dados pessoais do usuário são removidos ou anonimizados: posts, comentários, curtidas, conexões e denúncias.
- Caso o usuário seja o único tutor de pets, o sistema alerta e exige a transferência de custódia ou destinação do animal antes da exclusão definitiva.

---

## 2. Módulo Veterinário

### Concessão e Controle Rígido de Acesso
- O acesso como Veterinário é uma **role especial** concedida na conta de um usuário existente.
- O usuário solicita o credenciamento enviando:
  - Número do CRMV e Estado (UF).
  - Foto do documento profissional / cédula do CRMV.
  - Comprovante de regularidade cadastral.
- O status inicial da solicitação é `PENDING_VALIDATION`.
- **Apenas o Administrador** pode aprovar (`APPROVED`) ou rejeitar (`REJECTED`) a conta após validação nos sistemas dos conselhos regionais.
- O Administrador pode revogar ou suspender a role a qualquer momento por motivo de auditoria ou descumprimento de conduta.

### Atuação Profissional e Autorização do Tutor
- O veterinário pode atuar de forma **autônoma** ou **vinculado a uma ou mais Petshops/Clínicas parceiras**.
- O veterinário só pode interagir com o prontuário de um pet **após contato prévio e autorização expressa do tutor** (relação médico-paciente autorizada na plataforma).
- Com a autorização ativa, o veterinário pode:
  - Registrar e atualizar prontuários clínicos oficiais (`MedicalRecord`).
  - Lançar anamnese, diagnósticos e prescrições médicas.
  - Anotar vacinações oficiais (com lote, fabricante e assinatura/carimbo digital do CRMV).
  - Registrar vermifugações e controle parasitário.
  - Agendar e solicitar exames complementares e procedimentos cirúrgicos/clínicos.
  - Anexar laudos laboratoriais e de imagem no AWS S3.
- Registros clínicos assinados por veterinários possuem selo de autenticidade profissional e histórico imutável para segurança jurídica.

---

## 3. Módulo Petshops & Parceiros

### Natureza da Conta PJ e Cadastro Rígido
- A conta de Petshop/Clínica Parceira **não é uma conta de usuário comum**, mas sim uma entidade institucional (`Organization` / `PetshopPartner`).
- Cadastro exige validação documental rígida pelo Administrador:
  - Razão Social, Nome Fantasia e CNPJ ativo.
  - Endereço físico completo e alvará de funcionamento.
  - Nome, CPF e contato do responsável legal e do responsável técnico.
- A conta só é ativada após validação manual do Administrador.

### Funcionalidades das Petshops
- **Catálogo de Serviços e Anúncios:** Divulgação de serviços (banho, tosa, creche, hotel, vacinação, exames) e produtos com geolocalização e raio de atendimento.
- **Criação de Eventos Oficiais:** Feiras de adoção, campanhas de castração e eventos comunitários.
- **Corpo Clínico Vinculado:** Associação de veterinários credenciados à estrutura da Petshop.

### Adoção Responsável & Transferência Formal de Custódia
- **Proibição de Venda Ilegal de Animais:** É terminantemente proibida a comercialização e venda indiscriminada de animais na plataforma, em conformidade com as diretrizes da Google Play Store e leis de proteção ao bem-estar animal.
- **Pets para Adoção:** Animais cadastrados por Petshops e ONGs parceiras entram obrigatoriamente na modalidade de **Adoção Responsável**.
- **Fluxo de Transferência de Custódia:**
  1. A Petshop cadastra o pet com histórico médico, vacinas e fotos.
  2. O tutor interessado se candidata à adoção pelo app.
  3. Após triagem e entrevista, a Petshop aprova a candidatura.
  4. O sistema processa uma **transferência formal de custódia**: a titularidade do pet migra da conta da Petshop para a conta do novo Tutor, gerando o Termo Digital de Adoção Responsável.
  5. O pet passa a integrar a lista oficial de pets do tutor, preservando todo o histórico de saúde preexistente.

---

## 4. Pets e Tutoria

### Cadastro de pet
- Ao cadastrar um pet, o usuário se torna automaticamente o **Tutor Principal** e o criador.
- São obrigatórios: nome, peso, porte (Pequeno, Médio ou Grande), sexo e raça.
- A raça deve estar previamente cadastrada no catálogo do sistema.
- Campos opcionais: biografia, fotos de referência (rosto, perfil, dorso), data de nascimento e data de adoção.

### Sistema de tutores (co-responsáveis)
- Um pet pode ter vários tutores ao mesmo tempo.
- O **Tutor Principal** pode:
  - Adicionar outros usuários como tutores.
  - Remover outros tutores.
  - Transferir o papel de Tutor Principal para outro tutor.
  - Não pode se remover enquanto for o Tutor Principal.
- Um pet deve ter sempre ao menos um tutor. Não é possível remover o último tutor.
- O criador do pet pode se remover da lista de tutores somente se não for o Tutor Principal e desde que já exista outro tutor.

### Visibilidade do pet
- O Tutor Principal pode ocultar um pet de sua listagem pública.
- Quando oculto, o pet não aparece na lista de pets do tutor para outros usuários.
- Cada tutor controla a visibilidade do pet de forma independente.

### Edição e exclusão
- Apenas tutores podem editar os dados cadastrais de um pet.
- Apenas tutores podem excluir um pet.
- Ao excluir um pet, todos os seus registros de saúde são removidos.

---

## 5. Saúde e Cuidados Básicos

Apenas tutores e veterinários autorizados podem gerenciar os registros de saúde dos pets.

### Vacinas
- Campos obrigatórios: nome da vacina, clínica/profissional e data de aplicação.
- Campos opcionais: data da próxima dose, lote, fabricante e observações.
- Quando inserida por veterinário credenciado, recebe tag de certificação profissional.

### Vermifugações
- Campo obrigatório: nome do produto.
- Campos opcionais: clínica/profissional, data de aplicação, próxima data e observações.

### Medicamentos e Tratamentos
- Campo obrigatório: nome do medicamento.
- Campos opcionais: data de início, data de fim, dosagem, frequência, clínica e observações.

---

## 6. Posts, Feed e Interações

### Criação de Posts
- Todo usuário autenticado pode criar posts.
- O post deve ter ao menos uma legenda (texto não vazio).
- É possível anexar até 5 mídias (imagens validadas contra magic bytes com conversão para WebP).
- É possível marcar um ou mais pets no post.

### Feed Pessoal e Filtro de Bloqueios
- O feed exibe posts do próprio usuário e de usuários seguidos, ordenados do mais recente para o mais antigo.
- **Regra Rígida de Bloqueio:** Posts e comentários de usuários mutuamente bloqueados são sumariamente filtrados da query SQL via cláusula `NOT IN (SELECT blocked_id...)`.

### Curtidas e Comentários
- Qualquer usuário autenticado pode curtir e descurtir posts (máximo 1 curtida por usuário por post).
- Usuários autenticados podem comentar e responder a comentários existentes (aninhamento de 1 nível).
- Apenas o autor do comentário pode editá-lo ou excluí-lo.

---

## 7. Eventos Comunitários

### Criação e Capacidade
- Usuários autenticados e Petshops parceiras podem criar eventos (feiras, encontros, vacinação).
- Campos: título, descrição, data/horário, endereço, coordenadas geográficas, imagem e capacidade máxima de participantes.
- Ao criar um evento, gera-se automaticamente um post vinculado no feed.

### Presença e Lista de Espera (`WAITLIST`)
- O usuário confirma presença via `POST /events/:id/attend`.
- O controle de capacidade é atômico.
- Atingida a capacidade máxima, novas inscrições entram automaticamente em status `WAITLIST`.
- Em caso de cancelamento/desistência de um inscrito confirmado, o primeiro colocado da lista de espera é automaticamente promovido a confirmado.

---

## 8. Moderação de Conteúdo (UGC), Denúncias e Integração Pública

### Conformidade Google Play Store para UGC (User-Generated Content)
- Todo post, comentário, foto ou perfil de usuário possui botão visível e acessível para **Denúncia imediata** e **Bloqueio instantâneo do usuário**.
- O sistema garante que denúncias sejam analisadas com SLA estrito de moderação humana em até 24 horas.

### Categorias de Denúncia
- Geral (spam, conteúdo ofensivo, assédio).
- Violação de termos / Comércio ilegal de animais.
- Maus-tratos, abandono e crueldade animal.
- CSAM / Exploração de vulneráveis (tolerância zero, com remoção e preservação probatória imediata).

### Roteamento e Canal de Comunicação com Entidades Públicas
- **Fluxo Inicial (Triagem Interna):** Todas as denúncias disparam alerta imediato para a equipe de moderação e segurança via e-mail (`REPORT_FORWARDING_EMAIL`).
- **Arquitetura de Despacho Público:** O módulo de denúncias conta com camada de integração preparada para conectar-se via webhook/API ou envio direto para **meios de comunicação de entidades públicas competentes**:
  - Delegacias Especializadas de Proteção Animal e Meio Ambiente (DEPA / DEMA).
  - Ministério Público Estadual (Promotorias de Defesa do Meio Ambiente e Animais).
  - Centros de Controle de Zoonoses (CCZ) e Secretarias Municipais de Saúde/Meio Ambiente.
  - Centrais de Disque-Denúncia (181 / 190).
- Em denúncias graves de crueldade e maus-tratos, o sistema preserva logs de conexão, geolocalização e mídias originais para subsidiar inquéritos policiais e ações de fiscalização.

---

## 9. Suporte e Atendimento (Tickets)

- Qualquer usuário autenticado pode abrir tickets de suporte categorizados (Geral, Privacidade, Exclusão de Conta, Problemas Técnicos).
- Conversa em thread com mensagens em ordem cronológica.
- Apenas administradores e a equipe de suporte podem alterar o status (Aberto → Em análise → Resolvido/Fechado).

---

## 10. Conformidade Legal: Google Play Store, LGPD e Marco Civil

### Google Play Store
1. **Política de Exclusão de Contas:** Mecanismo acessível in-app e página web pública (`/delete-account`).
2. **Moderação de UGC:** Bloqueio e denúncia de usuários e conteúdo, com remoção célere de material abusivo.
3. **Proibição de Venda Ilegal:** Restrição estrita de animais para doação/adoção responsável.
4. **Mínimo Privilégio de Permissões:** Câmera, microfone e GPS requerem justificativa contextual em tempo de execução.

### LGPD (Lei nº 13.709/2018) & Marco Civil da Internet (Lei nº 12.965/2014)
1. **Consentimento Expresso e Versionado:** Aceite obrigatório dos Termos de Uso e Política de Privacidade via `POST /auth/accept-terms`. Armazenamento de `termsAcceptedAt` e `termsVersion`.
2. **TermsAcceptedGuard Global:** Bloqueio de rotas autenticadas com HTTP 403 Forbidden caso os termos atuais não tenham sido aceitos.
3. **Guarda de Registros de Acesso:** Manutenção de logs de conexão e de acesso a aplicações sob sigilo pelo prazo legal de 6 meses (Art. 15 do Marco Civil).
4. **Direito à Portabilidade e Eliminação:** Garantia de exportação e expurgo definitivo de dados mediante solicitação do titular.

---

## 11. Matriz Geral de Permissões e Acesso

| Recurso / Ação                | Anônimo | Usuário Comum | Tutor do Pet | Veterinário Validado | Petshop Parceira | Administrador |
|-------------------------------|:-------:|:-------------:|:------------:|:--------------------:|:----------------:|:-------------:|
| Ver perfil / posts públicos   | ✅      | ✅            | ✅           | ✅                   | ✅               | ✅            |
| Ver eventos públicos          | ✅      | ✅            | ✅           | ✅                   | ✅               | ✅            |
| Criar post / comentar         | ❌      | ✅            | ✅           | ✅                   | ✅               | ✅            |
| Cadastrar pet pessoal         | ❌      | ✅            | ✅           | ✅                   | ❌               | ✅            |
| Cadastrar pet p/ Adoção       | ❌      | ❌            | ❌           | ❌                   | ✅               | ✅            |
| Transferir custódia de adoção | ❌      | ❌            | ❌           | ❌                   | ✅               | ✅            |
| Editar dados do pet           | ❌      | ❌            | ✅           | ❌                   | ✅ (sob custódia)| ✅            |
| Lançar vacina caseira         | ❌      | ❌            | ✅           | ✅                   | ❌               | ✅            |
| Emitir Prontuário Oficial     | ❌      | ❌            | ❌           | ✅ (autorizado)      | ❌               | ✅            |
| Criar anúncios de serviços    | ❌      | ❌            | ❌           | ❌                   | ✅               | ✅            |
| Solicitar role Veterinário    | ❌      | ✅            | ✅           | -                    | -                | ✅            |
| Aprovar Veterinário / Petshop | ❌      | ❌            | ❌           | ❌                   | ❌               | ✅            |
| Denunciar conteúdo / maus-tratos | ❌   | ✅            | ✅           | ✅                   | ✅               | ✅            |
| Despachar denúncia p/ entidade| ❌      | ❌            | ❌           | ❌                   | ❌               | ✅ (automático/manual) |
| Excluir própria conta         | ❌      | ✅            | ✅           | ✅                   | ✅               | ✅            |