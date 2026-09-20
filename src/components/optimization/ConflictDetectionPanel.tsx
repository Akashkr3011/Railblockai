import React from 'react'
import { AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, Clock, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface ConflictItem {
  id: string
  title: string
  corridor: string
  trains_affected: string[]
  nature: 'HEADWAY_VIOLATION' | 'LINE_OVERLAP' | 'POWER_ISOLATION' | 'RESOURCE_CONTENTION'
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  status: 'RESOLVED_BY_CPSAT' | 'PENDING_SANCTION' | 'DETECTED'
  resolution_description: string
  delay_saved_minutes: number
}

interface ConflictDetectionPanelProps {
  conflicts?: ConflictItem[]
}

const DEFAULT_CONFLICTS: ConflictItem[] = [
  {
    id: 'cnf-101',
    title: 'Headway Buffer Collision: 12124 Deccan Queen & Track Tamping Block',
    corridor: 'Kalyan — Kasara (North-East Main Line)',
    trains_affected: ['12124 Deccan Queen Express', '12128 Pune Intercity'],
    nature: 'HEADWAY_VIOLATION',
    severity: 'CRITICAL',
    status: 'RESOLVED_BY_CPSAT',
    resolution_description: 'CP-SAT shifted tamping window start by +35 mins into night shadow slot; zero train regulation incurred.',
    delay_saved_minutes: 45,
  },
  {
    id: 'cnf-102',
    title: 'Simultaneous Possession Contention: TRD OHE Tower Car vs Civil Rail Renewal',
    corridor: 'Thane — Diva Fast Corridors',
    trains_affected: ['22221 Rajdhani Express', 'BOXN Container Freight #883'],
    nature: 'LINE_OVERLAP',
    severity: 'HIGH',
    status: 'RESOLVED_BY_CPSAT',
    resolution_description: 'Clustered both TRD and P-Way into single synchronized 210-min shadow possession under single 25kV power cut.',
    delay_saved_minutes: 60,
  },
  {
    id: 'cnf-103',
    title: 'Tamping Machine Resource Deficit (CSM-09 Required on 2 Adjacent Sections)',
    corridor: 'Lonavala — Pune Suburban Quad Line',
    trains_affected: ['Suburban Locals 99812, 99814'],
    nature: 'RESOURCE_CONTENTION',
    severity: 'MEDIUM',
    status: 'RESOLVED_BY_CPSAT',
    resolution_description: 'Rerouted CSM-09 machine transit via intermediate siding, sequencing section 1 on Day 1 and section 2 on Day 2.',
    delay_saved_minutes: 25,
  },
]

export function ConflictDetectionPanel({ conflicts = DEFAULT_CONFLICTS }: ConflictDetectionPanelProps) {
  const resolvedCount = conflicts.filter((c) => c.status === 'RESOLVED_BY_CPSAT').length
  const totalDelaySaved = conflicts.reduce((acc, c) => acc + c.delay_saved_minutes, 0)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-100 text-amber-800">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Autonomous Conflict Resolution Panel
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                {resolvedCount} / {conflicts.length} Resolved
              </Badge>
            </h3>
            <p className="text-[11px] text-slate-500">
              Corridor overlaps, headway violations, and power isolation contention detected and resolved by CP-SAT.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded font-semibold flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-emerald-600" />
            <span>Saved {totalDelaySaved} Mins Passenger Delay</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {conflicts.map((conflict) => (
          <div
            key={conflict.id}
            className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 transition-all space-y-2"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      conflict.severity === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800 border-rose-300 text-[9px] font-bold'
                        : conflict.severity === 'HIGH'
                        ? 'bg-amber-100 text-amber-800 border-amber-300 text-[9px] font-bold'
                        : 'bg-blue-100 text-blue-800 border-blue-300 text-[9px] font-bold'
                    }
                  >
                    {conflict.nature.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-[10px] font-mono text-slate-500">{conflict.id}</span>
                  <span className="text-[10px] font-semibold text-slate-600">{conflict.corridor}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-1">{conflict.title}</h4>
              </div>

              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                CP-SAT SOLVED
              </Badge>
            </div>

            <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded border border-slate-200 flex items-start gap-2">
              <ArrowRight className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800">Solver Resolution: </span>
                <span>{conflict.resolution_description}</span>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                  <span>
                    Trains Protected: <strong className="text-slate-700">{conflict.trains_affected.join(', ')}</strong>
                  </span>
                  <span>
                    Delay Averted: <strong className="text-emerald-700">{conflict.delay_saved_minutes} min</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
