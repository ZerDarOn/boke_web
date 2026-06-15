import React from 'react';
import { Heart, ChevronDown } from 'lucide-react';

export type GameStatusFilter = 'ALL' | 'WANT_TO_PLAY' | 'PLAYING' | 'COMPLETED' | 'DROPPED' | 'REPLAYING' | 'FAVORITE';

interface GameFilterProps {
  activeFilter: GameStatusFilter;
  onFilterChange: (filter: GameStatusFilter) => void;
  activePlatform: string | null;
  onPlatformChange: (platform: string | null) => void;
  platforms: string[];
}

const statusOptions: { key: GameStatusFilter; label: string }[] = [
  { key: 'ALL', label: '全部' },
  { key: 'WANT_TO_PLAY', label: '想玩' },
  { key: 'PLAYING', label: '进行中' },
  { key: 'COMPLETED', label: '已完成' },
  { key: 'DROPPED', label: '已放弃' },
  { key: 'REPLAYING', label: '重玩中' },
];

const GameFilter: React.FC<GameFilterProps> = ({
  activeFilter,
  onFilterChange,
  activePlatform,
  onPlatformChange,
  platforms,
}) => {
  const [isPlatformOpen, setIsPlatformOpen] = React.useState(false);
  const platformRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (platformRef.current && !platformRef.current.contains(event.target as Node)) {
        setIsPlatformOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status Buttons */}
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onFilterChange(opt.key)}
            className={`
              px-4 py-1.5 text-xs font-bold font-mono transition-all duration-300 uppercase
              ${activeFilter === opt.key
                ? 'bg-neon text-white shadow-[4px_4px_0px_#10b981] translate-y-[-2px]'
                : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#222]'}
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Favorite Toggle */}
      <button
        onClick={() => onFilterChange(activeFilter === 'FAVORITE' ? 'ALL' : 'FAVORITE')}
        className={`
          px-4 py-1.5 text-xs font-bold font-mono transition-all duration-300 uppercase flex items-center gap-2
          ${activeFilter === 'FAVORITE'
            ? 'bg-pink-500 text-white shadow-[4px_4px_0px_#ec4899] translate-y-[-2px]'
            : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#222]'}
        `}
      >
        <Heart size={12} className={activeFilter === 'FAVORITE' ? 'fill-white' : ''} />
        收藏
      </button>

      {/* Platform Dropdown */}
      {platforms.length > 0 && (
        <div className="relative" ref={platformRef}>
          <button
            onClick={() => setIsPlatformOpen(!isPlatformOpen)}
            className={`
              px-4 py-1.5 text-xs font-bold font-mono transition-all duration-300 uppercase flex items-center gap-2
              ${activePlatform
                ? 'bg-neon/20 text-neon border border-neon/30'
                : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#222] border border-transparent'}
            `}
          >
            {activePlatform || '平台'}
            <ChevronDown size={12} className={`transition-transform ${isPlatformOpen ? 'rotate-180' : ''}`} />
          </button>

          {isPlatformOpen && (
            <div className="absolute top-full left-0 mt-2 w-40 bg-[#1a1b26]/95 backdrop-blur-md border border-white/10 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-200">
              <button
                onClick={() => {
                  onPlatformChange(null);
                  setIsPlatformOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-colors border-l-2 border-transparent hover:border-neon ${!activePlatform ? 'text-white bg-white/5 border-neon' : ''}`}
              >
                全部平台
              </button>
              {platforms.map((platform) => (
                <button
                  key={platform}
                  onClick={() => {
                    onPlatformChange(platform);
                    setIsPlatformOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-colors border-l-2 border-transparent hover:border-neon ${activePlatform === platform ? 'text-white bg-white/5 border-neon' : ''}`}
                >
                  {platform}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameFilter;
