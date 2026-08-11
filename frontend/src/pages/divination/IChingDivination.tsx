import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateDivination } from '@/hooks/queries/divination';
import { getBazi, meihuaCast, type Bazi } from './bazi';
import { getZhouyiByNumber, type ZhouyiHexagram } from './zhouyi-data';
import DivinationAI from './DivinationAI';

// ============================================================
// 类型定义
// ============================================================
interface Hexagram {
  number: number;
  name: string;
  chineseName: string;
  symbol: number[]; // [初爻, 二爻, ..., 上爻]，1=阳，0=阴
  judgment: string;
  image: string;
}

interface TossResult {
  value: number; // 1=阳，0=阴
  changing: boolean; // 是否变爻
  sum: number; // 三币合计 6/7/8/9
}

// ============================================================
// 铜钱起卦算法
// ============================================================
function tossCoins(): TossResult {
  // 3 枚铜钱，背（无字面）=3，字（有字面）=2；三背=老阳(9)，三字=老阴(6)
  const coins = [
    Math.random() > 0.5 ? 3 : 2,
    Math.random() > 0.5 ? 3 : 2,
    Math.random() > 0.5 ? 3 : 2,
  ];
  const sum = coins.reduce((a, b) => a + b, 0);
  return {
    value: sum >= 7 ? 1 : 0, // 7,9=阳(1)，6,8=阴(0)
    changing: sum === 6 || sum === 9, // 6=老阴，9=老阳（变爻）
    sum,
  };
}

// 根据六爻（从下到上）查找卦象；symbol 约定：1=阳，0=阴
function findHexagram(symbol: number[]): Hexagram {
  return (
    HEXAGRAMS.find(h => h.symbol.join('') === symbol.join('')) ?? HEXAGRAMS[0]
  );
}

// 计算变卦
function getChangedHexagram(
  lines: TossResult[],
): { changedSymbol: number[]; changedHexagram: Hexagram | null } {
  const hasChanging = lines.some(l => l.changing);
  if (!hasChanging) return { changedSymbol: [], changedHexagram: null };
  const changedSymbol = lines.map(l => (l.changing ? 1 - l.value : l.value));
  return { changedSymbol, changedHexagram: findHexagram(changedSymbol) };
}

// ============================================================
// 白话解读（易理白话 + 动爻提示 + 变卦启示 + 行动建议）
// ============================================================
const SHICHEN_LABELS: Record<number, string> = {
  0: '子时 23-01',
  2: '丑时 01-03',
  4: '寅时 03-05',
  6: '卯时 05-07',
  8: '辰时 07-09',
  10: '巳时 09-11',
  12: '午时 11-13',
  14: '未时 13-15',
  16: '申时 15-17',
  18: '酉时 17-19',
  20: '戌时 19-21',
  22: '亥时 21-23',
};

const YAO_MEANINGS = [
  '初爻为根基之位，此事根基尚浅，宜先打牢基础，不宜冒进。',
  '二爻为己身之位，关键在自身的心性与行动，守正安分即是良策。',
  '三爻为进退之位，多有反复与犹疑，当审时度势，见机而行。',
  '四爻为近君之位，宜亲近能者、借助大势，独木难支，须求助力。',
  '五爻为尊位枢纽，事之成败在此一决，当以正大光明之道处之。',
  '上爻为终局之位，物极必反，宜留退路，急流勇退方为明智。',
];

function buildPlainReading(
  hex: Hexagram,
  changed: Hexagram | null,
  movingIndexes: number[],
  q: string,
): { summary: string; points: string[]; advice: string } {
  const points: string[] = [];
  const subject = q ? `你所问「${q}」一事` : '此事';

  // 总论
  let summary = `你占得「${hex.name}」。此卦之象，${hex.image}`;
  if (hex.number === 1 || hex.number === 2) {
    summary += '两卦纯一，气势纯粹，吉凶全由时位而定。';
  }

  // 动爻提示
  if (movingIndexes.length === 0) {
    points.push(`此卦六爻皆静，无有变爻。${subject}目前格局未变，按现势而行，宜守不宜攻。`);
  } else if (movingIndexes.length === 1) {
    points.push(`一爻发动，事机初现。${YAO_MEANINGS[movingIndexes[0]]}`);
    points.push(`动爻所在之处，正是${subject}的关键节点，当在此处着力。`);
  } else {
    points.push(`${movingIndexes.length}爻发动，事态多变，机势交杂。`);
    movingIndexes.forEach(i => points.push(YAO_MEANINGS[i]));
    points.push('多爻齐动，不可固执一端，须随变而应，方能持中。');
  }

  // 变卦启示
  if (changed) {
    points.push(`动而之「${changed.name}」，${subject}将由「${hex.name}」之局面转向「${changed.name}」之局面，${changed.image}`);
    if (changed.number < hex.number) {
      points.push('由后卦之位观之，变卦序数在前，事态趋向收敛、归于平实。');
    } else if (changed.number > hex.number) {
      points.push('变卦序数在后，事态尚有进展与展开的空间。');
    }
  }

  // 建议
  const advice =
    q
      ? `总而言之：${subject}当前处「${hex.name}」之势${changed ? `，最终将归于「${changed.name}」` : ''}。建议顺应卦象所示，宜缓不宜急、宜诚不宜巧，心正则路自明。`
      : `总而言之：当前处「${hex.name}」之势${changed ? `，最终将归于「${changed.name}」` : ''}。宜顺应时势，戒骄戒躁，守正则吉。`;

  return { summary, points, advice };
}

