/**
 * Emergency CLI Tool: Reset Admin Password
 * Usage: node scripts/reset-admin-password.js [email] [newPassword]
 * Example: node scripts/reset-admin-password.js nguyenkhanhduy270304@gmail.com MyNewPassword123!
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const targetEmail = process.argv[2] || 'nguyenkhanhduy270304@gmail.com';
const newPassword = process.argv[3] || 'Password123!';

async function resetPassword() {
  console.log(`🔑 Resetting password for: ${targetEmail}`);

  if (newPassword.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters long.');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email: targetEmail.toLowerCase() },
  });

  if (!user) {
    console.error(`❌ Error: User with email "${targetEmail}" not found in database.`);
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      refreshToken: null, // Force re-login
    },
  });

  console.log(`✅ Success! Password for ${updated.name} (${updated.email}) has been reset.`);
  console.log(`   Role: ${updated.role}`);
  console.log(`   New Password: ${newPassword}`);
}

resetPassword()
  .catch((e) => {
    console.error('Reset failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
