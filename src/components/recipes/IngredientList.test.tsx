import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { RecipeIngredient } from '@/hooks/useRecipeBySlug'
import IngredientList from './IngredientList'

const ingredients: RecipeIngredient[] = [
  {
    id: '1',
    order_index: 1,
    name_en: 'Beef',
    name_sr: 'Juneće meso',
    quantity: 500,
    unit_en: 'g',
    unit_sr: 'g',
    ingredient: null,
  },
  {
    id: '2',
    order_index: 2,
    name_en: 'Oil',
    name_sr: 'Ulje',
    quantity: null,
    unit_en: null,
    unit_sr: null,
    ingredient: null,
  },
]

function renderList(baseServings: number | null) {
  return render(
    <MemoryRouter initialEntries={['/en']}>
      <Routes>
        <Route
          path=":lang"
          element={<IngredientList ingredients={ingredients} baseServings={baseServings} />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('IngredientList servings scaling', () => {
  it('shows the base quantity at the recipe base servings', () => {
    renderList(4)
    expect(screen.getByText(/500 g Beef/)).toBeInTheDocument()
  })

  it('scales quantities up when servings are increased', async () => {
    const user = userEvent.setup()
    renderList(4)
    await user.click(screen.getByLabelText('Increase servings'))
    await user.click(screen.getByLabelText('Increase servings'))
    // 4 -> 6 servings: 500 * 6/4 = 750
    expect(screen.getByText(/750 g Beef/)).toBeInTheDocument()
  })

  it('scales quantities down when servings are decreased', async () => {
    const user = userEvent.setup()
    renderList(4)
    await user.click(screen.getByLabelText('Decrease servings'))
    // 4 -> 3 servings: 500 * 3/4 = 375
    expect(screen.getByText(/375 g Beef/)).toBeInTheDocument()
  })

  it('never decreases servings below 1', async () => {
    const user = userEvent.setup()
    renderList(2)
    await user.click(screen.getByLabelText('Decrease servings'))
    await user.click(screen.getByLabelText('Decrease servings'))
    await user.click(screen.getByLabelText('Decrease servings'))
    // would go 2 -> 1 -> 1 -> 1, never 0 or negative: 500 * 1/2 = 250
    expect(screen.getByText(/250 g Beef/)).toBeInTheDocument()
  })

  it('leaves ingredients without a quantity unscaled', async () => {
    const user = userEvent.setup()
    renderList(4)
    await user.click(screen.getByLabelText('Increase servings'))
    expect(screen.getByText('Oil')).toBeInTheDocument()
  })

  it('hides the servings scaler entirely when the recipe has no base servings', () => {
    renderList(null)
    expect(screen.queryByLabelText('Increase servings')).not.toBeInTheDocument()
  })
})
