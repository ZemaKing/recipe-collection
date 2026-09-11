import { useTranslation } from 'react-i18next'
import { useCurrentLang } from '@/hooks/useCurrentLang'
import type { RecipeStep } from '@/hooks/useRecipeBySlug'
import { pickLocalized } from '@/lib/localizedField'

interface StepListProps {
  steps: RecipeStep[]
}

function StepList({ steps }: StepListProps) {
  const { t } = useTranslation()
  const lang = useCurrentLang()

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <h2 className="text-lg font-semibold">{t('recipeDetail.steps.title')}</h2>
      <ol className="flex flex-col gap-4">
        {steps.map((step) => (
          <li key={step.id} className="flex gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              {step.step_number}
            </span>
            <p className="text-sm text-foreground">{pickLocalized(step.text_en, step.text_sr, lang)}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default StepList
