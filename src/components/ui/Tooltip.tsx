import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

export interface TooltipProps {
  content: string | React.ReactNode
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 150,
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)

  if (!content) {
    return <>{children}</>
  }

  const handleMouseEnter = () => {
    const t = setTimeout(() => {
      setIsVisible(true)
    }, delay)
    setTimer(t)
  }

  const handleMouseLeave = () => {
    if (timer) clearTimeout(timer)
    setIsVisible(false)
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-50 pointer-events-none whitespace-nowrap rounded bg-[#0B2545]/95 text-slate-100 px-2.5 py-1 text-[11px] font-medium shadow-xl border border-amber-400/40 backdrop-blur-md font-sans ${positionClasses[position]} ${className}`}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
