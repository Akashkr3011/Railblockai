import React from 'react'
import {
  X,
  GitCompare,
  TrendingDown,
  TrendingUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface PlanComparisonModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PlanComparisonModal({ isOpen, onClose }: PlanComparisonModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-[#0B2545] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#134074] text-amber-300">
              <GitCompare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Plan Comparison: Baseline Manual vs. CP-SAT Optimized</h2>
              <p className="text-xs text-blue-200">
                Evaluating mathematical efficiency improvements across identical corridor demand.
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Side by side comparison grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Baseline Manual */}
            <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-slate-400 text-slate-700 font-mono text-xs">
                  BASELINE (Manual Phone & Excel)
                </Badge>
                <span className="text-xs text-slate-500">Traditional Process</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex justify-between p-2 bg-white rounded border border-slate-200">
                  <span>Planning Turnaround Time:</span>
                  <strong className="text-rose-700 font-mono">4 to 6 Hours</strong>
                </div>
                <div className="flex justify-between p-2 bg-white rounded border border-slate-200">
                  <span>Total Possession Hours Granted:</span>
                  <strong className="font-mono">13.5 Hours / day</strong>
                </div>
                <div className="flex justify-between p-2 bg-white rounded border border-slate-200">
                  <span>Train Delay Regulation:</span>
                  <strong className="text-rose-700 font-mono">148 Mins Delay</strong>
                </div>
                <div className="flex justify-between p-2 bg-white rounded border border-slate-200">
                  <span>Passenger Trains Disrupted:</span>
                  <strong className="text-rose-700 font-mono">14 Express Trains</strong>
                </div>
                <div className="flex justify-between p-2 bg-white rounded border border-slate-200">
                  <span>Shadow Block Multi-Team Clustering:</span>
                  <strong className="text-amber-700 font-mono">12% Only</strong>
                </div>
                <div className="flex justify-between p-2 bg-white rounded border border-slate-200">
                  <span>Safety Buffer Violations:</span>
                  <strong className="text-rose-700 font-mono">3 Detected Overlaps</strong>
                </div>
              </div>
            </div>

            {/* CP-SAT Optimized */}
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <Badge className="bg-emerald-600 text-white font-mono text-xs">
                  CP-SAT SOLVER OPTIMIZED
                </Badge>
                <span className="text-xs text-emerald-800 font-semibold">Mathematical Optimal</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-800">
                <div className="flex justify-between p-2 bg-white rounded border border-emerald-200">
                  <span>Computation Execution:</span>
                  <strong className="text-emerald-700 font-mono">180 Milliseconds</strong>
                </div>
                <div className="flex justify-between p-2 bg-white rounded border border-emerald-200">
                  <span>Total Possession Hours Granted:</span>
                  <strong className="text-emerald-700 font-mono">18.7 Hours (+38.5%)</strong>
                </div>
                <div className="flex justify-between p-2 bg-white rounded border border-emerald-200">
                  <span>Train Delay Regulation:</span>
                  <strong className="text-emerald-700 font-mono">32 Mins (-78.4%)</strong>
                </div>
                <div className="flex justify-between p-2 bg-white rounded border border-emerald-200">
                  <span>Passenger Trains Disrupted:</span>
                  <strong className="text-emerald-700 font-mono">2 Freight Trains Only</strong>
                </div>
                <div className="flex justify-between p-2 bg-white rounded border border-emerald-200">
                  <span>Shadow Block Multi-Team Clustering:</span>
                  <strong className="text-emerald-700 font-mono">78% Clustered</strong>
                </div>
                <div className="flex justify-between p-2 bg-white rounded border border-emerald-200">
                  <span>Safety Buffer Violations:</span>
                  <strong className="text-emerald-700 font-mono">0 (Mathematically Proven)</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Formal Recommendation: </span>
              The CP-SAT solution simultaneously increases maintenance execution capacity by <strong>+38.5%</strong> while suppressing passenger delay minutes by <strong>-78.4%</strong> by mathematically exploiting 25kV power cut shadow slots.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <Button onClick={onClose} className="bg-[#0B2545] text-white text-xs font-bold">
            Close Comparison
          </Button>
        </div>
      </div>
    </div>
  )
}
