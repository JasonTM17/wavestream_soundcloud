'use client';

import * as React from 'react';
import { vi } from './vi';
import { en } from './en';
import type { Dictionary, DictionaryShape } from './vi';

export type Locale = 'vi' | 'en';

const dicts: Record<Locale, DictionaryShape> = { vi, en };

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const I18nContext = React.createContext<I18nContextType>({
  locale: 'vi',
  setLocale: () => {},
});

export function I18nProvider({ children }: React.PropsWithChildren) {
  const [locale, setLocaleState] = React.useState<Locale>('vi');

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('wavestream_locale');
      if (stored === 'vi' || stored === 'en') {
        setLocaleState(stored);
        document.documentElement.lang = stored;
      }
    } catch {
      // localStorage may not be available in SSR.
    }
  }, []);

  const setLocale = React.useCallback((nextLocale: Locale) => {
    try {
      localStorage.setItem('wavestream_locale', nextLocale);
    } catch {
      // Ignore storage failures and keep the in-memory locale.
    }
    setLocaleState(nextLocale);
    document.documentElement.lang = nextLocale;
  }, []);

  return <I18nContext.Provider value={{ locale, setLocale }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return React.useContext(I18nContext);
}

export function useT<K extends keyof Dictionary>(namespace: K): DictionaryShape[K] {
  const { locale } = useI18n();
  return dicts[locale][namespace];
}

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  const label = locale === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt';

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === 'vi' ? 'en' : 'vi')}
      className={
        className ??
        'flex h-8 items-center rounded-full border border-border px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:text-foreground'
      }
      aria-label={label}
      title={label}
    >
      {locale === 'vi' ? 'EN' : 'VI'}
    </button>
  );
}
