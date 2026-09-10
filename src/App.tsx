import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { defaultLanguage, isSupportedLanguage } from '@/lib/i18n'
import { stripLangPrefix } from '@/lib/localizedPath'
import HomePage from '@/pages/HomePage'
import PlaceholderPage from '@/pages/PlaceholderPage'

function RootRedirect() {
  const { i18n } = useTranslation()
  const lang = isSupportedLanguage(i18n.language) ? i18n.language : defaultLanguage
  return <Navigate to={`/${lang}`} replace />
}

function LocaleGate() {
  const { lang } = useParams<{ lang: string }>()
  const location = useLocation()
  const { i18n } = useTranslation()
  const valid = isSupportedLanguage(lang)

  useEffect(() => {
    if (valid && lang && i18n.language !== lang) {
      void i18n.changeLanguage(lang)
    }
  }, [valid, lang, i18n])

  useEffect(() => {
    if (valid && lang) {
      document.documentElement.lang = lang
    }
  }, [valid, lang])

  if (!valid) {
    const resolved = isSupportedLanguage(i18n.language) ? i18n.language : defaultLanguage
    return (
      <Navigate to={`/${resolved}${stripLangPrefix(location.pathname)}${location.search}`} replace />
    )
  }

  return <Outlet />
}

function App() {
  const { t } = useTranslation()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path=":lang" element={<LocaleGate />}>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="recepti" element={<PlaceholderPage title={t('pages.allRecipes')} />} />
            <Route path="kategorije" element={<PlaceholderPage title={t('pages.categories')} />} />
            <Route
              path="kategorije/:slug"
              element={<PlaceholderPage title={t('pages.category')} />}
            />
            <Route path="omiljeni" element={<PlaceholderPage title={t('pages.favorites')} />} />
            <Route
              path="nedavno-dodati"
              element={<PlaceholderPage title={t('pages.recentlyAdded')} />}
            />
            <Route path="plan-obroka" element={<PlaceholderPage title={t('pages.mealPlan')} />} />
            <Route path="beleske" element={<PlaceholderPage title={t('pages.kitchenNotes')} />} />
            <Route path="profil" element={<PlaceholderPage title={t('pages.profile')} />} />
            <Route
              path="admin/recepti/novi"
              element={<PlaceholderPage title={t('pages.addRecipe')} />}
            />
            <Route path="*" element={<PlaceholderPage title={t('pages.notFound')} />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
