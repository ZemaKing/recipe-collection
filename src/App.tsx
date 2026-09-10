import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import HomePage from '@/pages/HomePage'
import PlaceholderPage from '@/pages/PlaceholderPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/recepti" element={<PlaceholderPage title="Svi recepti" />} />
          <Route path="/kategorije" element={<PlaceholderPage title="Kategorije" />} />
          <Route path="/kategorije/:slug" element={<PlaceholderPage title="Kategorija" />} />
          <Route path="/omiljeni" element={<PlaceholderPage title="Omiljeni recepti" />} />
          <Route path="/nedavno-dodati" element={<PlaceholderPage title="Nedavno dodati" />} />
          <Route path="/plan-obroka" element={<PlaceholderPage title="Plan obroka" />} />
          <Route path="/beleske" element={<PlaceholderPage title="Kuhinjske beleške" />} />
          <Route path="/profil" element={<PlaceholderPage title="Profil" />} />
          <Route path="/admin/recepti/novi" element={<PlaceholderPage title="Dodaj recept" />} />
          <Route path="*" element={<PlaceholderPage title="Stranica nije pronađena" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
