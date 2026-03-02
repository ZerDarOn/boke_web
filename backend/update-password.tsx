import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updatePassword() {
  console.log('🔐 Updating admin password...\n');

  const user = await prisma.user.findFirst({
    where: { username: 'cyber.ronin' },
  });

  if (!user) {
    console.log('❌ User not found!');
    return;
  }

  const hash = bcrypt.hashSync('admin123', 10);
  
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hash },
  });

  console.log('✅ Password updated successfully!');
  console.log(`Username: cyber.ronin`);
  console.log(`Password: admin123`);
  console.log(`Hash: ${hash}\n`);

  await prisma.$disconnect();
}

updatePassword();
