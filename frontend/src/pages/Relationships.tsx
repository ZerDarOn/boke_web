import React from 'react';
import UniverseMap from '../components/UniverseMap';

const Relationships: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-sans font-black text-ink dark:text-paper flex items-center gap-4">
          / UNIVERSE.MAP
          <div className="h-[2px] flex-1 bg-ink/10 dark:bg-paper/20"></div>
        </h2>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span>自己</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
          <span>技能</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-purple-500"></span>
          <span>人脉</span>
        </div>
      </div>

      <UniverseMap />
    </div>
  );
};

export default Relationships;
