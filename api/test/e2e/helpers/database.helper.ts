import { PrismaService } from '../../../src/database/prisma/prisma.service'

export async function clearDatabase(prisma: PrismaService): Promise<void> {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `
  const names = tables
    .map(t => `"${t.tablename}"`)
    .filter(name => name !== '"_prisma_migrations"')
    .join(', ')

  if (!names) return

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE;`,
  )
}
