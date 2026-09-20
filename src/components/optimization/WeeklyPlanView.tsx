import React, { useState } from 'react'
import {
  CalendarDays,
  TrendingDown,
  Layers,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  FileDown,
  Activity,
  AlertTriangle,
  Cpu,
  Clock,
  Zap,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plan } from '@/types'

interface WeeklyPlanViewProps {
  plan: Plan
  onExport: (format: 'pdf' | 'excel' | 'json') => void
  onApprove?: () => void
  onPublish?: () => void
  canApprove?: boolean
  canPublish?: boolean
}

const DAYS_OF_WEEK = ['Mon (Day 1)', 'Tue (Day 2)', 'Wed (Day 3)', 'Thu (Day 4)', 'Fri (Day 5)', 'Sat (Day 6)', 'Sun (Day 7)']

const WEEKLY_MACHINES = [
  { name: 'CSM-09 Continuous Tamping Machine', cycle: '25 km / week', status: 'Optimal', currentKm: '18.4 km' },
  { name: 'BCM Ballast Cleaning Machine #12', cycle: '4.5 km / week', status: 'Scheduled Day 4', currentKm: '3.1 km' },
  { name: 'DTS-300 Dynamic Track Stabilizer', cycle: '30 km / week', status: 'Optimal', currentKm: '22.8 km' },
  { name: '8-Wheeler TRD Tower Wagon TW-44', cycle: 'OHE Annual Recert', status: 'Active Day 2, 5', currentKm: '42 km' },
]

export function WeeklyPlanView({
  plan,
  onExport,
  onApprove,
  onPublish,
  canApprove,
  canPublish,
}: WeeklyPlanViewProps) {
  const [selectedDay, setSelectedDay] = useState<number>(0)

  // Simulation day allocation
  const dayAllocations = [
    { day: 'Mon', blocks: 4, hours: 14.5, trainsRegulated: 1, bottleneckRisk: 'LOW', focus: 'CSMT-KYN Sub-urban Fast Line' },
    { day: 'Tue', blocks: 6, hours: 19.0, trainsRegulated: 2, bottleneckRisk: 'MEDIUM', focus: 'Thane-Diva Quad Tamping & OHE' },
    { day: 'Wed', blocks: 3, hours: 11.5, trainsRegulated: 0, bottleneckRisk: 'LOW', focus: 'Kasara Ghat Curve Realignment' },
    { day: 'Thu', blocks: 7, hours: 22.0, trainsRegulated: 3, bottleneckRisk: 'HIGH', focus: 'Kalyan Junction Diamond Crossing' },
    { day: 'Fri', blocks: 5, hours: 16.0, trainsRegulated: 1, bottleneckRisk: 'LOW', focus: 'Karjat-Lonavala 3rd Line TRD' },
    { day: 'Sat', blocks: 8, hours: 26.5, trainsRegulated: 4, bottleneckRisk: 'HIGH', focus: 'Weekend Mega Block (01:00-06:30)' },
    { day: 'Sun', blocks: 9, hours: 28.0, trainsRegulated: 4, bottleneckRisk: 'HIGH', focus: 'Sunday Night Possessions & USFD' },
  ]

  const totalWeeklyHours = dayAllocations.reduce((a, b) => a + b.hours, 0)
  const totalWeeklyBlocks = dayAllocations.reduce((a, b) => a + b.blocks, 0)

  return (
    <div className="space-y-6">
      {/* KPI Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">7-Day Possession Granted</p>
              <h3 className="text-xl font-black text-indigo-700">{totalWeeklyHours.toFixed(1)} hrs</h3>
              <p className="text-[11px] text-slate-500">{totalWeeklyBlocks} total planned blocks</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Weekly Delay Aversion</p>
              <h3 className="text-xl font-black text-emerald-700">-39.4%</h3>
              <p className="text-[11px] text-slate-500">Saved 420 train delay minutes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Workload Balance Score</p>
              <h3 className="text-xl font-black text-slate-900">96.8 / 100</h3>
              <p className="text-[11px] text-slate-500">No depot over-allocation</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Machine Maintenance Cycles</p>
              <h3 className="text-xl font-black text-slate-900">100% On-Track</h3>
              <p className="text-[11px] text-slate-500">All 4 heavy units in cycle</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Header & Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#0B2545]">{plan.title}</h2>
            <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-[10px]">
              7-DAY ROLLING WINDOW
            </Badge>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
              {plan.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Corridor: <span className="font-semibold text-slate-700">{plan.corridor_id}</span> • Window: {plan.period_start} to {plan.period_end}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onExport('pdf')}
            className="text-xs h-8 border-slate-300 gap-1.5"
          >
            <FileDown className="h-3.5 w-3.5 text-rose-600" /> PDF Roster
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onExport('excel')}
            className="text-xs h-8 border-slate-300 gap-1.5"
          >
            <FileDown className="h-3.5 w-3.5 text-emerald-600" /> Excel
          </Button>

          {canApprove && plan.status === 'OPTIMIZED' && (
            <Button
              size="sm"
              onClick={onApprove}
              className="text-xs h-8 bg-blue-700 hover:bg-blue-800 text-white gap-1.5 font-bold"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve Weekly Roster
            </Button>
          )}

          {canPublish && plan.status === 'APPROVED' && (
            <Button
              size="sm"
              onClick={onPublish}
              className="text-xs h-8 bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 font-bold"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Publish to 17 Zones
            </Button>
          )}
        </div>
      </div>

      {/* 7-Day Day-Wise Allocation Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Day-Wise Maintenance Block Allocation & Bottleneck Prediction</h3>
          <p className="text-[11px] text-slate-500">
            CP-SAT distributes track possessions across weekdays to safeguard weekend passenger surge.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {dayAllocations.map((item, idx) => (
            <div
              key={item.day}
              onClick={() => setSelectedDay(idx)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                selectedDay === idx
                  ? 'border-[#0B2545] bg-blue-50/50 ring-1 ring-[#0B2545]'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-[#0B2545]">{DAYS_OF_WEEK[idx].split(' ')[0]}</span>
                <Badge
                  className={
                    item.bottleneckRisk === 'HIGH'
                      ? 'bg-rose-100 text-rose-800 border-rose-300 text-[9px]'
                      : item.bottleneckRisk === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-800 border-amber-300 text-[9px]'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300 text-[9px]'
                  }
                >
                  {item.bottleneckRisk} RISK
                </Badge>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Blocks:</span>
                  <strong className="text-slate-900">{item.blocks}</strong>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Hours:</span>
                  <strong className="text-indigo-700">{item.hours}h</strong>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Trains Reg:</span>
                  <strong className={item.trainsRegulated > 2 ? 'text-rose-600' : 'text-slate-800'}>
                    {item.trainsRegulated}
                  </strong>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 line-clamp-2">
                {item.focus}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Machine Maintenance Cycles */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Machine Maintenance Cycles & Utilization Heatmap</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {WEEKLY_MACHINES.map((machine) => (
            <div key={machine.name} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-start justify-between gap-1">
                <h4 className="text-xs font-bold text-slate-900">{machine.name}</h4>
                <Badge className="bg-emerald-100 text-emerald-800 text-[9px]">{machine.status}</Badge>
              </div>
              <div className="text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Weekly Target:</span>
                  <strong>{machine.cycle}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Progress This Week:</span>
                  <strong className="text-indigo-700">{machine.currentKm}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
