import { Link, Route, Routes } from 'react-router-dom';
import { useI18n } from './i18n/I18nProvider';
import { useTheme } from './useTheme';
import { LandingPage } from './pages/LandingPage';
import { NotFoundPage } from './pages/NotFoundPage';

/** Root layout: header with language and theme switches, then routed pages (SPA, no full reloads). */
export function App() {
  const { t, lang, setLang } = useI18n();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <header className="header">
        <Link to="/" className="brand">{t('app.name')}</Link>
        <nav className="header-actions">
          <button type="button" onClick={() => setLang(lang === 'uk' ? 'en' : 'uk')} aria-label={t('a11y.switchLang')}>
            {lang === 'uk' ? 'EN' : 'UA'}
          </button>
          <button type="button" onClick={toggleTheme} aria-label={t('a11y.switchTheme')}>
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </nav>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  );
}
