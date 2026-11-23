import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <section className="hero">
      <h1>{t('notFound.title')}</h1>
      <Link to="/">{t('notFound.back')}</Link>
    </section>
  );
}
