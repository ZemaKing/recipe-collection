import { useTranslation } from 'react-i18next'

interface PlaceholderPageProps {
  title: string
  description?: string
}

function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-card border border-dashed border-border p-10 text-center">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {description ?? t('placeholder.notImplemented')}
      </p>
    </div>
  )
}

export default PlaceholderPage