// ============================================================
// 完整六十四卦数据（按 König Wen 文王序）
// symbol 从初爻(下) 到 上爻(上)：1=阳，0=阴
// ============================================================
const HEXAGRAMS: Hexagram[] = [
  { number: 1, name: '乾为天', chineseName: '乾', symbol: [1, 1, 1, 1, 1, 1], judgment: '元亨利贞。', image: '天行健，君子以自强不息。' },
  { number: 2, name: '坤为地', chineseName: '坤', symbol: [0, 0, 0, 0, 0, 0], judgment: '元亨，利牝马之贞。君子有攸往，先迷后得主，利。西南得朋，东北丧朋。安贞，吉。', image: '地势坤，君子以厚德载物。' },
  { number: 3, name: '水雷屯', chineseName: '屯', symbol: [1, 0, 0, 0, 1, 0], judgment: '元亨利贞，勿用有攸往，利建侯。', image: '云雷屯，君子以经纶。' },
  { number: 4, name: '山水蒙', chineseName: '蒙', symbol: [0, 1, 0, 0, 0, 1], judgment: '亨。匪我求童蒙，童蒙求我。初筮告，再三渎，渎则不告。利贞。', image: '山下出泉，蒙；君子以果行育德。' },
  { number: 5, name: '水天需', chineseName: '需', symbol: [1, 1, 1, 0, 1, 0], judgment: '有孚，光亨，贞吉。利涉大川。', image: '云上于天，需；君子以饮食宴乐。' },
  { number: 6, name: '天水讼', chineseName: '讼', symbol: [0, 1, 0, 1, 1, 1], judgment: '有孚，窒。惕中吉。终凶。利见大人，不利涉大川。', image: '天与水违行，讼；君子以作事谋始。' },
  { number: 7, name: '地水师', chineseName: '师', symbol: [0, 1, 0, 0, 0, 0], judgment: '贞，丈人，吉无咎。', image: '地中有水，师；君子以容民畜众。' },
  { number: 8, name: '水地比', chineseName: '比', symbol: [0, 0, 0, 0, 1, 0], judgment: '吉。原筮，元永贞，无咎。不宁方来，后夫凶。', image: '地上有水，比；先王以建万国，亲诸侯。' },
  { number: 9, name: '风天小畜', chineseName: '小畜', symbol: [1, 1, 1, 1, 1, 0], judgment: '亨。密云不雨，自我西郊。', image: '风行天上，小畜；君子以懿文德。' },
  { number: 10, name: '天泽履', chineseName: '履', symbol: [0, 1, 1, 1, 1, 1], judgment: '履虎尾，不咥人，亨。', image: '上天下泽，履；君子以辩上下，定民志。' },
  { number: 11, name: '地天泰', chineseName: '泰', symbol: [1, 1, 1, 0, 0, 0], judgment: '小往大来，吉亨。', image: '天地交，泰；后以财成天地之道，辅相天地之宜，以左右民。' },
  { number: 12, name: '天地否', chineseName: '否', symbol: [0, 0, 0, 1, 1, 1], judgment: '否之匪人，不利君子贞，大往小来。', image: '天地不交，否；君子以俭德辟难，不可荣以禄。' },
  { number: 13, name: '天火同人', chineseName: '同人', symbol: [1, 0, 1, 1, 1, 1], judgment: '同人于野，亨。利涉大川，利君子贞。', image: '天与火，同人；君子以类族辨物。' },
  { number: 14, name: '火天大有', chineseName: '大有', symbol: [1, 1, 1, 1, 0, 1], judgment: '元亨。', image: '火在天上，大有；君子以遏恶扬善，顺天休命。' },
  { number: 15, name: '地山谦', chineseName: '谦', symbol: [0, 0, 1, 0, 0, 0], judgment: '亨，君子有终。', image: '地中有山，谦；君子以裒多益寡，称物平施。' },
  { number: 16, name: '雷地豫', chineseName: '豫', symbol: [0, 0, 0, 1, 0, 0], judgment: '利建侯行师。', image: '雷出地奋，豫；先王以作乐崇德，殷荐之上帝，以配祖考。' },
  { number: 17, name: '泽雷随', chineseName: '随', symbol: [1, 0, 0, 1, 1, 0], judgment: '元亨利贞，无咎。', image: '泽中有雷，随；君子以向晦入宴息。' },
  { number: 18, name: '山风蛊', chineseName: '蛊', symbol: [0, 1, 1, 0, 0, 1], judgment: '元亨，利涉大川。先甲三日，后甲三日。', image: '山下有风，蛊；君子以振民育德。' },
  { number: 19, name: '地泽临', chineseName: '临', symbol: [1, 1, 0, 0, 0, 0], judgment: '元，亨，利，贞。至于八月有凶。', image: '泽上有地，临；君子以教思无穷，容保民无疆。' },
  { number: 20, name: '风地观', chineseName: '观', symbol: [0, 0, 0, 0, 1, 1], judgment: '盥而不荐，有孚顒若。', image: '风行地上，观；先王以省方观民设教。' },
  { number: 21, name: '火雷噬嗑', chineseName: '噬嗑', symbol: [1, 0, 0, 1, 0, 1], judgment: '亨。利用狱。', image: '雷电，噬嗑；先王以明罚敕法。' },
  { number: 22, name: '山火贲', chineseName: '贲', symbol: [1, 0, 1, 0, 0, 1], judgment: '亨。小利有攸往。', image: '山下有火，贲；君子以明庶政，无敢折狱。' },
  { number: 23, name: '山地剥', chineseName: '剥', symbol: [0, 0, 0, 0, 0, 1], judgment: '不利有攸往。', image: '山附于地，剥；上以厚下安宅。' },
  { number: 24, name: '地雷复', chineseName: '复', symbol: [1, 0, 0, 0, 0, 0], judgment: '亨。出入无疾，朋来无咎。反复其道，七日来复，利有攸往。', image: '雷在地中，复；先王以至日闭关，商旅不行，后不省方。' },
  { number: 25, name: '天雷无妄', chineseName: '无妄', symbol: [1, 0, 0, 1, 1, 1], judgment: '元，亨，利，贞。其匪正有眚，不利有攸往。', image: '天下雷行，物与无妄；先王以茂对时，育万物。' },
  { number: 26, name: '山天大畜', chineseName: '大畜', symbol: [1, 1, 1, 0, 0, 1], judgment: '利贞，不家食吉，利涉大川。', image: '天在山中，大畜；君子以多识前言往行，以畜其德。' },
  { number: 27, name: '山雷颐', chineseName: '颐', symbol: [1, 0, 0, 0, 0, 1], judgment: '贞吉。观颐，自求口实。', image: '山下有雷，颐；君子以慎言语，节饮食。' },
  { number: 28, name: '泽风大过', chineseName: '大过', symbol: [0, 1, 1, 1, 1, 0], judgment: '栋桡，利有攸往，亨。', image: '泽灭木，大过；君子以独立不惧，遁世无闷。' },
  { number: 29, name: '坎为水', chineseName: '坎', symbol: [0, 1, 0, 0, 1, 0], judgment: '习坎，有孚，维心亨，行有尚。', image: '水洊至，习坎；君子以常德行，习教事。' },
  { number: 30, name: '离为火', chineseName: '离', symbol: [1, 0, 1, 1, 0, 1], judgment: '利贞，亨。畜牝牛，吉。', image: '明两作，离；大人以继明照于四方。' },
  { number: 31, name: '泽山咸', chineseName: '咸', symbol: [0, 0, 1, 1, 1, 0], judgment: '亨，利贞，取女吉。', image: '山上有泽，咸；君子以虚受人。' },
  { number: 32, name: '雷风恒', chineseName: '恒', symbol: [0, 1, 1, 0, 0, 1], judgment: '亨，无咎，利贞，利有攸往。', image: '雷风，恒；君子以立不易方。' },
  { number: 33, name: '天山遁', chineseName: '遁', symbol: [0, 0, 1, 1, 1, 1], judgment: '亨，小利贞。', image: '天下有山，遁；君子以远小人，不恶而严。' },
  { number: 34, name: '雷天大壮', chineseName: '大壮', symbol: [1, 1, 1, 1, 0, 0], judgment: '利贞。', image: '雷在天上，大壮；君子以非礼弗履。' },
  { number: 35, name: '火地晋', chineseName: '晋', symbol: [0, 0, 0, 1, 0, 1], judgment: '康侯用锡马蕃庶，昼日三接。', image: '明出地上，晋；君子以自昭明德。' },
  { number: 36, name: '地火明夷', chineseName: '明夷', symbol: [1, 0, 1, 0, 0, 0], judgment: '利艰贞。', image: '明入地中，明夷；君子以莅众，用晦而明。' },
  { number: 37, name: '风火家人', chineseName: '家人', symbol: [1, 0, 1, 0, 1, 1], judgment: '利女贞。', image: '风自火出，家人；君子以言有物而行有恒。' },
  { number: 38, name: '火泽睽', chineseName: '睽', symbol: [1, 1, 0, 1, 0, 1], judgment: '小事吉。', image: '上火下泽，睽；君子以同而异。' },
  { number: 39, name: '水山蹇', chineseName: '蹇', symbol: [0, 0, 1, 0, 1, 0], judgment: '利西南，不利东北；利见大人，贞吉。', image: '山上有水，蹇；君子以反身修德。' },
  { number: 40, name: '雷水解', chineseName: '解', symbol: [0, 1, 0, 1, 0, 0], judgment: '利西南，无所往，其来复吉。有攸往，夙吉。', image: '雷雨作，解；君子以赦过宥罪。' },
  { number: 41, name: '山泽损', chineseName: '损', symbol: [1, 1, 0, 0, 0, 1], judgment: '有孚，元吉，无咎，可贞，利有攸往。曷之用，二簋可用享。', image: '山下有泽，损；君子以惩忿窒欲。' },
  { number: 42, name: '风雷益', chineseName: '益', symbol: [1, 0, 0, 1, 1, 0], judgment: '利有攸往，利涉大川。', image: '风雷，益；君子以见善则迁，有过则改。' },
  { number: 43, name: '泽天夬', chineseName: '夬', symbol: [1, 1, 1, 1, 1, 0], judgment: '扬于王庭，孚号有厉，告自邑，不利即戎，利有攸往。', image: '泽上于天，夬；君子以施禄及下，居德则忌。' },
  { number: 44, name: '天风姤', chineseName: '姤', symbol: [0, 1, 1, 1, 1, 1], judgment: '女壮，勿用取女。', image: '天下有风，姤；后以施命诰四方。' },
  { number: 45, name: '泽地萃', chineseName: '萃', symbol: [0, 0, 0, 0, 1, 1], judgment: '亨。王假有庙，利见大人，亨，利贞。用大牲吉，利有攸往。', image: '泽上于地，萃；君子以除戎器，戒不虞。' },
  { number: 46, name: '地风升', chineseName: '升', symbol: [0, 1, 1, 0, 0, 0], judgment: '元亨，用见大人，勿恤，南征吉。', image: '地中生木，升；君子以顺德，积小以高大。' },
  { number: 47, name: '泽水困', chineseName: '困', symbol: [0, 1, 0, 1, 1, 0], judgment: '亨，贞，大人吉，无咎，有言不信。', image: '泽无水，困；君子以致命遂志。' },
  { number: 48, name: '水风井', chineseName: '井', symbol: [0, 1, 1, 0, 1, 0], judgment: '改邑不改井，无丧无得，往来井井。汔至，亦未繘井，羸其瓶，凶。', image: '木上有水，井；君子以劳民劝相。' },
  { number: 49, name: '泽火革', chineseName: '革', symbol: [1, 0, 1, 1, 1, 0], judgment: '巳日乃孚，元亨利贞，悔亡。', image: '泽中有火，革；君子以治历明时。' },
  { number: 50, name: '火风鼎', chineseName: '鼎', symbol: [0, 1, 1, 1, 0, 1], judgment: '元吉，亨。', image: '木上有火，鼎；君子以正位凝命。' },
  { number: 51, name: '震为雷', chineseName: '震', symbol: [1, 0, 0, 1, 0, 0], judgment: '亨。震来虩虩，笑言哑哑。震惊百里，不丧匕鬯。', image: '洊雷，震；君子以恐惧修省。' },
  { number: 52, name: '艮为山', chineseName: '艮', symbol: [0, 0, 1, 0, 0, 1], judgment: '艮其背，不获其身，行其庭，不见其人，无咎。', image: '兼山，艮；君子以思不出其位。' },
  { number: 53, name: '风山渐', chineseName: '渐', symbol: [0, 0, 1, 0, 1, 1], judgment: '女归吉，利贞。', image: '山上有木，渐；君子以居贤德善俗。' },
  { number: 54, name: '雷泽归妹', chineseName: '归妹', symbol: [1, 1, 0, 1, 0, 0], judgment: '征凶，无攸利。', image: '泽上有雷，归妹；君子以永终知敝。' },
  { number: 55, name: '雷火丰', chineseName: '丰', symbol: [1, 0, 1, 1, 0, 0], judgment: '亨，王假之，勿忧，宜日中。', image: '雷电皆至，丰；君子以折狱致刑。' },
  { number: 56, name: '火山旅', chineseName: '旅', symbol: [0, 0, 1, 1, 0, 1], judgment: '小亨，旅贞吉。', image: '山上有火，旅；君子以明慎用刑，而不留狱。' },
  { number: 57, name: '巽为风', chineseName: '巽', symbol: [0, 1, 1, 0, 1, 1], judgment: '小亨，利有攸往，利见大人。', image: '随风，巽；君子以申命行事。' },
  { number: 58, name: '兑为泽', chineseName: '兑', symbol: [1, 1, 0, 1, 1, 0], judgment: '亨，利贞。', image: '丽泽，兑；君子以朋友讲习。' },
  { number: 59, name: '风水涣', chineseName: '涣', symbol: [0, 1, 0, 1, 1, 1], judgment: '亨。王假有庙，利涉大川，利贞。', image: '风行水上，涣；先王以享于帝立庙。' },
  { number: 60, name: '水泽节', chineseName: '节', symbol: [1, 1, 0, 0, 1, 0], judgment: '亨。苦节不可贞。', image: '泽上有水，节；君子以制数度，议德行。' },
  { number: 61, name: '风泽中孚', chineseName: '中孚', symbol: [1, 1, 0, 0, 1, 1], judgment: '豚鱼吉，利涉大川，利贞。', image: '泽上有风，中孚；君子以议狱缓死。' },
  { number: 62, name: '雷山小过', chineseName: '小过', symbol: [0, 0, 1, 1, 0, 0], judgment: '亨，利贞，可小事，不可大事。飞鸟遗之音，不宜上宜下，大吉。', image: '山上有雷，小过；君子以行过乎恭，丧过乎哀，用过乎俭。' },
  { number: 63, name: '水火既济', chineseName: '既济', symbol: [1, 0, 1, 0, 1, 0], judgment: '亨，小利贞，初吉终乱。', image: '水在火上，既济；君子以思患而预防之。' },
  { number: 64, name: '火水未济', chineseName: '未济', symbol: [0, 1, 0, 1, 0, 1], judgment: '亨，小狐汔济，濡其尾，无攸利。', image: '火在水上，未济；君子以慎辨物居方。' },
];

