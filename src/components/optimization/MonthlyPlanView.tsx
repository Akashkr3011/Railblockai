import React, { useState } from 'react'
import {
  Calendar,
  Layers,
  ShieldCheck,
  TrendingDown,
  CloudRain,
  Sun,
  FileDown,
  CheckCircle2,
  AlertTriangle,
  Compass,
  BarChart3,
  Truck,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plan } from '@/types'

interface MonthlyPlanViewProps {
  plan: Plan
  onExport: (format: 'pdf' | 'excel' | 'json') => void
  onApprove?: () => void
  onPublish?: () => void
  canApprove?: boolean
  canPublish?: boolean
}

const SEASONAL_POLICIES = [
  {
    name: 'Pre-Monsoon Catchment & Drainage Clearance',
    season: 'MONSOON PREPAREDNESS',
    status: 'ACTIVE ENFORCEMENT',
    rule: 'Mandatory 4-hour weekly daylight block on Ghat sections (Kasara/Karjat) for culvert desilting & boulder netting.',
  },
  {
    name: 'Winter Fog Buffer Protection (Northern Corridors)',
    season: 'FOG PROTOCOL',
    status: 'SCHEDULED NOV-FEB',
    rule: 'Automatic 20-minute safety cushion injected before passenger express arrival slots.',
  },
  {
    name: 'Diwali & Chhath Puja Passenger Protection',
    season: 'FESTIVE RUSH',
    status: 'BLACKOUT ENFORCED',
    rule: 'Zero non-emergency daytime blocks permitted on high-density passenger trunk routes during peak 10 festival days.',
  },
]

const MONTHLY_HEAVY_PLANT = [
  { name: 'CSM-09 Continuous Action Tamping Express', required: '95 km', available: '110 km', margin: '+15.8%', status: 'ADEQUATE' },
  { name: 'BCM Ballast Cleaning Machine Fleet', required: '18 km', available: '20 km', margin: '+11.1%', status: 'ADEQUATE' },
  { name: 'Dynamic Track Stabilizer DTS-300', required: '120 km', available: '120 km', margin: 'Balanced', status: 'TIGHT' },
  { name: 'Plasser Rail Grinder RG-60', required: '45 km', available: '50 km', margin: '+11.1%', status: 'ADEQUATE' },
]

