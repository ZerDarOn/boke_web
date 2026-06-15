import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Delete all existing anime (they have garbled titles)
  await prisma.anime.deleteMany({});
  console.log('Deleted all anime entries');

  const animes = [
    {
      title: '\u9ec4\u91d1\u52c7\u8005\u30b4\u30eb\u30c9\u30e9\u30f3',
      cover: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/The_Brave_of_Gold_Goldran_DVD_box_art.jpg/250px-The_Brave_of_Gold_Goldran_DVD_box_art.jpg',
      type: 'TV' as const,
      episodes: 48,
      aired: '1995\u5e742\u67084\u65e5 - 1996\u5e741\u670827\u65e5',
      studios: ['Sunrise'],
      genres: ['\u673a\u5668\u4eba', '\u559c\u5267', '\u5192\u9669', 'SF'],
      synopsis: '\u52c7\u8005\u7cfb\u5217\u7b2c6\u4f5c\u3002\u5c0f\u5b66\u751f\u62d3\u4e5f\u3001\u548c\u6811\u3001\u5927\u4e09\u4eba\u5076\u7136\u53d1\u73b0\u4e86\u795e\u79d8\u7684\u5b9d\u77f3\u201c\u529b\u91cf\u4e4b\u77f3\u201d\uff0c\u4ece\u4e2d\u5524\u9192\u4e86\u88ab\u79f0\u4e3a\u201c\u52c7\u8005\u201d\u7684\u673a\u5668\u4eba\u591a\u5170\u3002\u4e3a\u4e86\u524d\u5f80\u9ec4\u91d1\u4e61\u96f7\u6770\u591a\u62c9\uff0c\u4e09\u4eba\u8e0f\u4e0a\u4e86\u5bfb\u627e\u6563\u843d\u4e16\u754c\u5404\u5730\u76848\u9897\u529b\u91cf\u4e4b\u77f3\u7684\u5192\u9669\u4e4b\u65c5\u3002\u76d1\u7763\u662f\u540e\u6765\u6267\u5bfc\u300a\u94f6\u9b42\u300b\u7684\u9ad8\u677e\u4fe1\u53f8\uff0c\u5145\u6ee1\u98a0\u8986\u6027\u5e7d\u9ed8\u548c\u70ed\u70c8\u673a\u7532\u6218\u6597\u3002',
      currentEp: 48,
      status: 'COMPLETED' as const,
      score: 8.5,
      favorite: true,
      notes: '\u52c7\u8005\u7cfb\u5217\u4e2d\u6700\u5177\u559c\u5267\u8272\u5f69\u7684\u4e00\u4f5c\u3002\u9ad8\u677e\u4fe1\u53f8\u7684\u6f14\u51fa\u98ce\u683c\u5728\u540e\u7eed\u94f6\u9b42\u4e2d\u4e5f\u80fd\u770b\u5230\u5f71\u5b50\u3002\u654c\u6211\u53cc\u65b9\u7684\u4e92\u52a8\u975e\u5e38\u6709\u8da3\u3002',
      tags: ['\u52c7\u8005\u7cfb\u5217', 'Sunrise', '\u9ad8\u677e\u4fe1\u53f8', '\u7ae5\u5e74\u56de\u5fc6', '\u673a\u7532'],
      startDate: new Date('1995-02-04'),
      finishDate: new Date('1996-01-27'),
    },
    {
      title: '\u4eee\u9762\u30e9\u30a4\u30c0\u30fcZZZ',
      cover: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Kamen_Rider_ZEZTZ_logo.svg/250px-Kamen_Rider_ZEZTZ_logo.svg.png',
      type: 'TV' as const,
      episodes: 50,
      aired: '2025\u5e749\u67087\u65e5 - \u653e\u9001\u4e2d',
      studios: ['\u4e1c\u6620', 'TV\u671d\u65e5'],
      genres: ['\u7279\u6444', '\u52a8\u4f5c', '\u79d1\u5e7b', '\u5947\u5e7b'],
      synopsis: '\u4ee4\u548c\u4eee\u9762\u9a91\u58eb\u7b2c7\u4f5c\u3002\u4ee5\u201c\u68a6\u5883+\u7279\u5de5\u201d\u4e3a\u4e3b\u9898\uff0c\u8bb2\u8ff0\u7279\u5de5\u7ec4\u7ec7\u201c\u6697\u7801\u201d\u6210\u5458\u8fdb\u5165\u201c\u660e\u6670\u68a6\u201d\u7a7a\u95f4\uff0c\u901a\u8fc7Zeztz\u9a71\u52a8\u5668\u88c5\u8f7d\u7403\u72b6\u9053\u5177\u201cCapsem\u201d\u53d8\u8eab\uff0c\u5bf9\u6297\u68a6\u5883\u602a\u7269\u201c\u68a6\u9b47\u201d\u4ee5\u5b88\u62a4\u4eba\u7c7b\u7cbe\u795e\u9886\u57df\u7684\u6545\u4e8b\u3002\u7f16\u5267\u662f\u66fe\u8d1f\u8d23\u300a\u4eee\u9762\u9a91\u58ebEx-Aid\u300b\u7684\u9ad8\u6865\u60a0\u4e5f\u3002',
      currentEp: 35,
      status: 'WATCHING' as const,
      score: 9.1,
      favorite: true,
      notes: '\u68a6\u5883\u7279\u5de5\u7684\u6982\u5ff5\u5f88\u65b0\u9889\u3002\u9ad8\u6865\u60a0\u4e5f\u7684\u5267\u672c\u8282\u594f\u611f\u5f88\u597d\uff0c\u6bcf\u96c6\u90fd\u6709\u60ac\u5ff5\u3002\u6cfd\u91ce\u5f18\u4e4b\u7684\u97f3\u4e50\u4e5f\u4e00\u5982\u65e2\u5f80\u5730\u71c3\u3002',
      tags: ['\u4eee\u9762\u9a91\u58eb', '\u4ee4\u548c', '\u9ad8\u6865\u60a0\u4e5f', '\u6cfd\u91ce\u5f18\u4e4b', '\u7279\u6444'],
      startDate: new Date('2025-09-07'),
    },
    {
      title: 'Re:\u30bc\u30ed\u304b\u3089\u59cb\u3081\u308b\u7570\u4e16\u754c\u751f\u6d3b',
      cover: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Re_Zero_Volume_1_Light_Novel_Cover.jpg/250px-Re_Zero_Volume_1_Light_Novel_Cover.jpg',
      type: 'TV' as const,
      episodes: 76,
      aired: '2016\u5e744\u6708 - \u653e\u9001\u4e2d\uff084\u5b63\uff09',
      studios: ['White Fox'],
      genres: ['\u5f02\u4e16\u754c', '\u9ed1\u6697\u5947\u5e7b', '\u60ac\u7591', '\u5fc3\u7406'],
      synopsis: '\u65e5\u672c\u5c11\u5e74\u83dc\u6708\u6607\u88ab\u53ec\u5524\u5230\u5f02\u4e16\u754c\uff0c\u83b7\u5f97\u4e86\u201c\u6b7b\u4ea1\u56de\u5f52\u201d\u7684\u80fd\u529b\u2014\u2014\u6bcf\u6b21\u6b7b\u4ea1\u90fd\u4f1a\u56de\u5230\u7279\u5b9a\u65f6\u95f4\u70b9\u3002\u4e3a\u4e86\u4fdd\u62a4\u8eab\u8fb9\u7684\u4eba\uff0c\u4ed6\u4e0d\u65ad\u5728\u7edd\u671b\u4e2d\u6323\u624e\u3001\u6b7b\u4ea1\u3001\u91cd\u6765\uff0c\u5728\u4e0e\u547d\u8fd0\u7684\u6297\u4e89\u4e2d\u9010\u6e10\u6210\u957f\u3002\u6539\u7f16\u81ea\u957f\u6708\u8fbe\u5e73\u7684\u540c\u540d\u8f7b\u5c0f\u8bf4\u3002',
      currentEp: 76,
      status: 'COMPLETED' as const,
      score: 9.2,
      favorite: true,
      notes: '\u5f02\u4e16\u754c\u9898\u6750\u7684\u98a0\u8986\u4e4b\u4f5c\u3002\u6607\u4e0d\u662f\u9f99\u50b2\u5929\uff0c\u6bcf\u4e00\u6b21\u6210\u957f\u90fd\u4f34\u968f\u7740\u5de8\u5927\u7684\u75db\u82e6\u3002\u96f7\u59c6\u7ebf\u548c\u7231\u871c\u8389\u96c5\u7ebf\u7684\u60c5\u611f\u5904\u7406\u975e\u5e38\u7ec6\u817b\u3002\u5723\u57df\u7bc7\u7684\u8bd5\u70bc\u8bbe\u8ba1\u582a\u79f0\u4e00\u7edd\u3002',
      tags: ['\u5f02\u4e16\u754c', 'White Fox', '\u6b7b\u4ea1\u56de\u5f52', '\u5fc3\u7406\u63cf\u5199', '\u795e\u4f5c'],
      startDate: new Date('2016-04-04'),
      finishDate: new Date('2025-12-15'),
    },
    {
      title: '\u602a\u76d7\u30b8\u30e7\u30fc\u30ab\u30fc',
      cover: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Kaitou_Joker_manga_volume_1.jpg/250px-Kaitou_Joker_manga_volume_1.jpg',
      type: 'TV' as const,
      episodes: 52,
      aired: '2014\u5e7410\u67086\u65e5 - 2016\u5e7412\u670826\u65e5\uff084\u5b63\uff09',
      studios: ['Shin-Ei Animation'],
      genres: ['\u5192\u9669', '\u559c\u5267', '\u5c11\u5e74'],
      synopsis: '\u795e\u79d8\u7684\u602a\u76d7Joker\u62e5\u6709\u534e\u4e3d\u7684\u9b54\u672f\u624b\u6cd5\u548c\u795e\u51fa\u9b3c\u6ca1\u7684\u8eab\u624b\uff0c\u4e13\u95e8\u76d7\u53d6\u540d\u753b\u3001\u73cd\u5b9d\u7b49\u73cd\u5b9d\u3002\u4ed6\u4e0e\u6267\u62f7\u7684\u8b66\u90e8\u3001\u5176\u4ed6\u602a\u76d7\u5bf9\u624b\u6597\u667a\u6597\u52c7\uff0c\u6bcf\u6b21\u90fd\u534e\u4e3d\u5730\u8bbe\u4e0b\u9677\u9631\u6210\u529f\u9003\u8131\u3002\u6539\u7f16\u81ea\u9ad8\u6865\u82f1\u9756\u7684\u540c\u540d\u6f2b\u753b\uff0c\u83b7\u7b2c58\u5c4a\u5c0f\u5b66\u9986\u513f\u7ae5\u6f2b\u753b\u5956\u3002',
      currentEp: 52,
      status: 'COMPLETED' as const,
      score: 8.0,
      favorite: true,
      notes: '\u8f7b\u677e\u6109\u5feb\u7684\u602a\u76d7\u9898\u6750\u3002SHIN-EI\u7684\u5236\u4f5c\u6c34\u51c6\u5728\u7ebf\uff0c\u6bcf\u96c6\u90fd\u6709\u7cbe\u5f69\u7684\u9b54\u672f\u673a\u5173\u8bbe\u8ba1\u3002Joker\u548cHachi\u7684\u642d\u6863\u7ec4\u5408\u5f88\u840c\u3002\u9002\u5408\u653e\u677e\u65f6\u89c2\u770b\u3002',
      tags: ['\u602a\u76d7', 'SHIN-EI', '\u5bfa\u672c\u5e78\u4ee3', '\u513f\u7ae5\u5411', '\u8f7b\u677e'],
      startDate: new Date('2014-10-06'),
      finishDate: new Date('2016-12-26'),
    },
  ];

  for (const anime of animes) {
    console.log('Creating anime:', anime.title);
    await prisma.anime.create({ data: anime });
  }

  console.log('Anime seed completed! Created', animes.length, 'entries.');

  // Verify
  const all = await prisma.anime.findMany({ select: { title: true, status: true } });
  console.log('Verification:', JSON.stringify(all, null, 2));
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