// ============================================================
// 阶段定义
// ============================================================
type Phase = 'idle' | 'tossing' | 'result';

// ============================================================
// 子组件：铜钱
// ============================================================
function Coin({
  spinning,
  face,
  delay,
}: {
  spinning: boolean;
  face: number; // 3=字(正)，2=背(反)
  delay: number;
}) {
  return (
    <div
      className="relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-transform duration-500"
      style={{
        border: '2px solid rgba(245, 158, 11, 0.5)',
        background: spinning
          ? 'radial-gradient(circle at 50% 50%, rgba(245,158,11,0.25), rgba(120,53,15,0.15))'
          : 'radial-gradient(circle at 40% 35%, rgba(252,211,77,0.22), rgba(120,53,15,0.18))',
        animation: spinning ? `spin 0.6s linear ${delay}ms infinite` : undefined,
        boxShadow: '0 0 10px rgba(245,158,11,0.25)',
      }}
    >
      {/* 中心方孔 */}
      <div
        className="absolute w-3 h-3 md:w-4 md:h-4 rounded-sm"
        style={{
          border: '1px solid rgba(245, 158, 11, 0.4)',
          background: 'rgba(5, 6, 10, 0.8)',
        }}
      />
      {/* 背=3 显示纹饰 / 字=2 显示乾字 */}
      <span
        className="relative font-serif text-[9px] md:text-[10px] text-amber-300/70 select-none"
        style={{ opacity: spinning ? 0.4 : 1 }}
      >
        {face === 2 ? '乾' : '✦'}
      </span>
    </div>
  );
}

