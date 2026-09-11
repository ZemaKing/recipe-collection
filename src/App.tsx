import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { AuthProvider } from '@/components/auth/AuthProvider'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AppShell from '@/components/layout/AppShell'
import { defaultLanguage, isSupportedLanguage } from '@/lib/i18n'
import { stripLangPrefix } from '@/lib/localizedPath'
import AdminPlaceholderPage from '@/pages/AdminPlaceholderPage'
import AllRecipesPage from '@/pages/AllRecipesPage'
import CategoriesPage from '@/pages/CategoriesPage'
import CategoryRecipesPage from '@/pages/CategoryRecipesPage'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import PlaceholderPage from '@/pages/PlaceholderPage'
import RecipeDetailPage from '@/pages/RecipeDetailPage'

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
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path=":lang" element={<LocaleGate />}>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="recepti" element={<AllRecipesPage />} />
              <Route path="recepti/:slug" element={<RecipeDetailPage />} />
              <Route path="kategorije" element={<CategoriesPage />} />
              <Route path="kategorije/:slug" element={<CategoryRecipesPage />} />
              <Route path="omiljeni" element={<PlaceholderPage title={t('pages.favorites')} />} />
              <Route
                path="nedavno-dodati"
                element={<PlaceholderPage title={t('pages.recentlyAdded')} />}
              />
              <Route path="plan-obroka" element={<PlaceholderPage title={t('pages.mealPlan')} />} />
              <Route path="beleske" element={<PlaceholderPage title={t('pages.kitchenNotes')} />} />
              <Route path="profil" element={<PlaceholderPage title={t('pages.profile')} />} />
              <Route path="prijava" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route
                  path="admin/recepti/novi"
                  element={<AdminPlaceholderPage title={t('pages.addRecipe')} />}
                />
              </Route>
              <Route path="*" element={<PlaceholderPage title={t('pages.notFound')} />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
