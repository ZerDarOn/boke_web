import React from 'react';
import UniverseMap from '../components/UniverseMap';

const Network: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <h2 className="text-3xl font-sans font-black text-ink dark:text-paper flex items-center gap-4">
        / SOCIAL.NETWORK_MAP
        <div className="h-[2px] flex-1 bg-ink/10 dark:bg-paper/20"></div>
      </h2>
      <UniverseMap />
    </div>
  );
};

export default Network;
