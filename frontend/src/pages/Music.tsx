import React from 'react';
import { Music4, Disc3, Headphones } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import MusicPlayer from '../components/MusicPlayer';

const Music: React.FC = () => {
  const { lang } = useLang();

  return (
    <div className="animate-in fade-in duration-500">
      {/* 标题区 */}
      <div className="mb-8 relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon/20 to-secondary/10 flex items-center justify-center">
            <Disc3 size={20} className="text-neon animate-[spin_6s_linear_infinite]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-ink dark:text-white tracking-tight flex items-center gap-2">
              {lang === 'EN' ? 'MUSIC HALL' : '音乐馆'}
              <span className="text-neon font-mono text-xs animate-pulse">♪</span>
            </h1>
            <p className="font-mono text-[11px] text-gray-400 dark:text-gray-500 tracking-widest mt-0.5">
              NETEASE.CLOUD // PLAYLIST.STREAM
            </p>
          </div>
        </div>
        <div className="h-[2px] w-full bg-gradient-to-r from-neon/50 via-secondary/30 to-transparent"></div>
      </div>

      {/* 简介 */}
      <p className="font-serif text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed flex items-start gap-2">
        <Headphones size={16} className="text-neon mt-0.5 flex-shrink-0" />
        {lang === 'EN'
          ? 'A curated stream from my NetEase Cloud playlist. Press play and let the ink flow.'
          : '这里流淌着我收藏的网易云歌单。点击播放，让墨色随音律晕开。'}
      </p>

      {/* 主播放器（展开歌单） */}
      <div className="relative overflow-hidden bg-white/60 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl p-4 md:p-6 shadow-sm">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-neon via-secondary to-transparent"></div>
        <MusicPlayer />
      </div>

      {/* 提示 */}
      <p className="mt-6 text-[11px] text-gray-400 dark:text-gray-600 font-mono flex items-center gap-2">
        <Music4 size={12} className="text-secondary" />
        {lang === 'EN'
          ? 'Some copyrighted tracks may be unavailable due to streaming restrictions.'
          : '受版权限制，部分歌曲可能无法播放，可在右侧栏继续随处收听。'}
      </p>
    </div>
  );
};

export default Music;
