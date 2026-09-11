import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import i18n from '@/lib/i18n'
import RecipeCard from './RecipeCard'
import type { RecipeSummary } from '@/types/recipe'

const baseRecipe: RecipeSummary = {
  id: '1',
  slug: 'gulas',
  name_en: 'Beef Goulash',
  name_sr: 'Gulaš',
  prep_time_minutes: 20,
  cook_time_minutes: 90,
  rating: 4.5,
  is_favorite: false,
  category: { slug: 'glavna-jela', name_en: 'Main Dishes', name_sr: 'Glavna jela' },
}

function renderWithLang(recipe: RecipeSummary, lang: string) {
  return render(
    <MemoryRouter initialEntries={[`/${lang}`]}>
      <Routes>
        <Route path=":lang" element={<RecipeCard recipe={recipe} />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RecipeCard', () => {
  beforeEach(() => {
    void i18n.changeLanguage('sr')
  })

  it('renders the Serbian name when lang=sr and a translation is present', () => {
    renderWithLang(baseRecipe, 'sr')
    expect(screen.getByText('Gulaš')).toBeInTheDocument()
    expect(screen.getByText('Glavna jela')).toBeInTheDocument()
  })

  it('renders the English name when lang=en', () => {
    renderWithLang(baseRecipe, 'en')
    expect(screen.getByText('Beef Goulash')).toBeInTheDocument()
    expect(screen.getByText('Main Dishes')).toBeInTheDocument()
  })

  it('falls back to English when the Serbian translation is missing', () => {
    const recipe: RecipeSummary = { ...baseRecipe, name_sr: null }
    renderWithLang(recipe, 'sr')
    expect(screen.getByText('Beef Goulash')).toBeInTheDocument()
  })

  it('formats combined prep + cook time', () => {
    renderWithLang(baseRecipe, 'en')
    expect(screen.getByText('1h 50m')).toBeInTheDocument()
  })
})
