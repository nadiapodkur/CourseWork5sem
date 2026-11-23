/** UI strings. Ukrainian is the default; English must have the same keys. */
export const uk = {
  'app.name': 'Конструктор форумів',
  'landing.title': 'Створіть власний форум за 10 хвилин',
  'landing.subtitle': 'Без програмування: оберіть дизайн, налаштуйте розділи та ролі — і запрошуйте учасників.',
  'landing.cta': 'Створити форум',
  'landing.apiStatus': 'Стан API',
  'status.ok': 'працює',
  'status.down': 'недоступний',
  'status.loading': 'перевірка…',
  'notFound.title': 'Сторінку не знайдено',
  'notFound.back': 'На головну',
  'a11y.switchLang': 'Змінити мову',
  'a11y.switchTheme': 'Змінити тему',
} as const;

export type MessageKey = keyof typeof uk;

export const en: Record<MessageKey, string> = {
  'app.name': 'Forum Builder',
  'landing.title': 'Launch your own forum in 10 minutes',
  'landing.subtitle': 'No code: pick a design, set up sections and roles, and invite members.',
  'landing.cta': 'Create a forum',
  'landing.apiStatus': 'API status',
  'status.ok': 'up',
  'status.down': 'down',
  'status.loading': 'checking…',
  'notFound.title': 'Page not found',
  'notFound.back': 'Back to home',
  'a11y.switchLang': 'Switch language',
  'a11y.switchTheme': 'Switch theme',
};

export const messages = { uk, en } as const;
export type Lang = keyof typeof messages;
