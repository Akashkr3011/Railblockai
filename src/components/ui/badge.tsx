import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        // RAILBLOCK AI status variants
        approved:
          'border-green-200 bg-green-100 text-green-800',
        pending:
          'border-amber-200 bg-amber-100 text-amber-800',
        rejected:
          'border-red-200 bg-red-100 text-red-800',
        active:
          'border-blue-200 bg-blue-100 text-blue-800',
        completed:
          'border-gray-200 bg-gray-100 text-gray-600',
        conflict:
          'border-purple-200 bg-purple-100 text-purple-800',
        disabled:
          'border-gray-200 bg-gray-50 text-gray-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
