import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import { supportedLanguages, type SupportedLanguage } from '@/lib/i18n'
import { buildLocalizedPath, stripLangPrefix } from '@/lib/localizedPath'
import { cn } from '@/lib/utils'

function LanguageSwitcher() {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const navigate = useNavigate()
  const location = useLocation()

  function switchTo(next: SupportedLanguage) {
    if (next === lang) return
    navigate(`${buildLocalizedPath(next, stripLangPrefix(location.pathname) || '/')}${location.search}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
          title={t('topbar.language')}
        >
          <Languages className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedLanguages.map((code) => (
          <DropdownMenuItem
            key={code}
            onSelect={() => switchTo(code)}
            className={cn(code === lang && 'text-accent')}
          >
            {t(`language.${code}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default LanguageSwitcher
