import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { messages, type Lang, type MessageKey } from './messages';

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: MessageKey) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem('lang');
    if (saved === 'uk' || saved === 'en') return saved;
  } catch {
    /* storage unavailable */
  }
  return navigator.language.startsWith('uk') ? 'uk' : 'en';
}

/** Minimal i18n (uk / en) without extra dependencies. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem('lang', lang);
    } catch {
      /* storage unavailable */
    }
  }, [lang]);

  const value = useMemo<I18nValue>(
    () => ({ lang, setLang, t: (key) => messages[lang][key] }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Access the current language and the `t()` translator. */
export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
