import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding anime data...');

  const animes = [
    {
      title: '黄金勇者ゴルドラン',
      cover: 'https://img1.baidu.com/it/u=1,1/sign=1/goldran.jpg',
      type: 'TV' as const,
      episodes: 48,
      aired: '1995年2月4日 - 1996年1月27日',
      studios: ['Sunrise'],
      genres: ['机器人', '喜剧', '冒险', 'SF'],
      synopsis: '勇者系列第6作。小学生拓也、和树、大三人偶然发现了神秘的宝石"力量之石"，从中唤醒了被称为"勇者"的机器人多兰。为了前往黄金乡雷杰多拉，三人踏上了寻找散落世界各地的8颗力量之石的冒险之旅。监督是后来执导《银魂》的高松信司，充满颠覆性幽默和热烈机甲战斗。',
      currentEp: 48,
      status: 'COMPLETED' as const,
      score: 8.5,
      favorite: true,
      notes: '勇者系列中最具喜剧色彩的一作。高松信司的演出风格在后续银魂中也能看到影子。敌我双方的互动非常有趣，"正义和邪恶为什么不能好好相处呢"的主题贯穿全剧。',
      tags: ['勇者系列', 'Sunrise', '高松信司', '童年回忆', '机甲'],
      startDate: new Date('1995-02-04'),
      finishDate: new Date('1996-01-27'),
    },
    {
      title: '假面骑士ZZZ (仮面ライダーゼッツ)',
      cover: 'https://img1.baidu.com/it/u=1,1/sign=1/zeztz.jpg',
      type: 'TV' as const,
      episodes: 50,
      aired: '2025年9月7日 - 放送中',
      studios: ['东映', 'TV朝日', 'ADK Emotions'],
      genres: ['特摄', '动作', '科幻', '奇幻'],
      synopsis: '令和假面骑士第7作。以"梦境+特工"为主题，讲述特工组织"暗码"成员进入"明晰梦"空间，通过Zeztz驱动器装载球状道具"Capsem"变身，对抗梦境怪物"梦魇"以守护人类精神领域"心灵之门"的故事。编剧是曾负责《假面骑士Ex-Aid》的高桥悠也。',
      currentEp: 35,
      status: 'WATCHING' as const,
      score: 9.1,
      favorite: true,
      notes: '梦境特工的概念很新颖。高桥悠也的剧本节奏感很好，每集都有悬念。泽野弘之的音乐也一如既往地燃。',
      tags: ['假面骑士', '令和', '高桥悠也', '泽野弘之', '特摄'],
      startDate: new Date('2025-09-07'),
    },
    {
      title: 'Re:从零开始的异世界生活',
      cover: 'https://img1.baidu.com/it/u=1,1/sign=1/rezero.jpg',
      type: 'TV' as const,
      episodes: 76,
      aired: '2016年4月 - 放送中（4季）',
      studios: ['White Fox'],
      genres: ['异世界', '黑暗奇幻', '悬疑', '心理'],
      synopsis: '日本少年菜月昴被召唤到异世界，获得了"死亡回归"的能力——每次死亡都会回到特定时间点。为了保护身边的人，他不断在绝望中挣扎、死亡、重来，在与命运的抗争中逐渐成长。改编自长月达平的同名轻小说，以残酷的死亡循环和深刻的心理描写著称。',
      currentEp: 76,
      status: 'COMPLETED' as const,
      score: 9.2,
      favorite: true,
      notes: '异世界题材的颠覆之作。昴不是龙傲天，每一次成长都伴随着巨大的痛苦。雷姆线和爱蜜莉雅线的情感处理非常细腻。圣域篇的试炼设计堪称一绝。',
      tags: ['异世界', 'White Fox', '死亡回归', '心理描写', '神作'],
      startDate: new Date('2016-04-04'),
      finishDate: new Date('2025-12-15'),
    },
    {
      title: '怪盗Joker (怪盗ジョーカー)',
      cover: 'https://img1.baidu.com/it/u=1,1/sign=1/joker.jpg',
      type: 'TV' as const,
      episodes: 52,
      aired: '2014年10月6日 - 2016年12月26日（4季）',
      studios: ['Shin-Ei Animation'],
      genres: ['冒险', '喜剧', '少年'],
      synopsis: '神秘的怪盗Joker拥有华丽的魔术手法和神出鬼没的身手，专门盗取名画、珠宝等珍宝。他与执拗的警部、其他怪盗对手斗智斗勇，每次都华丽地设下陷阱成功逃脱。改编自高桥英靖的同名漫画，获第58届小学馆儿童漫画奖。监督是曾执导哆啦A梦剧场版的寺本幸代。',
      currentEp: 52,
      status: 'COMPLETED' as const,
      score: 8.0,
      favorite: true,
      notes: '轻松愉快的怪盗题材。SHIN-EI的制作水准在线，每集都有精彩的魔术机关设计。Joker和Hachi的搭档组合很萌。适合放松时观看。',
      tags: ['怪盗', 'SHIN-EI', '寺本幸代', '儿童向', '轻松'],
      startDate: new Date('2014-10-06'),
      finishDate: new Date('2016-12-26'),
    },
  ];

  for (const anime of animes) {
    const existing = await prisma.anime.findFirst({
      where: { title: anime.title },
    });

    if (existing) {
      console.log('Anime already exists, updating:', anime.title);
      await prisma.anime.update({
        where: { id: existing.id },
        data: anime,
      });
    } else {
      console.log('Creating anime:', anime.title);
      await prisma.anime.create({ data: anime });
    }
  }

  console.log('Anime seed completed!');
  console.log('Anime created:', animes.length);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
