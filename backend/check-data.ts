import { PrismaClient } from '@prisma/client';
import { config } from './config/env';

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('\n🔍 Checking database data...\n');

    const userCount = await prisma.user.count();
    const postCount = await prisma.post.count();
    const projectCount = await prisma.project.count();
    const skillCount = await prisma.skill.count();
    const animeCount = await prisma.anime.count();
    const diaryCount = await prisma.diary.count();
    const announcementCount = await prisma.announcement.count();
    const timelineCount = await prisma.timelineEvent.count();
    const galleryCount = await prisma.galleryImage.count();
    const networkCount = await prisma.networkNode.count();
    const activityCount = await prisma.activity.count();

    console.log('📊 Database Data Summary:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Posts: ${postCount}`);
    console.log(`   Projects: ${projectCount}`);
    console.log(`   Skills: ${skillCount}`);
    console.log(`   Anime: ${animeCount}`);
    console.log(`   Diaries: ${diaryCount}`);
    console.log(`   Announcements: ${announcementCount}`);
    console.log(`   Timeline Events: ${timelineCount}`);
    console.log(`   Gallery Images: ${galleryCount}`);
    console.log(`   Network Nodes: ${networkCount}`);
    console.log(`   Activities: ${activityCount}`);
    console.log('');

    if (postCount > 0) {
      console.log('✅ Database is populated!');
    } else {
      console.log('⚠️  Database is empty. Running seed...');
      const { main } = await import('../prisma/seed');
      await main();
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
