import { type ComponentProps } from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn('flex items-center gap-6 border-b border-border', className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        '-mb-px border-b-2 border-transparent pb-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-accent data-[state=active]:text-accent',
        className,
      )}
      {...props}
    />
  )
}

// data-[state=inactive]:hidden matters when a consumer passes forceMount —
// that keeps content mounted (so it doesn't lose internal state when the
// user switches away) and just needs CSS to hide it instead of unmounting.
function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('mt-3 data-[state=inactive]:hidden', className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
