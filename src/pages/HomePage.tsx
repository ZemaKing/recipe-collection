import { useTranslation } from 'react-i18next'

function HomePage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{t('home.recentRecipes')}</h2>
      <p className="text-sm text-muted-foreground">{t('home.recentRecipesDescription')}</p>
    </div>
  )
}

export default HomePage
