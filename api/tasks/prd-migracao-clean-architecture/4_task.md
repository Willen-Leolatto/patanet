# Tarefa 4.0: Migração do Módulo Animals

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Maior módulo da migração. Cobre pets, tutores, saúde (vacinas, vermifugações, medicamentos), mídias, raças e espécies. Usa `AggregateRoot` com `WatchedList<string>` para a lista de tutores. Depende do módulo Users migrado (Tarefa 2.0).

<skills>
### Conformidade com Skills Padrões

- `clean-ddd-hexagonal` — AggregateRoot com WatchedList, TutorManagementDomainService, múltiplos repository ports
- `nestjs-best-practices` — AnimalsModule com múltiplos bindings, controllers separados por recurso
- `nestjs-testing-expert` — unit tests de use cases complexos com múltiplos mocks
</skills>

<requirements>
- Domain entities: `Animal` (AggregateRoot com `WatchedList<string>` para ownerIds), `Vaccine`, `Deworming`, `Medication`, `AnimalMedia`
- Value objects: `AnimalSize` (Pequeno, Médio, Grande), `AnimalGender`
- `TutorManagementDomainService` com métodos: `canAddTutor`, `canRemoveTutor`, `canTransferOwnership`, `isLastTutor`
- Repository ports: `AnimalRepository`, `VaccineRepository`, `DewormingRepository`, `MedicationRepository`, `AnimalMediaRepository`, `AnimalVisibilityRepository`, `BreedRepository`, `SpecieRepository`
- Implementações TypeORM para cada port, com mappers correspondentes
- Use cases: `CreateAnimalUseCase`, `UpdateAnimalUseCase`, `DeleteAnimalUseCase`, `AddTutorUseCase`, `RemoveTutorUseCase`, `TransferPrimaryTutorUseCase`, `ToggleVisibilityUseCase`, `GetAnimalsByOwnerUseCase`, `GetAnimalMediasUseCase`, `AddAnimalMediaUseCase`, `DeleteAnimalMediaUseCase`, `CreateVaccineUseCase`, `UpdateVaccineUseCase`, `DeleteVaccineUseCase`, `CreateDewormingUseCase`, `UpdateDewormingUseCase`, `DeleteDewormingUseCase`, `CreateMedicationUseCase`, `UpdateMedicationUseCase`, `DeleteMedicationUseCase`, `GetBreedsUseCase`, `GetSpeciesUseCase`
- Controllers: `AnimalsController`, `OwnersController`, `VaccinesController`, `DewormingsController`, `MedicationsController`, `BreedsController`, `SpeciesController`
- `OwnersController` deve manter AMBOS os endpoints: `/animals/:id/owners/:ownerId` E `/animals/:id/owner/:ownerId` (singular/plural)
- `TypeOrmAnimalRepository` usa `RelationQueryBuilder` para `addOwner` e `removeOwner` (evitar sobrescrita da tabela pivô `animal_users`)
- Remover `src/animals/` ao final
</requirements>

## Subtarefas

- [ ] 4.1 Criar domain entities: `Animal` (AggregateRoot + WatchedList), `Vaccine`, `Deworming`, `Medication`, `AnimalMedia`
- [ ] 4.2 Criar value objects `AnimalSize` e `AnimalGender`
- [ ] 4.3 Criar `TutorManagementDomainService`
- [ ] 4.4 Criar todos os repository ports (8 abstract classes)
- [ ] 4.5 Criar ORM entities e mappers para cada entidade
- [ ] 4.6 Criar `TypeOrmAnimalRepository` com `RelationQueryBuilder` para owners
- [ ] 4.7 Criar demais repositórios TypeORM (Vaccine, Deworming, Medication, AnimalMedia, Visibility, Breed, Specie)
- [ ] 4.8 Criar use cases de Animal (Create, Update, Delete, GetByOwner)
- [ ] 4.9 Criar use cases de tutores (AddTutor, RemoveTutor, TransferPrimaryTutor, ToggleVisibility)
- [ ] 4.10 Criar use cases de saúde (Vaccine CRUD, Deworming CRUD, Medication CRUD)
- [ ] 4.11 Criar use cases de mídia e catálogo (AnimalMedia, Breeds, Species)
- [ ] 4.12 Criar controllers e DTOs
- [ ] 4.13 Criar `AnimalsModule` com todos os bindings e registrar no `app.module.ts`
- [ ] 4.14 Remover `src/animals/` e validar build
- [ ] 4.15 Escrever testes unitários para todos os use cases
- [ ] 4.16 Escrever testes de integração para `TypeOrmAnimalRepository`
- [ ] 4.17 Escrever testes E2E para os fluxos de animals

## Detalhes de Implementação

Consultar `techspec.md` — seções:
- "Interfaces Principais > AnimalRepository"
- "Modelos de Dados > Aggregate Animal com WatchedList"
- "Sequenciamento > Etapa 3 — Animals"
- "Riscos Conhecidos > Relações complexas no TypeORM (animals/owners)" e "Endpoints com alias de compatibilidade"

Consultar `clean-ddd-hexagonal.md` — seções:
- "13. Exemplos Concretos > Domain Service — Gestão de Tutores"

## Critérios de Sucesso

- Todos os endpoints de animals respondem com os mesmos contratos
- Ambos os aliases de owners (`/owner/` e `/owners/`) funcionam
- Tabela pivô `animal_users` não é sobrescrita ao adicionar/remover tutores
- `npm run test:unit` passa para todos os use cases de Animals
- `npm run test:integration` passa para `TypeOrmAnimalRepository`
- `npm run test:e2e` passa para os fluxos de animals
- `src/animals/` removido sem erros de build

## Testes da Tarefa

- [ ] `create-animal.use-case.spec.ts` — happy path, raça não encontrada, usuário não encontrado
- [ ] `add-tutor.use-case.spec.ts` — happy path, não é tutor principal, usuário não encontrado
- [ ] `remove-tutor.use-case.spec.ts` — happy path, tutor principal tentando se remover, último tutor
- [ ] `transfer-primary-tutor.use-case.spec.ts` — happy path, não é tutor principal, alvo não é tutor
- [ ] `toggle-visibility.use-case.spec.ts` — happy path, não é tutor principal
- [ ] Testes para use cases de saúde (Vaccine, Deworming, Medication) — happy path e erros
- [ ] `typeorm-animal.repository.integration.spec.ts` — CRUD + addOwner/removeOwner
- [ ] `animals.e2e-spec.ts` — fluxo completo com tutores

<critical>SEMPRE CRIE E EXECUTE OS TESTES DA TAREFA ANTES DE CONSIDERÁ-LA FINALIZADA</critical>

<critical>SEMPRE MARQUE A TAREFA COMO CONCLUÍDA APÓS FINALIZADA</critical>

## Arquivos Relevantes

- `src/animals/` (implementação legada — referência e depois remoção)
- `src/modules/animals/` (novo destino)
- `src/modules/users/domain/repositories/user.repository.ts` (dependência para relação owners)
- `src/app.module.ts`