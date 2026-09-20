import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Tooltip } from './Tooltip'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer shadow-sm hover:shadow-md [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-[#0B2545] text-white hover:bg-[#134074] hover:text-amber-200 border border-[#134074]',
        destructive:
          'bg-[#A6192E] text-white hover:bg-[#8B1425] hover:shadow-red-900/30 border border-red-800',
        outline:
          'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-[#0B2545] hover:border-[#134074]',
        secondary:
          'bg-slate-100 text-slate-800 hover:bg-slate-200 hover:text-[#0B2545]',
        ghost:
          'hover:bg-slate-100/80 hover:text-[#0B2545] text-slate-700 shadow-none hover:shadow-none',
        link:
          'text-[#134074] underline-offset-4 hover:underline hover:text-[#0B2545] shadow-none hover:shadow-none',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-8 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  tooltip?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, tooltip, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    const btn = (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )

    if (tooltip) {
      return <Tooltip content={tooltip}>{btn}</Tooltip>
    }

    return btn
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
