import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient, UserRole, AnimalSize, AnimalGender, BreedSize, VerificationStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

interface BreedSeedData {
  id: string
  name: string
  image: string
  specieId: string
  about: string
  appearance: string
  temperament: string
  trainability: string
  exercise: string
  coat: string
  health: string
  suggestedSize: keyof typeof BreedSize
  typicalWeight: string
  typicalHeight: string
  lifeExpectancy: string
}

async function main() {
  console.log('🌱 Iniciando seed de desenvolvimento com contas de teste do PataNet...')

  const passwordHash = await bcrypt.hash('Patanet@Dev2026!', 10)
  const now = new Date()

  // 1. Espécies Oficiais
  await prisma.specie.upsert({
    where: { id: '17bd10c9-db03-4ce6-8938-a51c806a8c9e' },
    update: { name: 'Cachorro', image: 'https://s3.amazonaws.com/patanet/dog.webp' },
    create: {
      id: '17bd10c9-db03-4ce6-8938-a51c806a8c9e',
      name: 'Cachorro',
      image: 'https://s3.amazonaws.com/patanet/dog.webp',
    },
  })

  await prisma.specie.upsert({
    where: { id: '1c21ec1f-0486-4d83-bc7b-744e05d649ba' },
    update: { name: 'Gato', image: 'https://s3.amazonaws.com/patanet/cat.jpg' },
    create: {
      id: '1c21ec1f-0486-4d83-bc7b-744e05d649ba',
      name: 'Gato',
      image: 'https://s3.amazonaws.com/patanet/cat.jpg',
    },
  })

  // 2. Raças Oficiais (28 raças completas com fotos e atributos)
  const breedsDataPath = path.resolve(__dirname, '../seed/breeds_data.json')
  const breedsData: BreedSeedData[] = JSON.parse(fs.readFileSync(breedsDataPath, 'utf-8'))

  for (const breed of breedsData) {
    await prisma.breed.upsert({
      where: { id: breed.id },
      update: {
        name: breed.name,
        about: breed.about,
        appearance: breed.appearance,
        temperament: breed.temperament,
        trainability: breed.trainability,
        exercise: breed.exercise,
        coat: breed.coat,
        health: breed.health,
        suggestedSize: BreedSize[breed.suggestedSize],
        typicalWeight: breed.typicalWeight,
        typicalHeight: breed.typicalHeight,
        lifeExpectancy: breed.lifeExpectancy,
        image: breed.image,
        specieId: breed.specieId,
      },
      create: {
        id: breed.id,
        name: breed.name,
        about: breed.about,
        appearance: breed.appearance,
        temperament: breed.temperament,
        trainability: breed.trainability,
        exercise: breed.exercise,
        coat: breed.coat,
        health: breed.health,
        suggestedSize: BreedSize[breed.suggestedSize],
        typicalWeight: breed.typicalWeight,
        typicalHeight: breed.typicalHeight,
        lifeExpectancy: breed.lifeExpectancy,
        image: breed.image,
        specieId: breed.specieId,
      },
    })
  }

  console.log(`🐾 ${breedsData.length} raças oficiais sincronizadas.`)

  // 3. Usuários de Teste
  // 3.1 Administrador Geral
  const adminUser = await prisma.user.upsert({
    where: { email: 'dev.patanet@gmail.com' },
    update: { role: UserRole.ADMIN },
    create: {
      id: 'user-admin-main',
      name: 'Admin PataNet',
      displayName: 'Admin Master',
      username: 'admin.patanet',
      email: 'dev.patanet@gmail.com',
      password: passwordHash,
      role: UserRole.ADMIN,
      termsAcceptedAt: now,
      termsVersion: '1.0',
    },
  })

  // 3.2 Administrador Secundário
  await prisma.user.upsert({
    where: { email: 'admin@patanet.app.br' },
    update: { role: UserRole.ADMIN },
    create: {
      id: 'user-admin-support',
      name: 'Suporte Admin',
      displayName: 'Suporte PataNet',
      username: 'suporte.admin',
      email: 'admin@patanet.app.br',
      password: passwordHash,
      role: UserRole.ADMIN,
      termsAcceptedAt: now,
      termsVersion: '1.0',
    },
  })

  // 3.3 Veterinário Aprovado (CRMV Ativo)
  const vetAprovado = await prisma.user.upsert({
    where: { email: 'vet.aprovado@patanet.app.br' },
    update: { role: UserRole.VETERINARIAN },
    create: {
      id: 'user-vet-aprovado',
      name: 'Dr. Carlos Eduardo Vet',
      displayName: 'Dr. Carlos Vet',
      username: 'carlos.vet',
      email: 'vet.aprovado@patanet.app.br',
      password: passwordHash,
      role: UserRole.VETERINARIAN,
      termsAcceptedAt: now,
      termsVersion: '1.0',
    },
  })

  await prisma.veterinarianProfile.upsert({
    where: { userId: vetAprovado.id },
    update: { status: VerificationStatus.APPROVED },
    create: {
      id: 'vet-profile-carlos',
      userId: vetAprovado.id,
      crmv: '12345',
      uf: 'SP',
      status: VerificationStatus.APPROVED,
    },
  })

  // 3.4 Veterinário Pendente
  const vetPendente = await prisma.user.upsert({
    where: { email: 'vet.pendente@patanet.app.br' },
    update: {},
    create: {
      id: 'user-vet-pendente',
      name: 'Dra. Fernanda Pendente',
      displayName: 'Dra. Fernanda',
      username: 'fernanda.vet',
      email: 'vet.pendente@patanet.app.br',
      password: passwordHash,
      role: UserRole.USER,
      termsAcceptedAt: now,
      termsVersion: '1.0',
    },
  })

  await prisma.veterinarianProfile.upsert({
    where: { userId: vetPendente.id },
    update: { status: VerificationStatus.PENDING },
    create: {
      id: 'vet-profile-fernanda',
      userId: vetPendente.id,
      crmv: '67890',
      uf: 'RJ',
      status: VerificationStatus.PENDING,
    },
  })

  // 3.5 Petshop Parceira PJ Aprovada
  const petshopOwner = await prisma.user.upsert({
    where: { email: 'petshop.parceira@patanet.app.br' },
    update: { role: UserRole.INSTITUTION },
    create: {
      id: 'user-petshop-parceira',
      name: 'Pet Center Amigo Fiel',
      displayName: 'Petshop Amigo Fiel',
      username: 'petcenter.amigofiel',
      email: 'petshop.parceira@patanet.app.br',
      password: passwordHash,
      role: UserRole.INSTITUTION,
      termsAcceptedAt: now,
      termsVersion: '1.0',
    },
  })

  const petshopAprovada = await prisma.petshop.upsert({
    where: { cnpj: '12345678000190' },
    update: { status: VerificationStatus.APPROVED },
    create: {
      id: 'petshop-amigo-fiel',
      ownerUserId: petshopOwner.id,
      cnpj: '12345678000190',
      businessName: 'Pet Center Amigo Fiel Ltda',
      alvaraUrl: 'https://patanet-assets.local/alvara-amigo-fiel.pdf',
      responsavelTecnicoNome: 'Dr. Carlos Eduardo Vet',
      status: VerificationStatus.APPROVED,
      addressLine: 'Av. Paulista, 1000',
      addressCity: 'São Paulo',
      addressState: 'SP',
    },
  })

  // 3.6 Tutor Principal
  const tutorPrincipal = await prisma.user.upsert({
    where: { email: 'tutor.principal@patanet.app.br' },
    update: {},
    create: {
      id: 'user-tutor-principal',
      name: 'Mariana Santos',
      displayName: 'Mari Santos',
      username: 'mariana.santos',
      email: 'tutor.principal@patanet.app.br',
      password: passwordHash,
      role: UserRole.USER,
      termsAcceptedAt: now,
      termsVersion: '1.0',
    },
  })

  // 3.7 Co-Tutor Convidado
  const coTutor = await prisma.user.upsert({
    where: { email: 'cotutor@patanet.app.br' },
    update: {},
    create: {
      id: 'user-cotutor',
      name: 'Lucas Co-Tutor',
      displayName: 'Lucas',
      username: 'lucas.cotutor',
      email: 'cotutor@patanet.app.br',
      password: passwordHash,
      role: UserRole.USER,
      termsAcceptedAt: now,
      termsVersion: '1.0',
    },
  })

  // 3.8 Usuário Adotante
  await prisma.user.upsert({
    where: { email: 'adotante@patanet.app.br' },
    update: {},
    create: {
      id: 'user-adotante',
      name: 'Beatriz Adotante',
      displayName: 'Bia Adotante',
      username: 'beatriz.adotante',
      email: 'adotante@patanet.app.br',
      password: passwordHash,
      role: UserRole.USER,
      termsAcceptedAt: now,
      termsVersion: '1.0',
    },
  })

  // 3.9 Usuário Sem Termos LGPD (para testar bloqueio 403)
  await prisma.user.upsert({
    where: { email: 'usuario.sem.termos@patanet.app.br' },
    update: { termsAcceptedAt: null, termsVersion: null },
    create: {
      id: 'user-sem-termos',
      name: 'João Sem Termos',
      displayName: 'João',
      username: 'joao.semtermos',
      email: 'usuario.sem.termos@patanet.app.br',
      password: passwordHash,
      role: UserRole.USER,
      termsAcceptedAt: null,
      termsVersion: null,
    },
  })

  // 3.10 Usuário Sentinela de Exclusão
  await prisma.user.upsert({
    where: { email: 'deleted-user@patanet.internal' },
    update: { isActive: false },
    create: {
      id: 'deleted-user-sentinel',
      name: 'Conta Excluída',
      displayName: 'Usuário Removido',
      username: 'deleted.user',
      email: 'deleted-user@patanet.internal',
      password: passwordHash,
      role: UserRole.USER,
      isActive: false,
      deletedAt: now,
      termsAcceptedAt: now,
      termsVersion: '1.0',
    },
  })

  // 3.11 Petshop Parceira Pendente de Validação
  const petshopPendenteOwner = await prisma.user.upsert({
    where: { email: 'petshop.pendente@patanet.app.br' },
    update: { role: UserRole.INSTITUTION },
    create: {
      id: 'user-petshop-pendente',
      name: 'Petshop Cão & Gato',
      displayName: 'Cão & Gato Pet',
      username: 'petshop.caogato',
      email: 'petshop.pendente@patanet.app.br',
      password: passwordHash,
      role: UserRole.INSTITUTION,
      termsAcceptedAt: now,
      termsVersion: '1.0',
    },
  })

  await prisma.petshop.upsert({
    where: { cnpj: '98765432000110' },
    update: { status: VerificationStatus.PENDING },
    create: {
      id: 'petshop-cao-e-gato',
      ownerUserId: petshopPendenteOwner.id,
      cnpj: '98765432000110',
      businessName: 'Petshop Cão e Gato Ltda',
      alvaraUrl: 'https://patanet-assets.local/alvara-pendente.pdf',
      responsavelTecnicoNome: 'Dra. Fernanda Pendente',
      status: VerificationStatus.PENDING,
      addressLine: 'Rua das Flores, 50',
      addressCity: 'Rio de Janeiro',
      addressState: 'RJ',
    },
  })

  // 3.12 Usuário Bloqueador
  const userBloqueador = await prisma.user.upsert({
    where: { email: 'bloqueador@patanet.app.br' },
    update: {},
    create: {
      id: 'user-bloqueador',
      name: 'Usuário Bloqueador',
      displayName: 'Bloqueador',
      username: 'user.bloqueador',
      email: 'bloqueador@patanet.app.br',
      password: passwordHash,
      role: UserRole.USER,
      termsAcceptedAt: now,
      termsVersion: '1.0',
    },
  })

  // 3.13 Usuário Bloqueado
  const userBloqueado = await prisma.user.upsert({
    where: { email: 'bloqueado@patanet.app.br' },
    update: {},
    create: {
      id: 'user-bloqueado',
      name: 'Usuário Bloqueado',
      displayName: 'Bloqueado',
      username: 'user.bloqueado',
      email: 'bloqueado@patanet.app.br',
      password: passwordHash,
      role: UserRole.USER,
      termsAcceptedAt: now,
      termsVersion: '1.0',
    },
  })

  // Relação de Bloqueio mútuo/unilateral para validação do filtro NOT IN no Feed
  await prisma.block.upsert({
    where: {
      blockerId_blockedId: {
        blockerId: userBloqueador.id,
        blockedId: userBloqueado.id,
      },
    },
    update: {},
    create: {
      id: 'block-bloqueador-bloqueado',
      blockerId: userBloqueador.id,
      blockedId: userBloqueado.id,
    },
  })

  // 4. Pets
  // 4.1 Rex (Cão da Mariana com co-tutoria de Lucas)
  const rex = await prisma.animal.upsert({
    where: { id: 'pet-rex-golden' },
    update: { breedId: '4a2bf1b3-790c-4210-ba74-6aa75221cd75' },
    create: {
      id: 'pet-rex-golden',
      name: 'Rex',
      about: 'Golden Retriever dócil e brincalhão.',
      weight: 32.5,
      size: AnimalSize.LARGE,
      gender: AnimalGender.MALE,
      breedId: '4a2bf1b3-790c-4210-ba74-6aa75221cd75',
      ownerId: tutorPrincipal.id,
      isForAdoption: false,
      owners: {
        connect: [{ id: tutorPrincipal.id }, { id: coTutor.id }],
      },
    },
  })

  // 4.2 Autorização Veterinária: Mariana autoriza Dr. Carlos a cuidar do Rex
  await prisma.veterinarianAuthorization.upsert({
    where: {
      animalId_veterinarianId: {
        animalId: rex.id,
        veterinarianId: vetAprovado.id,
      },
    },
    update: { revokedAt: null },
    create: {
      id: 'auth-rex-carlos',
      animalId: rex.id,
      veterinarianId: vetAprovado.id,
      authorizedById: tutorPrincipal.id,
    },
  })

  // 4.3 Prontuário Médico do Rex assinado pelo Dr. Carlos
  await prisma.medicalRecord.upsert({
    where: { id: 'record-rex-checkup' },
    update: {},
    create: {
      id: 'record-rex-checkup',
      animalId: rex.id,
      veterinarianId: vetAprovado.id,
      notes: 'Checkup anual de rotina. Animal saudável com pelagem brilhante e peso adequado.',
      signedAt: now,
    },
  })

  // 4.4 Vacina Oficial do Rex assinada pelo Dr. Carlos
  await prisma.vaccine.upsert({
    where: { id: 'vac-rex-raiva-oficial' },
    update: {},
    create: {
      id: 'vac-rex-raiva-oficial',
      name: 'Antirrábica Canina',
      observations: 'Dose anual obrigatória aplicada com sucesso.',
      clinic: 'Pet Center Amigo Fiel',
      appliedAt: now,
      isOfficial: true,
      batchNumber: 'LOTE-RAIVA-2026-X',
      manufacturer: 'Zoetis',
      veterinarianId: vetAprovado.id,
      animalId: rex.id,
    },
  })

  // 4.5 Mia (Gata Perdida)
  await prisma.animal.upsert({
    where: { id: 'pet-mia-lost' },
    update: { breedId: '41aafac7-e006-4abd-961d-d681c94b5250' },
    create: {
      id: 'pet-mia-lost',
      name: 'Mia',
      about: 'Gata siamesa com coleira vermelha e mancha na pata esquerda.',
      weight: 4.2,
      size: AnimalSize.SMALL,
      gender: AnimalGender.FEMALE,
      breedId: '41aafac7-e006-4abd-961d-d681c94b5250',
      ownerId: tutorPrincipal.id,
      isForAdoption: false,
      owners: {
        connect: [{ id: tutorPrincipal.id }],
      },
    },
  })

  // 4.6 Thor (Cão para Adoção Responsável custodiado pela Petshop)
  await prisma.animal.upsert({
    where: { id: 'pet-thor-adocao' },
    update: { breedId: 'a35eb326-b799-4d69-ae97-220fc402b1c1' },
    create: {
      id: 'pet-thor-adocao',
      name: 'Thor',
      about: 'Cãozinho resgatado muito carinhoso, castrado e vermifugado.',
      weight: 14.0,
      size: AnimalSize.MEDIUM,
      gender: AnimalGender.MALE,
      breedId: 'a35eb326-b799-4d69-ae97-220fc402b1c1',
      ownerId: null,
      petshopId: petshopAprovada.id,
      isForAdoption: true,
    },
  })

  // 4.7 Luna (Gata para Adoção Responsável custodiada pela Petshop)
  await prisma.animal.upsert({
    where: { id: 'pet-luna-adocao' },
    update: { breedId: '82fa0d58-7a05-46ab-bb12-ac78ca1db945' },
    create: {
      id: 'pet-luna-adocao',
      name: 'Luna',
      about: 'Gatinha frajola muito brincalhona pronta para encontrar um lar.',
      weight: 3.0,
      size: AnimalSize.SMALL,
      gender: AnimalGender.FEMALE,
      breedId: '82fa0d58-7a05-46ab-bb12-ac78ca1db945',
      ownerId: null,
      petshopId: petshopAprovada.id,
      isForAdoption: true,
    },
  })

  // 5. Limpeza de Registros Dummy Legados (substituídos pelo catálogo oficial acima)
  // Executado por último: os pets já foram repontados para as raças oficiais.
  const legacyBreedIds = ['breed-golden', 'breed-siames', 'breed-srd-dog', 'breed-frajola']
  const legacySpecieIds = ['specie-dog', 'specie-cat']

  await prisma.breed.deleteMany({ where: { id: { in: legacyBreedIds } } })
  await prisma.specie.deleteMany({ where: { id: { in: legacySpecieIds } } })

  console.log('🧹 Registros dummy legados de espécies/raças removidos.')

  console.log('✅ Seed executado com sucesso!')
  console.log('📊 Contas prontas: Admin, Veterinário, Petshop PJ, Tutores, Adotante e Usuário de Teste LGPD.')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
