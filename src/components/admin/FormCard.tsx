import type { LucideIcon } from 'lucide-react'

export function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-favorite">
      {' '}
      *
    </span>
  )
}

interface FormCardProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}

function FormCard({ icon: Icon, title, description, action, children }: FormCardProps) {
  return (
    <section className="overflow-hidden rounded-card border border-border bg-surface">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Icon className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="flex flex-col gap-3 p-4">{children}</div>
    </section>
  )
}

export default FormCard
