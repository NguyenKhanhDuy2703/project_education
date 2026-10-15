const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Checking for existing contributor accounts...');

  const contributors = await prisma.user.findMany({
    where: {
      role: 'contributor',
    },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      role: true,
    },
  });

  console.log(`Found ${contributors.length} accounts with role 'contributor'.`);

  if (contributors.length > 0) {
    for (const u of contributors) {
      await prisma.user.update({
        where: { id: u.id },
        data: {
          role: 'user',
          isContributor: true,
          contributorStatus: 'APPROVED',
        },
      });
      console.log(`  ✓ Migrated: ${u.email || u.phone} (${u.name}) -> role: 'user', isContributor: true`);
    }
  }

  const remaining = await prisma.user.count({
    where: { role: 'contributor' },
  });
  const totalContributors = await prisma.user.count({
    where: { isContributor: true },
  });

  console.log('Migration Complete:');
  console.log(`  - Remaining role='contributor': ${remaining}`);
  console.log(`  - Total isContributor=true users: ${totalContributors}`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
