import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import RecipeImage from './RecipeImage'
import type { RecipeImageRef } from '@/types/recipe'

const migrated: RecipeImageRef = {
  storage_path: 'r1/a.webp',
  thumb_path: 'r1/a.thumb.webp',
  width: 1536,
  height: 1024,
  alt_en: null,
  alt_sr: null,
}

describe('RecipeImage', () => {
  it('shows the thumbnail by default, lazily, with the stored dimensions', () => {
    render(<RecipeImage image={migrated} alt="Soup" />)
    const img = screen.getByAltText('Soup')
    expect(img.getAttribute('src')).toMatch(/r1\/a\.thumb\.webp$/)
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('width', '1536')
    expect(img).toHaveAttribute('height', '1024')
    expect(img).not.toHaveAttribute('fetchpriority')
  })

  it('shows the full image for the hero, eagerly and with high priority', () => {
    render(
      <RecipeImage
        image={migrated}
        alt="Soup"
        variant="full"
        loading="eager"
        fetchPriority="high"
      />,
    )
    const img = screen.getByAltText('Soup')
    expect(img.getAttribute('src')).toMatch(/r1\/a\.webp$/)
    expect(img).toHaveAttribute('loading', 'eager')
    expect(img).toHaveAttribute('fetchpriority', 'high')
  })

  it('falls back to storage_path and omits unknown dimensions', () => {
    render(
      <RecipeImage
        image={{
          ...migrated,
          storage_path: 'r1/a.png',
          thumb_path: null,
          width: null,
          height: null,
        }}
        alt="Soup"
      />,
    )
    const img = screen.getByAltText('Soup')
    expect(img.getAttribute('src')).toMatch(/r1\/a\.png$/)
    expect(img).not.toHaveAttribute('width')
  })
})
