import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import type { RecipeIngredient } from '@/hooks/useRecipeBySlug'
import { pickLocalized } from '@/lib/localizedField'
import { formatQuantity, scaleQuantity } from '@/lib/servings'

interface IngredientListProps {
  ingredients: RecipeIngredient[]
  baseServings: number | null
}

function IngredientList({ ingredients, baseServings }: IngredientListProps) {
  const { t } = useTranslation()
  const lang = useCurrentLang()
  const [servings, setServings] = useState(baseServings ?? 1)
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('recipeDetail.ingredients.title')}</h2>

        {baseServings && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setServings((s) => Math.max(1, s - 1))}
              aria-label={t('recipeDetail.ingredients.decrease')}
              className="flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"
            >
              <Minus className="size-4" />
            </button>
            <span className="min-w-16 text-center text-sm font-medium">
              {t('recipeDetail.ingredients.servings', { count: servings })}
            </span>
            <button
              type="button"
              onClick={() => setServings((s) => s + 1)}
              aria-label={t('recipeDetail.ingredients.increase')}
              className="flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"
            >
              <Plus className="size-4" />
            </button>
          </div>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        {ingredients.map((ingredient) => {
          const name = pickLocalized(ingredient.name_en, ingredient.name_sr, lang)
          const unit = pickLocalized(ingredient.unit_en ?? '', ingredient.unit_sr, lang)
          const quantity =
            ingredient.quantity !== null
              ? formatQuantity(scaleQuantity(ingredient.quantity, baseServings, servings))
              : null
          const isChecked = !!checked[ingredient.id]

          return (
            <li key={ingredient.id}>
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(ingredient.id)}
                  className="size-4 rounded border-border accent-accent"
                />
                <span className={isChecked ? 'text-muted-foreground line-through' : 'text-foreground'}>
                  {quantity && `${quantity}${unit ? ` ${unit}` : ''} `}
                  {name}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default IngredientList
