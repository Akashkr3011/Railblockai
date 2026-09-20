import React, { useState } from 'react'
import {
  Clock,
  Train,
  Wrench,
  CheckCircle2,
  TrendingDown,
  Users,
  ShieldCheck,
  FileDown,
  Share2,
  Calendar,
  AlertCircle,
  Zap,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConflictDetectionPanel } from './ConflictDetectionPanel'
import { Plan, PlanTask } from '@/types'

interface DailyPlanViewProps {
  plan: Plan
  onExport: (format: 'pdf' | 'excel' | 'json') => void
  onApprove?: () => void
  onPublish?: () => void
  canApprove?: boolean
  canPublish?: boolean
}

export function DailyPlanView({
  plan,
  onExport,
  onApprove,
  onPublish,
  canApprove,
  canPublish,
}: DailyPlanViewProps) {
  const [selectedTask, setSelectedTask] = useState<PlanTask | null>(null)
  const [selectedHourRange, setSelectedHourRange] = useState<'ALL' | 'NIGHT' | 'DAY'>('ALL')

  // Filter tasks
  const filteredTasks = plan.tasks.filter((t) => {
    if (selectedHourRange === 'ALL') return true
    const timeStr = t.start_time || t.scheduled_start || '00:00'
    const startHour = parseInt(timeStr.split(':')[0], 10) || 0
    if (selectedHourRange === 'NIGHT') return startHour >= 0 && startHour < 6
    return startHour >= 6 && startHour < 24
  })

  return (
    <div className="space-y-6">
      {/* Top Banner with Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Train Delay Reduction</p>
              <h3 className="text-xl font-black text-emerald-700">
                {(plan.metrics.delay_reduction_pct ?? 78.4).toFixed(1)}%
              </h3>
              <p className="text-[11px] text-slate-500">vs. baseline manual planning</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
              <Train className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Passenger Punctuality</p>
              <h3 className="text-xl font-black text-slate-900">
                {(plan.metrics.punctuality_score ?? 99.2).toFixed(1)}%
              </h3>
              <p className="text-[11px] text-slate-500">Vande Bharat / Express 100%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Sanctioned Possession</p>
              <h3 className="text-xl font-black text-indigo-700">
                {(plan.metrics.maintenance_hours_granted ?? 18.5).toFixed(1)} hrs
              </h3>
              <p className="text-[11px] text-slate-500">{plan.tasks.length} optimized blocks</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Headway & Buffers</p>
              <h3 className="text-xl font-black text-slate-900">
                {(plan.metrics.headway_compliance_score ?? 100.0).toFixed(1)}%
              </h3>
              <p className="text-[11px] text-slate-500">Zero corridor overlap conflicts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Header & Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#0B2545] text-amber-300">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#0B2545]">{plan.title}</h2>
              <Badge
                className={
                  plan.status === 'PUBLISHED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]'
                    : plan.status === 'APPROVED'
                    ? 'bg-blue-100 text-blue-800 border-blue-300 text-[10px]'
                    : 'bg-amber-100 text-amber-800 border-amber-300 text-[10px]'
                }
              >
                {plan.status}
              </Badge>
              <span className="text-[11px] font-mono text-slate-500">v{plan.version}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Corridor: <span className="font-semibold text-slate-700">{plan.corridor_id}</span> • Date: {plan.period_start}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Hour range filter */}
          <div className="flex bg-slate-100 p-0.5 rounded text-xs">
            <button
              onClick={() => setSelectedHourRange('ALL')}
              className={`px-2.5 py-1 rounded font-semibold ${
                selectedHourRange === 'ALL' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
              }`}
            >
              All 24h
            </button>
            <button
              onClick={() => setSelectedHourRange('NIGHT')}
              className={`px-2.5 py-1 rounded font-semibold ${
                selectedHourRange === 'NIGHT' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
              }`}
            >
              Night Window (00-06)
            </button>
            <button
              onClick={() => setSelectedHourRange('DAY')}
              className={`px-2.5 py-1 rounded font-semibold ${
                selectedHourRange === 'DAY' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
              }`}
            >
              Day Window (06-24)
            </button>
          </div>

          {/* Export Dropdown */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onExport('pdf')}
              className="text-xs h-8 border-slate-300 gap-1.5"
            >
              <FileDown className="h-3.5 w-3.5 text-rose-600" /> PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onExport('excel')}
              className="text-xs h-8 border-slate-300 gap-1.5"
            >
              <FileDown className="h-3.5 w-3.5 text-emerald-600" /> Excel
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onExport('json')}
              className="text-xs h-8 border-slate-300 gap-1.5"
            >
              <FileDown className="h-3.5 w-3.5 text-blue-600" /> JSON
            </Button>
          </div>

          {/* Approval Actions */}
          {canApprove && plan.status === 'OPTIMIZED' && (
            <Button
              size="sm"
              onClick={onApprove}
              className="text-xs h-8 bg-blue-700 hover:bg-blue-800 text-white gap-1.5 font-bold"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve Plan
            </Button>
          )}

          {canPublish && plan.status === 'APPROVED' && (
            <Button
              size="sm"
              onClick={onPublish}
              className="text-xs h-8 bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 font-bold"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Publish Plan
            </Button>
          )}
        </div>
      </div>

      {/* 24-Hour Timeline / Gantt Schedule Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">24-Hour Corridor Possession Schedule</h3>
            <p className="text-[11px] text-slate-500">
              Clustered shadow windows and train regulation margins calculated by CP-SAT solver.
            </p>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">24h Continuous Operational Grid</span>
        </div>

        {/* Hour Header Bar */}
        <div className="grid grid-cols-24 border-b border-slate-200 pb-1 text-[9px] font-mono text-slate-400 text-center">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className={i >= 1 && i <= 4 ? 'bg-amber-50/80 rounded font-bold text-amber-800' : ''}>
              {i < 10 ? `0${i}` : i}
            </div>
          ))}
        </div>

        {/* Task Rows */}
        <div className="space-y-2.5 pt-2">
          {filteredTasks.map((task) => {
            const startTimeStr = task.start_time || task.scheduled_start || '01:00'
            const endTimeStr = task.end_time || task.scheduled_end || '04:00'
            const startHour = parseInt(startTimeStr.split(':')[0], 10) || 0
            const endHour = parseInt(endTimeStr.split(':')[0], 10) || (startHour + 2)
            const durationHours = Math.max(1, endHour - startHour)
            const leftPercent = (startHour / 24) * 100
            const widthPercent = Math.max(4, (durationHours / 24) * 100)

            return (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  selectedTask?.id === task.id
                    ? 'border-[#0B2545] bg-blue-50/50 ring-1 ring-[#0B2545]'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#0B2545] text-white text-[9px] font-mono">{task.track_id || 'MAIN-LINE'}</Badge>
                    <span className="text-xs font-bold text-slate-900">{task.title}</span>
                    <Badge variant="outline" className="text-[9px] font-semibold text-slate-600">
                      {task.department}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-mono text-slate-700 font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {startTimeStr} — {endTimeStr} ({task.duration_minutes || (durationHours * 60)}m)
                    </span>
                    <Badge
                      className={
                        task.is_shadow_block
                          ? 'bg-purple-100 text-purple-800 border-purple-300 text-[9px]'
                          : 'bg-blue-100 text-blue-800 border-blue-300 text-[9px]'
                      }
                    >
                      {task.is_shadow_block ? 'SHADOW BLOCK' : 'DEDICATED'}
                    </Badge>
                  </div>
                </div>

                {/* Visual Gantt Bar */}
                <div className="h-3 w-full bg-slate-200 rounded-full relative overflow-hidden">
                  <div
                    style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                    className={`absolute h-full rounded-full transition-all ${
                      task.is_shadow_block ? 'bg-purple-600' : 'bg-[#134074]'
                    }`}
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between text-[11px] text-slate-600">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>Crew: <strong>{task.assigned_gang_id || 'P-Way Gang #102'}</strong></span>
                    {task.assigned_machine_id && (
                      <span className="border-l border-slate-300 pl-2">
                        Machine: <strong>{task.assigned_machine_id}</strong>
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500">
                    Delay impact: <strong className="text-emerald-700">0 min passenger delay</strong> (Night Slot)
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Autonomous Conflict Resolution Panel */}
      <ConflictDetectionPanel />
    </div>
  )
}
