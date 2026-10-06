# Contas de Teste do Ecossistema PataNet (Ambiente DEV)

> **Aviso de Segurança & Governança:**  
> Este arquivo é de uso **exclusivo para o ambiente de desenvolvimento (`branch dev`)**.  
> Em produção (`main`), estas credenciais não existem e este arquivo é ignorado nas publicações e builds.

---

## 1. Senha Padrão de Desenvolvimento
Para facilitar os testes locais de todos os fluxos, todas as contas utilizam a mesma senha segura de desenvolvimento:

```text
Patanet@Dev2026!
```

---

## 2. Matriz de Contas de Teste por Papel e Módulo

| Papel / Perfil | E-mail de Acesso | Nome de Exibição | Módulos e Recursos Testáveis |
|---|---|---|---|
| **1. Administrador Geral** | `dev.patanet@gmail.com` | Admin PataNet | Aprovação de CRMV (`/admin/vet`), aprovação de Petshops PJ (`/admin/petshops`), moderação de denúncias e suporte. |
| **2. Administrador Alternativo** | `admin@patanet.app.br` | Suporte Admin | Gestão de tickets, auditoria de logs e expurgo de contas. |
| **3. Veterinário Validado (CRMV Ativo)** | `vet.aprovado@patanet.app.br` | Dr. Carlos Eduardo Vet | CRMV 12345/SP validado. Emissão de prontuário digital (`MedicalRecord`), anotação de vacinas oficiais com selo CRMV, diagnósticos e prescrições. |
| **4. Veterinário Pendente** | `vet.pendente@patanet.app.br` | Dra. Fernanda Pendente | CRMV 67890/RJ em análise (`PENDING_VALIDATION`). Usado para testar bloqueios de segurança antes da aprovação do Admin. |
| **5. Petshop Parceira PJ Aprovada** | `petshop.parceira@patanet.app.br` | Pet Center Amigo Fiel | CNPJ 12.345.678/0001-90 aprovado. Criação de catálogo de serviços, eventos oficiais, vínculo de veterinários e cadastro de pets para **Adoção Responsável**. |
| **6. Petshop Pendente** | `petshop.pendente@patanet.app.br` | Petshop Cão & Gato | CNPJ 98.765.432/0001-10 em análise (`PENDING_VALIDATION`). Teste de restrições de parceiro antes da auditoria. |
| **7. Tutor Principal** | `tutor.principal@patanet.app.br` | Mariana Santos | Tutora dos pets cadastrados **Rex** (Cão) e **Mia** (Gata). Gerenciamento de saúde, permissão para veterinários e postagens no feed. |
| **8. Co-Tutor Convidado** | `cotutor@patanet.app.br` | Lucas Co-Tutor | Co-responsável pelo pet **Rex**. Teste de visualização compartilhada de saúde e restrições de não-titular. |
| **9. Tutor Adotante** | `adotante@patanet.app.br` | Beatriz Adotante | Usuário interessado em adoção. Submissão de candidatura de adoção (`AdoptionRequest`) e assinatura do Termo Digital de Adoção. |
| **10. Usuário Termos Pendentes** | `usuario.sem.termos@patanet.app.br` | João Sem Termos | Conta com `termsAcceptedAt: null`. Usada para validar o bloqueio do `TermsAcceptedGuard` (HTTP 403) e o modal no app. |
| **11. Usuário Bloqueador** | `bloqueador@patanet.app.br` | Usuário Bloqueador | Bloqueia outros usuários. Usado para testar o filtro SQL `NOT IN` no Feed e comentários. |
| **12. Usuário Bloqueado** | `bloqueado@patanet.app.br` | Usuário Bloqueado | Usuário bloqueado pelo Bloqueador. Seus posts e comentários não devem aparecer para quem o bloqueou. |
| **13. Usuário Sentinela** | `deleted-user@patanet.internal` | Conta Excluída | Usuário sentinela interno do sistema que assume posts e comentários órfãos após exclusão de conta (Play Store/LGPD). |
| **14. Pedestre Anônimo (No-Login)** | *Sem cadastro* | Pedestre da Rua | Teste do fluxo `/avistei-um-pet` com upload de vídeo/foto e geolocalização automática em menos de 10 segundos sem token JWT. |

---

## 3. Pets Pré-Cadastrados para Teste

| Nome do Pet | Espécie / Raça | Tutor Atual / Custódia | Finalidade de Teste |
|---|---|---|---|
| **Rex** | Cão / Golden Retriever | `tutor.principal@patanet.app.br` | Pet com carteira de vacinas, remédios e autorização clínica aberta para o veterinário aprovado. |
| **Mia** | Gata / Siamês | `tutor.principal@patanet.app.br` | Pet com status `LOST` ativo para testes de reencontro visual e biometria no PataNet Vision. |
| **Thor (Adoção)** | Cão / Vira-lata (SRD) | `petshop.parceira@patanet.app.br` (`ownerId: null`) | Pet com `isForAdoption: true` sob custódia da Petshop, disponível na vitrine para teste de transferência formal de custódia. |
| **Luna (Adoção)** | Gata / Frajola | `petshop.parceira@patanet.app.br` (`ownerId: null`) | Pet filhote para teste de candidatura e termo de adoção responsável. |

---

## 4. Como Popular Automaticamente no Banco de Dados

Para carregar todas essas contas, pets e relações no seu PostgreSQL local (`patanet_dev`), execute na pasta `api/`:

```bash
cd c:\WillenWorks\PataNet\api
pnpm run db:seed
```

O comando irá limpar dados de teste prévios e inserir todos os perfis com as senhas criptografadas em bcrypt.
