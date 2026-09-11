import { lazy, Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { AuthProvider } from '@/components/auth/AuthProvider'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AppShell from '@/components/layout/AppShell'
import { defaultLanguage, isSupportedLanguage } from '@/lib/i18n'
import { stripLangPrefix } from '@/lib/localizedPath'
import AllRecipesPage from '@/pages/AllRecipesPage'
import CategoriesPage from '@/pages/CategoriesPage'
import CategoryRecipesPage from '@/pages/CategoryRecipesPage'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import PlaceholderPage from '@/pages/PlaceholderPage'
import RecipeDetailPage from '@/pages/RecipeDetailPage'

// Admin routes are only reached by an authenticated admin, so keep them out
// of the bundle every public visitor downloads.
const AdminShell = lazy(() => import('@/components/layout/AdminShell'))
const AdminMealPlanPage = lazy(() => import('@/pages/AdminMealPlanPage'))
const AdminNotesPage = lazy(() => import('@/pages/AdminNotesPage'))
const AdminRecipeFormPage = lazy(() => import('@/pages/AdminRecipeFormPage'))
const AdminRecipesPage = lazy(() => import('@/pages/AdminRecipesPage'))

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
              <Route path="beleske" element={<PlaceholderPage title={t('pages.kitchenNotes')} />} />
              <Route path="profil" element={<PlaceholderPage title={t('pages.profile')} />} />
              <Route path="prijava" element={<LoginPage />} />
              <Route path="*" element={<PlaceholderPage title={t('pages.notFound')} />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route
                element={
                  <Suspense fallback={null}>
                    <AdminShell />
                  </Suspense>
                }
              >
                <Route path="admin/recepti" element={<AdminRecipesPage />} />
                <Route path="admin/recepti/novi" element={<AdminRecipeFormPage />} />
                <Route path="admin/recepti/:slug/izmeni" element={<AdminRecipeFormPage />} />
                <Route path="admin/plan-obroka" element={<AdminMealPlanPage />} />
                <Route path="admin/beleske" element={<AdminNotesPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
