import { useTranslation } from 'react-i18next'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import HomePage from '@/pages/HomePage'
import PlaceholderPage from '@/pages/PlaceholderPage'

function App() {
  const { t } = useTranslation()

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/recepti" element={<PlaceholderPage title={t('pages.allRecipes')} />} />
          <Route path="/kategorije" element={<PlaceholderPage title={t('pages.categories')} />} />
          <Route
            path="/kategorije/:slug"
            element={<PlaceholderPage title={t('pages.category')} />}
          />
          <Route path="/omiljeni" element={<PlaceholderPage title={t('pages.favorites')} />} />
          <Route
            path="/nedavno-dodati"
            element={<PlaceholderPage title={t('pages.recentlyAdded')} />}
          />
          <Route path="/plan-obroka" element={<PlaceholderPage title={t('pages.mealPlan')} />} />
          <Route path="/beleske" element={<PlaceholderPage title={t('pages.kitchenNotes')} />} />
          <Route path="/profil" element={<PlaceholderPage title={t('pages.profile')} />} />
          <Route
            path="/admin/recepti/novi"
            element={<PlaceholderPage title={t('pages.addRecipe')} />}
          />
          <Route path="*" element={<PlaceholderPage title={t('pages.notFound')} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
