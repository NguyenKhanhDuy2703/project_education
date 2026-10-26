import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "user_saved_series" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "seriesId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "user_saved_series_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "user_saved_series_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "user_saved_series_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "lab_series"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "user_saved_series_userId_seriesId_key" ON "user_saved_series"("userId", "seriesId");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "user_saved_series_userId_idx" ON "user_saved_series"("userId");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "user_saved_series_seriesId_idx" ON "user_saved_series"("seriesId");
  `);

  console.log('user_saved_series table created or verified successfully!');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
