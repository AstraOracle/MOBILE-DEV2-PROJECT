import React from 'react';
import { useI18n } from '../i18n/I18nProvider';

/**
 * LanguageSelector Component
 * 
 * Allows users to switch between supported languages (English, Spanish, French, Dutch).
 * Persists selection to localStorage. Integrates with the I18nProvider context.
 * 
 * @component
 * @example
 * <LanguageSelector />
 * 
 * @returns {React.ReactElement} A language selector dropdown with flags
 */
export default function LanguageSelector(){
  const { lang, setLang } = useI18n();

  const languageOptions = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' }
  ];

  return (
    <div className="d-flex align-items-center gap-2">
      <label htmlFor="lang-select" className="visually-hidden">Language</label>
      <select 
        id="lang-select"
        className="form-select form-select-sm"
        style={{width: 'auto'}}
        value={lang} 
        onChange={(e)=>setLang(e.target.value)} 
        aria-label="Language"
      >
        {languageOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {option.flag} {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}
