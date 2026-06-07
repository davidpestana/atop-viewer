import { useI18n, type Locale } from '../i18n'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()

  return (
    <div className="lang-switch" role="group" aria-label="Language">
      {(['es', 'en'] as Locale[]).map((code) => (
        <button
          key={code}
          type="button"
          className={locale === code ? 'active' : ''}
          onClick={() => setLocale(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
