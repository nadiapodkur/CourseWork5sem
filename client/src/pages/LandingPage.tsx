import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';

type ApiState = 'loading' | 'ok' | 'down';

/** Platform landing page (prototype: fig. 4.1). Registration flow comes in a later stage. */
export function LandingPage() {
  const { t } = useI18n();
  const [api, setApi] = useState<ApiState>('loading');

  useEffect(() => {
    const ctrl = new AbortController();
    fetch('/health/live', { signal: ctrl.signal })
      .then((r) => setApi(r.ok ? 'ok' : 'down'))
      .catch((e: unknown) => {
        if (!(e instanceof DOMException && e.name === 'AbortError')) setApi('down');
      });
    return () => ctrl.abort();
  }, []);

  return (
    <section className="hero">
      <h1>{t('landing.title')}</h1>
      <p className="muted">{t('landing.subtitle')}</p>
      <button type="button" className="primary">{t('landing.cta')}</button>
      <p className="status" role="status">
        {t('landing.apiStatus')}: <span data-state={api}>{t(`status.${api}`)}</span>
      </p>
    </section>
  );
}
