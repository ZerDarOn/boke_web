import React from 'react';
import PageSkills from '../components/PageSkills';
import { TRANSLATIONS } from '../constants';

const Skills: React.FC = () => {
  const lang: 'EN' | 'ZH' = 'ZH';
  const t = TRANSLATIONS[lang];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <h2 className="text-3xl font-sans font-black text-ink dark:text-paper flex items-center gap-4">
        / {t.SKILL_MATRIX}
        <div className="h-[2px] flex-1 bg-ink/10 dark:bg-paper/20"></div>
      </h2>
      <PageSkills />
    </div>
  );
};

export default Skills;