// ============================================================
// 子组件：单爻横线（从下到上）
// ============================================================
function YaoLine({
  value,
  changing,
  label,
}: {
  value: number; // 1=阳，0=阴
  changing: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {/* 爻位标签 */}
      <span className="font-mono text-[9px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.3)] w-6 text-right">
        {label}
      </span>
      {/* 爻线 */}
      <div className="flex-1 flex items-center gap-1">
        {value === 1 ? (
          <div
            className={`h-1 flex-1 rounded-full transition-colors ${
              changing ? 'bg-amber-400 animate-pulse' : 'bg-neon'
            }`}
            style={
              changing
                ? { boxShadow: '0 0 8px rgba(251, 191, 36, 0.6)' }
                : { boxShadow: '0 0 6px hsl(var(--color-neon-hsl) / 0.4)' }
            }
          />
        ) : (
          <>
            <div
              className={`h-1 flex-1 rounded-full transition-colors ${
                changing ? 'bg-amber-400 animate-pulse' : 'bg-secondary'
              }`}
              style={
                changing
                  ? { boxShadow: '0 0 8px rgba(251, 191, 36, 0.6)' }
                  : { boxShadow: '0 0 6px hsl(var(--color-secondary-hsl) / 0.4)' }
              }
            />
            {/* 中间断开的间隙 */}
            <div className="w-3 shrink-0" />
            <div
              className={`h-1 flex-1 rounded-full transition-colors ${
                changing ? 'bg-amber-400 animate-pulse' : 'bg-secondary'
              }`}
              style={
                changing
                  ? { boxShadow: '0 0 8px rgba(251, 191, 36, 0.6)' }
                  : { boxShadow: '0 0 6px hsl(var(--color-secondary-hsl) / 0.4)' }
              }
            />
          </>
        )}
      </div>
      {/* 爻性标注 */}
      <span
        className={`font-mono text-[9px] uppercase tracking-widest w-10 ${
          changing ? 'text-amber-400' : 'text-[hsla(var(--div-text-hsl)/0.3)]'
        }`}
      >
        {value === 1 ? '阳' : '阴'}
        {changing ? ' · 变' : ''}
      </span>
    </div>
  );
}

// ============================================================
// 子组件：赛博印章双层方框装饰
// ============================================================
function CornerFrame() {
  const cornerCls =
    'absolute w-4 h-4 border-[hsla(var(--div-line-hsl)/0.25)]';
  return (
    <>
      <div className={`${cornerCls} top-0 left-0 border-t border-l`} />
      <div className={`${cornerCls} top-0 right-0 border-t border-r`} />
      <div className={`${cornerCls} bottom-0 left-0 border-b border-l`} />
      <div className={`${cornerCls} bottom-0 right-0 border-b border-r`} />
    </>
  );
}

