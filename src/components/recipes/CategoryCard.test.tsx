import { render, screen } from '@testing-library/react'
import { UtensilsCrossed } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import i18n from '@/lib/i18n'
import CategoryCard from './CategoryCard'

async function renderCard(recipeCount: number, lang: string) {
  await i18n.changeLanguage(lang)
  return render(
    <MemoryRouter initialEntries={[`/${lang}`]}>
      <Routes>
        <Route
          path=":lang"
          element={
            <CategoryCard
              slug="glavna-jela"
              name_en="Main Dishes"
              name_sr="Glavna jela"
              recipeCount={recipeCount}
              icon={UtensilsCrossed}
            />
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CategoryCard', () => {
  it('uses the Serbian singular form for 1', async () => {
    await renderCard(1, 'sr')
    expect(screen.getByText('1 recept')).toBeInTheDocument()
  })

  it('uses the Serbian few-form for 2-4', async () => {
    await renderCard(3, 'sr')
    expect(screen.getByText('3 recepta')).toBeInTheDocument()
  })

  it('uses the Serbian other-form for 5+', async () => {
    await renderCard(12, 'sr')
    expect(screen.getByText('12 recepata')).toBeInTheDocument()
  })

  it('uses correct English singular form', async () => {
    await renderCard(1, 'en')
    expect(screen.getByText('1 recipe')).toBeInTheDocument()
  })

  it('uses English plural for counts other than 1', async () => {
    await renderCard(12, 'en')
    expect(screen.getByText('12 recipes')).toBeInTheDocument()
  })

  it('renders zero recipes correctly', async () => {
    await renderCard(0, 'sr')
    expect(screen.getByText('0 recepata')).toBeInTheDocument()
  })
})
