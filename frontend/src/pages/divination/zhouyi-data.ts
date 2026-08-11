// 周易 64 卦深度解读数据（合并自 gua-source + jiegua-source 开源数据）
import zhouyiRaw from './zhouyi.json';

export interface ZhouyiYao {
  position: number;
  name: string;       // 爻名：初九 / 六二...
  text: string;       // 爻辞原文
  textTrans: string;  // 爻辞白话
  xiang: string;      // 小象辞原文
  xiangTrans: string; // 小象辞白话
  ci: string;         // 爻辞白话解读（古人占断）
  jixiong: string;    // 吉凶
}

export interface ZhouyiHexagram {
  name: string;          // 单字卦名：乾
  fullName: string;      // 全称：乾为天
  binary: string;        // 6 位二进制
  judgment: string;      // 卦辞原文
  judgmentTrans: string; // 卦辞白话
  tuan: string;          // 彖辞原文
  tuanTrans: string;
  image: string;         // 大象辞原文
  imageTrans: string;
  guaYi: string;         // 卦义白话（古人占断）
  jixiong: string;       // 卦吉凶
  coreImage: string;     // 核心意象（现代）
  reading: {
    shiyi: string;    // 事业
    aiqing: string;   // 爱情
    caiyun: string;   // 财运
    kaoshi: string;   // 学业
    jiankang: string; // 健康
    chuxing: string;  // 出行
    guansi: string;   // 官司
    jiazhai: string;  // 家宅
  };
  yi: string[];  // 宜
  ji: string[];  // 忌
  yaos: ZhouyiYao[];
}

const zhouyi = zhouyiRaw as unknown as Record<string, ZhouyiHexagram>;

/** 按卦序号(1-64)取深度解读 */
export function getZhouyiByNumber(number: number): ZhouyiHexagram | null {
  return zhouyi[String(number)] ?? null;
}

/** 按 6 位二进制符号查找（下卦三爻在前），找不到返回 null */
export function findZhouyiByBinary(symbol: number[]): ZhouyiHexagram | null {
  const bin = symbol.join('');
  for (const key of Object.keys(zhouyi)) {
    if (zhouyi[key].binary === bin) return zhouyi[key];
  }
  return null;
}

export default zhouyi;