export function MonthlyPlanView({
  plan,
  onExport,
  onApprove,
  onPublish,
  canApprove,
  canPublish,
}: MonthlyPlanViewProps) {
  const [selectedWeek, setSelectedWeek] = useState<number>(1)

  const weeklyBreakdowns = [
    { week: 1, label: 'Week 1 (Day 1-7)', hours: 82.5, blocks: 24, megaBlocks: 2, riskLevel: 'LOW', throughput: '98.4%' },
    { week: 2, label: 'Week 2 (Day 8-14)', hours: 94.0, blocks: 28, megaBlocks: 3, riskLevel: 'MEDIUM', throughput: '96.2%' },
    { week: 3, label: 'Week 3 (Day 15-21)', hours: 106.0, blocks: 32, megaBlocks: 4, riskLevel: 'HIGH', throughput: '94.8%' },
    { week: 4, label: 'Week 4 (Day 22-30)', hours: 88.5, blocks: 26, megaBlocks: 2, riskLevel: 'LOW', throughput: '97.9%' },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-700 rounded-lg">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Monthly Block Budget</p>
              <h3 className="text-xl font-black text-purple-700">371.0 hrs</h3>
              <p className="text-[11px] text-slate-500">110 Total Possessions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Projected Corridor Throughput</p>
              <h3 className="text-xl font-black text-emerald-700">96.8%</h3>
              <p className="text-[11px] text-slate-500">Only 3.2% capacity throttled</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Scheduled Mega Blocks</p>
              <h3 className="text-xl font-black text-slate-900">11 Major</h3>
              <p className="text-[11px] text-slate-500">Weekend 6-hour windows</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Heavy Machinery Capacity</p>
              <h3 className="text-xl font-black text-amber-700">100% Covered</h3>
              <p className="text-[11px] text-slate-500">CSM, BCM & Grinder ready</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Header & Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#0B2545]">{plan.title}</h2>
            <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-[10px]">
              30-DAY STRATEGIC HORIZON
            </Badge>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
              {plan.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Corridor: <span className="font-semibold text-slate-700">{plan.corridor_id}</span> • Planning Horizon: {plan.period_start} to {plan.period_end}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onExport('pdf')}
            className="text-xs h-8 border-slate-300 gap-1.5"
          >
            <FileDown className="h-3.5 w-3.5 text-rose-600" /> Executive PDF Summary
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onExport('excel')}
            className="text-xs h-8 border-slate-300 gap-1.5"
          >
            <FileDown className="h-3.5 w-3.5 text-emerald-600" /> Monthly Excel
          </Button>

          {canApprove && plan.status === 'OPTIMIZED' && (
            <Button
              size="sm"
              onClick={onApprove}
              className="text-xs h-8 bg-blue-700 hover:bg-blue-800 text-white gap-1.5 font-bold"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve Monthly Master Plan
            </Button>
          )}

          {canPublish && plan.status === 'APPROVED' && (
            <Button
              size="sm"
              onClick={onPublish}
              className="text-xs h-8 bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 font-bold"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Publish to Railway Board
            </Button>
          )}
        </div>
      </div>

      {/* 4-Week Strategic Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Weekly Strategic Risk & Corridor Throughput</h3>
          <p className="text-[11px] text-slate-500">
            CP-SAT long-term horizon optimizes mega blocks to align with low freight demand cycles.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {weeklyBreakdowns.map((wb) => (
            <div
              key={wb.week}
              onClick={() => setSelectedWeek(wb.week)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedWeek === wb.week
                  ? 'border-[#0B2545] bg-blue-50/50 ring-1 ring-[#0B2545]'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-[#0B2545]">{wb.label}</span>
                <Badge
                  className={
                    wb.riskLevel === 'HIGH'
                      ? 'bg-rose-100 text-rose-800 border-rose-300 text-[9px]'
                      : wb.riskLevel === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-800 border-amber-300 text-[9px]'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300 text-[9px]'
                  }
                >
                  {wb.riskLevel} RISK
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Total Possession:</span>
                  <strong className="text-indigo-700">{wb.hours} hrs</strong>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Possession Blocks:</span>
                  <strong className="text-slate-800">{wb.blocks} blocks</strong>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Mega Blocks (6h+):</span>
                  <strong className="text-purple-700">{wb.megaBlocks} scheduled</strong>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Corridor Throughput:</span>
                  <strong className="text-emerald-700">{wb.throughput}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seasonal Adjustments & Policies */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <CloudRain className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Dynamic Seasonal Adjustments & Blackout Rules</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SEASONAL_POLICIES.map((policy) => (
            <div key={policy.name} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-blue-100 text-blue-800 text-[9px] font-bold">{policy.season}</Badge>
                <span className="text-[10px] text-emerald-700 font-bold">{policy.status}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">{policy.name}</h4>
              <p className="text-[11px] text-slate-600">{policy.rule}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Heavy Machinery Requirement vs Availability */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-purple-600" />
          <h3 className="text-sm font-bold text-slate-900">Heavy Plant Requirement vs Depot Availability</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-2.5">Track Machine Type</th>
                <th className="p-2.5">Monthly Requirement</th>
                <th className="p-2.5">Depot Available Capacity</th>
                <th className="p-2.5">Reserve Margin</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MONTHLY_HEAVY_PLANT.map((item) => (
                <tr key={item.name} className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-900">{item.name}</td>
                  <td className="p-2.5 font-mono">{item.required}</td>
                  <td className="p-2.5 font-mono font-bold text-indigo-700">{item.available}</td>
                  <td className="p-2.5 font-mono text-emerald-700">{item.margin}</td>
                  <td className="p-2.5">
                    <Badge
                      className={
                        item.status === 'ADEQUATE'
                          ? 'bg-emerald-100 text-emerald-800 text-[9px]'
                          : 'bg-amber-100 text-amber-800 text-[9px]'
                      }
                    >
                      {item.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
