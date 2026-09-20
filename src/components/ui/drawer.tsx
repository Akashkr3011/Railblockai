import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  width = 'w-96'
}: {
  isOpen: boolean
  onClose: () => void
  title: React.ReactNode
  children: React.ReactNode
  width?: string
}) {
  if (!isOpen) return null

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-sm transition-all duration-300" 
        onClick={onClose} 
      />
      <div 
        className={cn(
          "fixed right-0 top-0 z-50 h-full border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-in-out flex flex-col",
          width
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-3 bg-zinc-50/50">
          <div className="font-semibold">{title}</div>
          <button 
            onClick={onClose} 
            className="rounded p-1 hover:bg-zinc-200 transition-colors text-zinc-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          {children}
        </div>
      </div>
    </>
  )
}
