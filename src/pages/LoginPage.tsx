import { useState, type FormEvent } from 'react'
import { ChefHat } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { buildLocalizedPath } from '@/lib/localizedPath'

function LoginPage() {
  const { t } = useTranslation()
  const { session, signIn } = useAuth()
  const lang = useCurrentLang()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectParam = searchParams.get('redirect')
  const redirectTo =
    redirectParam && redirectParam.startsWith('/')
      ? redirectParam
      : buildLocalizedPath(lang, '/admin/recepti/novi')

  if (session) return <Navigate to={redirectTo} replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    const { error } = await signIn(email, password)
    setIsSubmitting(false)

    if (error) {
      setError(t('login.error'))
    } else {
      navigate(redirectTo, { replace: true })
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-card border border-border bg-surface p-6">
        <div className="mb-6 flex flex-col items-center gap-2">
          <ChefHat className="size-8 text-accent" />
          <h1 className="text-lg font-semibold">{t('login.title')}</h1>
          <p className="text-center text-sm text-muted-foreground">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              {t('login.email')}
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-control border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              {t('login.password')}
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-control border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {error && <p className="text-sm text-favorite">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded-control bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? t('login.submitting') : t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
