import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  console.log('🔍 Checking user in database...\n');

  const users = await prisma.user.findMany();
  
  console.log(`Found ${users.length} users:\n`);
  
  for (const user of users) {
    console.log(`Username: ${user.username}`);
    console.log(`Email: ${user.email}`);
    console.log(`Password hash: ${user.password}`);
    console.log(`Role: ${user.role}`);
    console.log(`Display Name: ${user.displayName}\n`);
  }

  if (users.length === 0) {
    console.log('❌ No users found in database!');
  }

  await prisma.$disconnect();
}

checkUser();
