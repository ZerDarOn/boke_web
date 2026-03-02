import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testPassword() {
  console.log('🔐 Testing password verification...\n');

  const user = await prisma.user.findFirst({
    where: { username: 'cyber.ronin' },
  });

  if (!user) {
    console.log('❌ User not found!');
    return;
  }

  const plainPassword = 'admin123';
  const isValid = await bcrypt.compare(plainPassword, user.password);

  console.log(`Plain password: ${plainPassword}`);
  console.log(`Stored hash: ${user.password}`);
  console.log(`Verification result: ${isValid ? '✅ VALID' : '❌ INVALID'}\n`);

  // Also test with different username/email
  const users = await prisma.user.findMany({
    where: {
      OR: [{ username: plainPassword }, { email: plainPassword }],
    },
  });

  console.log(`Search by username '${plainPassword}': Found ${users.length} users`);
  console.log(`Search by email '${plainPassword}': Found ${users.length} users`);

  await prisma.$disconnect();
}

testPassword();
