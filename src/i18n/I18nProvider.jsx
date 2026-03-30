import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { translations as baseTranslations } from './i18n';

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('lang') || navigator.language.split('-')[0] || 'en'; } catch { return 'en'; }
  });

  useEffect(() => {
    try { localStorage.setItem('lang', lang); } catch {}
  }, [lang]);

  const t = useCallback((key) => baseTranslations[lang]?.[key] || baseTranslations['en']?.[key] || key, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(){
  return useContext(I18nContext);
}
