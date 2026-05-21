import React, { createContext, useContext, ReactNode } from 'react';
import { TRANSLATIONS } from '../constants';

type Lang = 'EN' | 'ZH';

interface LangContextType {
  lang: Lang;
  setLang: React.Dispatch<React.SetStateAction<Lang>>;
  t: typeof TRANSLATIONS[Lang];
}

const LangContext = createContext<LangContextType | undefined>(undefined);

export const LangProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLang] = React.useState<Lang>('ZH');

  const t = TRANSLATIONS[lang];

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => {
  const context = useContext(LangContext);
  if (context === undefined) {
    throw new Error('useLang must be used within a LangProvider');
  }
  return context;
};