// ============================================================
// 主组件
// ============================================================
export default function IChingDivination() {
  const navigate = useNavigate();
  const createDivination = useCreateDivination();

  const [phase, setPhase] = useState<Phase>('idle');
  const [question, setQuestion] = useState('');
  const [lines, setLines] = useState<TossResult[]>([]);
  const [currentToss, setCurrentToss] = useState<number>(-1); // 正在抛第几爻（0-5），-1 表示未开始
  const [coinFaces, setCoinFaces] = useState<number[]>([2, 2, 2]); // 当前铜钱显示面
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 起卦方式与生辰八字
  type CastMethod = 'coins' | 'time' | 'bazi';
  const [castMethod, setCastMethod] = useState<CastMethod>('coins');
  const [baziData, setBaziData] = useState<Bazi | null>(null);
  const [birthDate, setBirthDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [birthHour, setBirthHour] = useState<number>(12);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 时间 / 生辰起卦（梅花易数：年支数 + 月 + 日 + 时）
  const castByTime = useCallback((y: number, m: number, d: number, h: number, method: CastMethod) => {
    const { symbol, movingLine } = meihuaCast(y, m, d, h);
    const results: TossResult[] = symbol.map((v, i) => ({
      value: v,
      changing: i === movingLine,
      sum: v ? 7 : 8, // 展示用（时间起卦无铜钱面值）
    }));
    if (method === 'bazi') {
      setBaziData(getBazi(y, m, d, h));
    } else {
      setBaziData(null);
    }
    setLines(results);
    setPhase('result');
  }, []);

  // 起卦入口：按方式分发
  const startDivination = useCallback((method: CastMethod) => {
    if (method === 'coins') {
      startCoinsCast();
      return;
    }
    const now = new Date();
    if (method === 'time') {
      castByTime(now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), method);
      return;
    }
    // 生辰起卦
    const [yy, mm, dd] = birthDate.split('-').map(Number);
    castByTime(
      yy || now.getFullYear(),
      mm || now.getMonth() + 1,
      dd || now.getDate(),
      birthHour,
      method,
    );
  }, [birthDate, birthHour, castByTime]);

  // 起卦流程（铜钱）：6 次抛掷，从下往上
  const startCoinsCast = useCallback(() => {
    setPhase('tossing');
    setLines([]);
    setCurrentToss(0);
    const results: TossResult[] = [];

    const tossOne = (index: number) => {
      if (index >= 6) {
        // 全部完成
        setCurrentToss(-1);
        setCoinFaces([2, 2, 2]);
        setLines(results);
        setPhase('result');
        return;
      }
      setCurrentToss(index);

      // 抛掷动画期间显示随机翻转
      const spinInterval = setInterval(() => {
        setCoinFaces([
          Math.random() > 0.5 ? 3 : 2,
          Math.random() > 0.5 ? 3 : 2,
          Math.random() > 0.5 ? 3 : 2,
        ]);
      }, 100);

      // 800ms 后定格结果
      timerRef.current = setTimeout(() => {
        clearInterval(spinInterval);
        const result = tossCoins();
        results[index] = result;
        // 显示最终面
        const sum = result.sum;
        // 根据合计反推铜钱面（近似展示）
        if (sum === 9) setCoinFaces([3, 3, 3]);
        else if (sum === 8) setCoinFaces([3, 3, 2]);
        else if (sum === 7) setCoinFaces([3, 2, 2]);
        else setCoinFaces([2, 2, 2]);

        // 更新已完成的爻（用于实时显示）
        setLines([...results]);

        // 进入下一爻
        timerRef.current = setTimeout(() => tossOne(index + 1), 300);
      }, 800);
    };

    tossOne(0);
  }, []);

  // 重置
  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase('idle');
    setLines([]);
    setCurrentToss(-1);
    setCoinFaces([2, 2, 2]);
    setBaziData(null);
  }, []);

  // 记录结果到后端（静默，不阻塞 UI）
  useEffect(() => {
    if (phase !== 'result' || lines.length !== 6) return;
    const symbol = lines.map(l => l.value);
    const hexagram = findHexagram(symbol);
    const { changedHexagram } = getChangedHexagram(lines);
    const changingLines = lines
      .map((l, i) => (l.changing ? i : -1))
      .filter(i => i >= 0);

    try {
      createDivination.mutate({
        type: 'ICHING',
        question: question.trim() || undefined,
        result: {
          hexagram: {
            number: hexagram.number,
            name: hexagram.name,
            symbol: hexagram.symbol,
            judgment: hexagram.judgment,
            image: hexagram.image,
          },
          changingLines,
          changedHexagram: changedHexagram
            ? {
                number: changedHexagram.number,
                name: changedHexagram.name,
                symbol: changedHexagram.symbol,
                judgment: changedHexagram.judgment,
                image: changedHexagram.image,
              }
            : null,
        },
      });
    } catch {
      // 记录失败不影响展示
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, lines]);

  // 计算最终卦象
  const currentSymbol = lines.length === 6 ? lines.map(l => l.value) : null;
  const currentHexagram = currentSymbol ? findHexagram(currentSymbol) : null;
  const { changedHexagram } =
    lines.length === 6 ? getChangedHexagram(lines) : { changedHexagram: null };
  const changingLineIndexes = lines
    .map((l, i) => (l.changing ? i : -1))
    .filter(i => i >= 0);

  // 爻位名称（从下到上）
  const yaoLabels = ['初', '二', '三', '四', '五', '上'];

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: 'hsla(var(--div-bg-hsl))' }}
    >
      {/* 背景装饰：太极光环 */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-10"
        style={{
          background:
            'radial-gradient(circle, hsl(var(--color-secondary-hsl) / 0.3) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-10 md:py-16">
        {/* ========== 顶部：返回 + 标题 ========== */}
        <div className="w-full max-w-2xl flex items-center justify-between mb-12">
          <button
            onClick={() => navigate('/divination')}
            className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.4)] hover:text-neon transition-colors flex items-center gap-2"
          >
            <span>←</span>
            <span>返回</span>
          </button>
          <div className="text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-secondary mb-1">
              / ICHING
            </div>
            <h1 className="font-serif font-black text-2xl md:text-3xl text-[hsl(var(--div-text-hsl))] tracking-tight">
              易卦
            </h1>
          </div>
          <div className="w-16" />
        </div>

        {/* ========== 中部：根据阶段显示 ========== */}

        {/* --- 阶段 1：静心凝神 --- */}
        {phase === 'idle' && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-xl w-full">
            {/* 太极装饰 */}
            <div className="relative w-32 h-32 md:w-40 md:h-40 mb-10">
              <div
                className="absolute inset-0 rounded-full border"
                style={{ borderColor: 'hsl(var(--color-secondary-hsl) / 0.3)' }}
              />
              <div
                className="absolute inset-4 rounded-full border animate-spin-slow"
                style={{ borderColor: 'hsl(var(--color-neon-hsl) / 0.2)' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="font-serif text-5xl md:text-6xl"
                  style={{ color: 'var(--color-secondary)' }}
                >
                  ☯
                </span>
              </div>
            </div>

            <div className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.3)] mb-3">
              · 静心凝神 ·
            </div>
            <p className="font-serif text-[hsla(var(--div-text-hsl)/0.5)] text-sm md:text-base text-center leading-relaxed mb-8">
              闭目调息，心念归于一事
              <br />
              待心意澄明，再起卦象
            </p>

            {/* 问题输入（可选） */}
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="心中所问之事（可选）"
              maxLength={60}
              className="w-full max-w-md bg-[hsla(var(--div-line-hsl)/0.06)] border border-[hsla(var(--div-line-hsl)/0.12)] rounded-lg px-4 py-3 text-center font-serif text-sm text-[hsla(var(--div-text-hsl)/0.8)] placeholder:text-[hsla(var(--div-text-hsl)/0.2)] focus:outline-none focus:border-secondary/50 transition-colors mb-8"
            />

            {/* 起卦方式选择 */}
            <div className="w-full max-w-md mb-8">
              <div className="grid grid-cols-3 gap-1 bg-[hsla(var(--div-line-hsl)/0.04)] border border-[hsla(var(--div-line-hsl)/0.12)] rounded-lg p-1 mb-6">
                {([
                  ['coins', '摇卦'],
                  ['time', '时间起卦'],
                  ['bazi', '生辰起卦'],
                ] as [CastMethod, string][]).map(([m, label]) => (
                  <button
                    key={m}
                    onClick={() => setCastMethod(m)}
                    className={`py-2.5 font-mono text-[10px] uppercase tracking-widest rounded-md transition-all duration-300 ${
                      castMethod === m
                        ? 'bg-secondary/20 text-secondary border border-secondary/40'
                        : 'text-[hsla(var(--div-text-hsl)/0.4)] hover:text-[hsla(var(--div-text-hsl)/0.7)] border border-transparent'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* 摇卦 */}
              {castMethod === 'coins' && (
                <div className="text-center">
                  <p className="font-serif text-[hsla(var(--div-text-hsl)/0.4)] text-xs leading-relaxed mb-5">
                    三枚铜钱，自下而上掷六次
                    <br />
                    三背为老阳（动），三字为老阴（动）
                  </p>
                  <button
                    onClick={() => startDivination('coins')}
                    className="group relative px-10 py-4 font-serif text-lg text-[hsl(var(--div-text-hsl))] transition-all duration-500 hover:scale-105"
                    style={{
                      border: '1px solid hsl(var(--color-secondary-hsl) / 0.4)',
                      background: 'hsl(var(--color-secondary-hsl) / 0.08)',
                    }}
                  >
                    <span className="relative z-10">开始摇卦</span>
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background:
                          'radial-gradient(circle, hsl(var(--color-secondary-hsl) / 0.15), transparent 70%)',
                      }}
                    />
                  </button>
                </div>
              )}

              {/* 时间起卦 */}
              {castMethod === 'time' && (
                <div className="text-center">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.3)] mb-2">
                    当下时刻
                  </div>
                  <div className="font-serif text-2xl text-secondary mb-1 tabular-nums">
                    {new Date().toLocaleTimeString('zh-CN', { hour12: false })}
                  </div>
                  <p className="font-serif text-[hsla(var(--div-text-hsl)/0.4)] text-xs leading-relaxed mb-5">
                    以当下年月日时推数起卦
                    <br />
                    （梅花易数 · 时间起卦法）
                  </p>
                  <button
                    onClick={() => startDivination('time')}
                    className="group relative px-10 py-4 font-serif text-lg text-[hsl(var(--div-text-hsl))] transition-all duration-500 hover:scale-105"
                    style={{
                      border: '1px solid hsl(var(--color-neon-hsl) / 0.4)',
                      background: 'hsl(var(--color-neon-hsl) / 0.08)',
                    }}
                  >
                    <span className="relative z-10">以当下时辰起卦</span>
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background:
                          'radial-gradient(circle, hsl(var(--color-neon-hsl) / 0.15), transparent 70%)',
                      }}
                    />
                  </button>
                </div>
              )}

              {/* 生辰起卦 */}
              {castMethod === 'bazi' && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.3)] mb-1.5">
                        出生日期
                      </div>
                      <input
                        type="date"
                        value={birthDate}
                        onChange={e => setBirthDate(e.target.value)}
                        className="bg-[hsla(var(--div-line-hsl)/0.06)] border border-[hsla(var(--div-line-hsl)/0.12)] rounded-lg px-3 py-2 text-sm text-[hsla(var(--div-text-hsl)/0.8)] focus:outline-none focus:border-secondary/50 font-serif"
                      />
                    </div>
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.3)] mb-1.5">
                        时辰
                      </div>
                      <select
                        value={birthHour}
                        onChange={e => setBirthHour(Number(e.target.value))}
                        className="bg-[hsla(var(--div-line-hsl)/0.06)] border border-[hsla(var(--div-line-hsl)/0.12)] rounded-lg px-3 py-2 text-sm text-[hsla(var(--div-text-hsl)/0.8)] focus:outline-none focus:border-secondary/50 font-serif"
                      >
                        {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map(h => (
                          <option key={h} value={h} className="bg-[hsla(var(--div-card-hsl))]">
                            {SHICHEN_LABELS[h] ?? `${h}时`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="font-serif text-[hsla(var(--div-text-hsl)/0.4)] text-xs leading-relaxed mb-5">
                    依生辰排出四柱八字，再以八字时刻起卦
                    <br />
                    以出生时辰推命之格局
                  </p>
                  <button
                    onClick={() => startDivination('bazi')}
                    className="group relative px-10 py-4 font-serif text-lg text-[hsl(var(--div-text-hsl))] transition-all duration-500 hover:scale-105"
                    style={{
                      border: '1px solid hsl(var(--color-secondary-hsl) / 0.4)',
                      background: 'hsl(var(--color-secondary-hsl) / 0.08)',
                    }}
                  >
                    <span className="relative z-10">排盘起卦</span>
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background:
                          'radial-gradient(circle, hsl(var(--color-secondary-hsl) / 0.15), transparent 70%)',
                      }}
                    />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-10 flex items-center gap-2">
              <div className="h-px w-8 bg-[hsla(var(--div-line-hsl)/0.1)]" />
              <span className="font-serif text-[hsla(var(--div-text-hsl)/0.2)] text-xs italic">
                易，无思也，无为也
              </span>
              <div className="h-px w-8 bg-[hsla(var(--div-line-hsl)/0.1)]" />
            </div>
          </div>
        )}

        {/* --- 阶段 2：铜钱起卦 --- */}
        {phase === 'tossing' && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-xl w-full">
            {/* 当前爻次提示 */}
            <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-secondary mb-2">
              · 第 {Math.max(currentToss + 1, 1)} 爻 / 共六爻 ·
            </div>
            <p className="font-serif text-[hsla(var(--div-text-hsl)/0.4)] text-sm mb-10">
              {currentToss >= 0
                ? `正在起 ${yaoLabels[currentToss]} 爻`
                : '凝神...'}
            </p>

            {/* 三枚铜钱 */}
            <div className="flex gap-6 md:gap-8 mb-12">
              {coinFaces.map((face, i) => (
                <Coin
                  key={i}
                  spinning={currentToss >= 0}
                  face={face}
                  delay={i * 80}
                />
              ))}
            </div>

            {/* 实时爻象（从下到上） */}
            <div className="w-full max-w-xs space-y-3">
              {Array.from({ length: 6 }).map((_, i) => {
                const reverseIndex = 5 - i; // 从上到下渲染
                const line = lines[reverseIndex];
                return (
                  <div
                    key={i}
                    className={`transition-opacity duration-300 ${
                      line ? 'opacity-100' : 'opacity-20'
                    }`}
                  >
                    <YaoLine
                      value={line ? line.value : 0}
                      changing={line ? line.changing : false}
                      label={yaoLabels[reverseIndex]}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- 阶段 3：卦象展示 + 卦辞解读 --- */}
        {phase === 'result' && currentHexagram && (
          <div className="flex-1 w-full max-w-2xl space-y-10">
            {/* 生辰八字排盘（生辰起卦时显示） */}
            {baziData && (
              <div className="bg-[hsla(var(--div-line-hsl)/0.03)] border border-[hsla(var(--div-line-hsl)/0.12)] rounded-2xl p-6 md:p-8 animate-fade-up">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary mb-5">
                  / 生辰八字 · 四柱排盘
                </div>
                <div className="flex items-start justify-center gap-5 md:gap-10">
                  {([
                    ['年柱', baziData.yearPillar],
                    ['月柱', baziData.monthPillar],
                    ['日柱', baziData.dayPillar],
                    ['时柱', baziData.hourPillar],
                  ] as [string, { gan: string; zhi: string; ganWuxing: string; zhiWuxing: string; nayin: string }][]).map(([label, p]) => (
                    <div key={label} className="text-center">
                      <div className="font-mono text-[9px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.3)] mb-2">
                        {label}
                      </div>
                      <div
                        className="font-serif text-2xl md:text-3xl font-bold"
                        style={{ color: 'var(--color-secondary)' }}
                      >
                        {p.gan}
                      </div>
                      <div className="font-serif text-2xl md:text-3xl font-bold text-[hsla(var(--div-text-hsl)/0.8)]">
                        {p.zhi}
                      </div>
                      <div className="font-mono text-[9px] text-[hsla(var(--div-text-hsl)/0.35)] mt-2.5">
                        {p.ganWuxing}{p.zhiWuxing} · {p.nayin}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-6 font-serif text-[hsla(var(--div-text-hsl)/0.4)] text-xs">
                  {baziData.lunarText} · 属{baziData.shengxiao}
                </div>
              </div>
            )}

            {/* 卦象展示 */}
            <div className="relative bg-[hsla(var(--div-line-hsl)/0.03)] border border-[hsla(var(--div-line-hsl)/0.12)] rounded-2xl p-8 md:p-10">
              <CornerFrame />

              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* 竖排卦名 + 卦号 */}
                <div className="flex flex-row md:flex-col items-center gap-2 md:gap-1">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.3)]">
                    No.
                  </div>
                  <div
                    className="font-serif text-2xl"
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    {String(currentHexagram.number).padStart(2, '0')}
                  </div>
                  {/* 竖排卦名（旋转） */}
                  <div
                    className="font-serif text-lg text-[hsla(var(--div-text-hsl)/0.8)] tracking-widest md:transform md:rotate-180"
                    style={{ writingMode: 'vertical-rl' }}
                  >
                    {currentHexagram.chineseName}
                  </div>
                </div>

                {/* 六爻图（从上到下渲染 = 上爻在顶部） */}
                <div className="flex-1 w-full max-w-xs space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => {
                    const reverseIndex = 5 - i; // 上爻在顶部
                    const line = lines[reverseIndex];
                    return (
                      <div
                        key={i}
                        className="animate-fade-up"
                        style={{ animationDelay: `${120 + i * 140}ms`, animationFillMode: 'both' }}
                      >
                        <YaoLine
                          value={line.value}
                          changing={line.changing}
                          label={yaoLabels[reverseIndex]}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* 卦名 + 卦符号 */}
                <div className="text-center md:text-right">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.3)] mb-1">
                    HEXAGRAM
                  </div>
                  <h2 className="font-serif font-black text-2xl text-[hsl(var(--div-text-hsl))] mb-1">
                    {currentHexagram.name}
                  </h2>
                  {changingLineIndexes.length > 0 && (
                    <div className="font-mono text-[10px] uppercase tracking-widest text-amber-400 mt-2">
                      · 有变爻 ·
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 卦辞解读 */}
            <div className="bg-[hsla(var(--div-line-hsl)/0.03)] border border-[hsla(var(--div-line-hsl)/0.12)] rounded-2xl p-8 md:p-10">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neon mb-6">
                / 卦辞 · 彖传
              </div>

              {/* 卦辞 */}
              <div className="mb-6">
                <div className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.3)] mb-2">
                  〔卦辞〕
                </div>
                <p className="font-serif text-[hsla(var(--div-text-hsl)/0.8)] text-base md:text-lg leading-relaxed">
                  {currentHexagram.judgment}
                </p>
              </div>

              {/* 象辞（大象传） */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.3)] mb-2">
                  〔象辞〕
                </div>
                <p className="font-serif text-[hsla(var(--div-text-hsl)/0.7)] text-sm md:text-base leading-relaxed">
                  {currentHexagram.image}
                </p>
              </div>
            </div>

            {/* 白话解读 */}
            {(() => {
              const reading = buildPlainReading(
                currentHexagram,
                changedHexagram,
                changingLineIndexes,
                question,
              );
              return (
                <div className="bg-neon/[0.03] border border-neon/20 rounded-2xl p-8 md:p-10 animate-fade-up">
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neon mb-6">
                    / 白话解读
                  </div>
                  <p className="font-serif text-[hsla(var(--div-text-hsl)/0.8)] text-base leading-relaxed mb-5">
                    {reading.summary}
                  </p>
                  <div className="space-y-2.5 mb-6">
                    {reading.points.map((pt, i) => (
                      <p key={i} className="flex gap-2.5 text-[hsla(var(--div-text-hsl)/0.6)] text-sm leading-relaxed">
                        <span className="text-neon shrink-0">◆</span>
                        <span className="font-serif">{pt}</span>
                      </p>
                    ))}
                  </div>
                  <div className="border-t border-[hsla(var(--div-line-hsl)/0.12)] pt-4">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-neon/60 mb-2">
                      〔建议〕
                    </div>
                    <p className="font-serif text-[hsla(var(--div-text-hsl)/0.7)] text-sm leading-relaxed">
                      {reading.advice}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* 现代深度解读（开源 64 卦全维度数据） */}
            {(() => {
              const deep = getZhouyiByNumber(currentHexagram.number);
              if (!deep) return null;
              const dims: [keyof ZhouyiHexagram['reading'], string, string][] = [
                ['shiyi', '事业', '◇'],
                ['aiqing', '爱情', '♥'],
                ['caiyun', '财运', '◎'],
                ['kaoshi', '学业', '✎'],
                ['jiankang', '健康', '☾'],
                ['chuxing', '出行', '➤'],
                ['guansi', '官司', '⚖'],
                ['jiazhai', '家宅', '⌂'],
              ];
              return (
                <div className="bg-[hsla(var(--div-line-hsl)/0.03)] border border-[hsla(var(--div-line-hsl)/0.12)] rounded-2xl p-8 md:p-10 animate-fade-up">
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary mb-6">
                    / 现代解卦
                  </div>
                  {/* 核心意象 */}
                  {deep.coreImage && (
                    <p className="font-serif text-[hsla(var(--div-text-hsl)/0.8)] text-base leading-relaxed mb-6">
                      {deep.coreImage}
                    </p>
                  )}
                  {/* 8 维度 */}
                  <div className="grid gap-4 md:grid-cols-2 mb-6">
                    {dims.map(([k, label, icon]) => {
                      const v = deep.reading[k];
                      if (!v) return null;
                      return (
                        <div key={k} className="bg-[hsla(var(--div-line-hsl)/0.03)] border border-[hsla(var(--div-line-hsl)/0.06)] rounded-xl p-4">
                          <div className="font-mono text-[10px] tracking-widest text-secondary/70 mb-2">
                            {icon} {label}
                          </div>
                          <p className="font-serif text-[hsla(var(--div-text-hsl)/0.6)] text-xs leading-relaxed">
                            {v}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  {/* 宜 / 忌 */}
                  <div className="grid gap-4 md:grid-cols-2 mb-6">
                    <div className="rounded-xl p-4" style={{ background: 'hsl(var(--color-neon-hsl) / 0.04)', border: '1px solid hsl(var(--color-neon-hsl) / 0.15)' }}>
                      <div className="font-mono text-[10px] tracking-widest text-neon/70 mb-2">
                        ▲ 宜
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {deep.yi.map((y, i) => (
                          <span key={i} className="font-serif text-xs text-[hsla(var(--div-text-hsl)/0.6)] px-2.5 py-1 rounded-full bg-[hsla(var(--div-line-hsl)/0.06)] border border-[hsla(var(--div-line-hsl)/0.12)]">
                            {y}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl p-4" style={{ background: 'hsl(var(--color-secondary-hsl) / 0.04)', border: '1px solid hsl(var(--color-secondary-hsl) / 0.15)' }}>
                      <div className="font-mono text-[10px] tracking-widest text-secondary/70 mb-2">
                        ▼ 忌
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {deep.ji.map((j, i) => (
                          <span key={i} className="font-serif text-xs text-[hsla(var(--div-text-hsl)/0.6)] px-2.5 py-1 rounded-full bg-[hsla(var(--div-line-hsl)/0.06)] border border-[hsla(var(--div-line-hsl)/0.12)]">
                            {j}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* 卦义白话（古人占断） */}
                  {deep.guaYi && (
                    <div className="border-t border-[hsla(var(--div-line-hsl)/0.06)] pt-4">
                      <div className="font-mono text-[10px] tracking-widest text-[hsla(var(--div-text-hsl)/0.4)] mb-2">
                        〔古断〕
                      </div>
                      <p className="font-serif text-[hsla(var(--div-text-hsl)/0.55)] text-xs leading-relaxed">
                        {deep.guaYi}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* AI 深度解读（用户主动选择才调用） */}
            <DivinationAI
              kind="iching"
              spread={[
                `占得「${currentHexagram.name}」卦（第 ${currentHexagram.number} 卦）`,
                `卦辞：${currentHexagram.judgment}`,
                `卦象（自下而上）：${lines.map(l => (l.value ? '⚊' : '⚋')).join(' ')}`,
                changingLineIndexes.length > 0
                  ? `动爻：${changingLineIndexes.map(i => yaoLabels[i]).join('、')}爻`
                  : '六爻皆静',
                changedHexagram ? `变卦：${changedHexagram.name}` : '',
              ]
                .filter(Boolean)
                .join('\n')}
              question={question.trim() || undefined}
            />

            {/* 变卦解读 */}
            {changedHexagram && (
              <div className="bg-amber-400/[0.03] border border-amber-400/20 rounded-2xl p-8 md:p-10">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-400 mb-6">
                  / 变卦 · {changedHexagram.name}
                </div>

                {/* 变卦小图 */}
                <div className="flex items-center gap-6 mb-6">
                  <div className="flex-1 w-full max-w-[160px] space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => {
                      const reverseIndex = 5 - i;
                      const origLine = lines[reverseIndex];
                      const changedValue = origLine.changing
                        ? 1 - origLine.value
                        : origLine.value;
                      return (
                        <YaoLine
                          key={i}
                          value={changedValue}
                          changing={false}
                          label={yaoLabels[reverseIndex]}
                        />
                      );
                    })}
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.3)] mb-1">
                      No.
                    </div>
                    <div className="font-serif text-xl text-amber-300 mb-1">
                      {String(changedHexagram.number).padStart(2, '0')}
                    </div>
                    <div className="font-serif text-sm text-[hsla(var(--div-text-hsl)/0.6)]">
                      {changedHexagram.chineseName}
                    </div>
                  </div>
                </div>

                {/* 变卦辞 */}
                <div className="mb-4">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.3)] mb-2">
                    〔卦辞〕
                  </div>
                  <p className="font-serif text-[hsla(var(--div-text-hsl)/0.7)] text-sm md:text-base leading-relaxed">
                    {changedHexagram.judgment}
                  </p>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-[hsla(var(--div-text-hsl)/0.3)] mb-2">
                    〔象辞〕
                  </div>
                  <p className="font-serif text-[hsla(var(--div-text-hsl)/0.6)] text-sm leading-relaxed">
                    {changedHexagram.image}
                  </p>
                </div>
              </div>
            )}

            {/* 底部：重新起卦 */}
            <div className="flex justify-center pb-8">
              <button
                onClick={reset}
                className="px-8 py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[hsla(var(--div-text-hsl)/0.6)] border border-[hsla(var(--div-line-hsl)/0.12)] rounded-lg hover:border-neon/50 hover:text-neon transition-all duration-500"
              >
                重新起卦
              </button>
            </div>
          </div>
        )}

        {/* 底部装饰 */}
        <div className="mt-auto pt-12">
          <div className="flex items-center gap-3 justify-center">
            <div className="h-px w-8 bg-[hsla(var(--div-line-hsl)/0.1)]" />
            <span className="font-serif text-[hsla(var(--div-text-hsl)/0.2)] text-xs italic">
              极深研几
            </span>
            <div className="h-px w-8 bg-[hsla(var(--div-line-hsl)/0.1)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
