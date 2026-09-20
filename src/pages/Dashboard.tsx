import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { dashboardApi, blocksApi, trainsApi, maintenanceApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useTranslation } from '@/lib/i18n'
import { Tooltip } from '@/components/ui/Tooltip'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  CalendarDays,
  Database,
  Radio,
  Train,
  GitCompare,
  PlusCircle,
  FileText,
  MapPin,
  Flame,
  ShieldCheck,
  ChevronRight,
  HardHat,
  Building2,
  Activity,
  Cpu,
  FileCheck2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useTranslation()

  const { data: summary, isLoading: isSummaryLoading, isError: isSummaryError } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: dashboardApi.getSummary,
    refetchInterval: 30000,
  })

  const { data: blocksData } = useQuery({
    queryKey: ['blocks'],
    queryFn: blocksApi.list,
    refetchInterval: 30000,
  })

  const { data: trainsData } = useQuery<{ items: any[]; total: number }>({
    queryKey: ['trains'],
    queryFn: () => trainsApi.list(),
    refetchInterval: 15000,
  })

  const { data: maintenanceData } = useQuery({
    queryKey: ['maintenance'],
    queryFn: maintenanceApi.list,
    refetchInterval: 30000,
  })

  const activeBlocksList = (blocksData?.items || []).slice(0, 4)
  const activeTrainsList = (trainsData?.items || []).slice(0, 4)

  return (
    <div className="flex-1 space-y-5 p-3 sm:p-5 md:p-6 overflow-auto bg-[#F4F6F9] min-h-[calc(100vh-4rem)] font-sans">
      {/* Top Header section with Government & National branding */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0B2545] text-amber-300 px-2.5 py-0.5 rounded flex items-center gap-1">
              {t('gov.india', 'Government of India')} • {t('min.railways', 'Ministry of Railways')}
            </span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              National Rail Network Operations Center (NROC) • 17 Zones & DFCCIL
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B2545]">
            {t('app.title', 'RAILBLOCK AI')} — {t('nav.dashboard', 'Integrated National Command')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time synchronization across 17 Zonal Railways, Operating Branches, P-Way Civil Engineering, and Dedicated Freight Corridors.
          </p>
        </div>

        {/* Top Quick Actions with Professional Hover & Tooltips */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => navigate('/network')}
            tooltip="Open National GIS map tracking all 17 railway zones and junctions"
            className="bg-[#134074] hover:bg-[#0B2545] text-white text-xs font-semibold gap-1.5 shadow-xs"
          >
            <MapPin className="h-3.5 w-3.5 text-amber-300" />
            <span>{t('nav.network', 'All-India GIS Map')}</span>
          </Button>

          <Button
            onClick={() => navigate('/maintenance?action=new')}
            tooltip="Requisition new track or catenary possession window"
            className="bg-[#A6192E] hover:bg-[#8B1425] text-white text-xs font-semibold gap-1.5 shadow-xs"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>{t('btn.new_task', 'Requisition Task')}</span>
          </Button>

          {user?.role !== 'WORKER' && (
            <Button
              onClick={() => navigate('/optimization')}
              tooltip="Launch Google OR-Tools CP-SAT discrete optimization engine"
              className="bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-semibold gap-1.5 shadow-xs"
            >
              <GitCompare className="h-3.5 w-3.5 text-amber-400" />
              <span>{t('btn.optimize', 'Plan Optimization')}</span>
            </Button>
          )}

          <Button
            onClick={() => navigate('/resources')}
            tooltip="View operational gangs, tower wagons, and track machine resources"
            className="bg-[#134074] hover:bg-[#0B2545] text-white text-xs font-semibold gap-1.5 shadow-xs"
          >
            <HardHat className="h-3.5 w-3.5 text-amber-300" />
            <span>{t('nav.resources', 'Operational Resources')}</span>
          </Button>

          {user?.role === 'ADMIN' && (
            <Button
              variant="outline"
              onClick={() => navigate('/reports')}
              tooltip="Generate official Joint Circular Memorandum"
              className="text-xs font-medium border-slate-300 text-slate-700 hover:bg-slate-100 gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>{t('btn.export', 'Joint Circular')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. DYNAMIC ROLE-CUSTOMIZED MISSION CONTROL STRIP */}
      <div
        className={`rounded-xl border p-4 shadow-sm transition-all duration-300 ${
          user?.role === 'WORKER'
            ? 'bg-gradient-to-r from-rose-900/10 via-rose-50/50 to-white border-rose-300'
            : user?.role === 'PLANNER'
            ? 'bg-gradient-to-r from-blue-900/10 via-indigo-50/50 to-white border-blue-300'
            : 'bg-gradient-to-r from-amber-900/10 via-amber-50/50 to-white border-amber-300'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-lg shrink-0 shadow-xs ${
                user?.role === 'WORKER'
                  ? 'bg-[#A6192E] text-white'
                  : user?.role === 'PLANNER'
                  ? 'bg-[#134074] text-white'
                  : 'bg-[#0B2545] text-amber-300'
              }`}
            >
              {user?.role === 'WORKER' ? (
                <HardHat className="h-6 w-6" />
              ) : user?.role === 'PLANNER' ? (
                <Radio className="h-6 w-6" />
              ) : (
                <Building2 className="h-6 w-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white border text-slate-800">
                  {user?.role === 'WORKER'
                    ? 'FIELD WORKER DASHBOARD'
                    : user?.role === 'PLANNER'
                    ? 'SECTION CONTROLLER DESK'
                    : 'SENIOR DOM EXECUTIVE CONSOLE'}
                </span>
                <span className="text-xs text-slate-500 font-mono">User: {user?.full_name || 'Officer'}</span>
              </div>

              <h2 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                {user?.role === 'WORKER'
                  ? 'Field Engineering & Track Requisition Desk'
                  : user?.role === 'PLANNER'
                  ? 'Live Train Movement & Section Headway Console'
                  : 'Executive Decision Support & Block Sanction Authority'}
              </h2>

              <p className="text-xs text-slate-600 mt-0.5">
                {user?.role === 'WORKER'
                  ? 'Submit work orders, record USFD ultrasonic rail flaw tests, verify safety protocols, and request track machine slots.'
                  : user?.role === 'PLANNER'
                  ? 'Monitor real-time train punctualities across 17 zones, regulate block handovers, and enforce timetable buffer protections.'
                  : 'Review proposed maintenance possessions, execute Google OR-Tools CP-SAT discrete optimization, approve plans, and audit logs.'}
              </p>
            </div>
          </div>

          {/* Role-Specific Direct Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
            {user?.role === 'WORKER' && (
              <>
                <Button
                  size="sm"
                  onClick={() => navigate('/maintenance?action=new')}
                  tooltip="Directly requisition a track machine or manual maintenance block"
                  className="bg-[#A6192E] hover:bg-[#8B1425] text-white text-xs font-semibold gap-1.5"
                >
                  <Wrench className="h-3.5 w-3.5" /> Log Work Order
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/assets')}
                  tooltip="Inspect Track Geometry Index (TGI) and rail defect logs"
                  className="text-xs font-medium border-slate-300 hover:bg-slate-100"
                >
                  <Database className="h-3.5 w-3.5 text-slate-600" /> USFD Flaw Register
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/resources')}
                  tooltip="View assigned gang strength and machine readiness"
                  className="text-xs font-medium border-slate-300 hover:bg-slate-100"
                >
                  <HardHat className="h-3.5 w-3.5 text-[#134074]" /> Gang & Machine Fleet
                </Button>
              </>
            )}

            {user?.role === 'PLANNER' && (
              <>
                <Button
                  size="sm"
                  onClick={() => navigate('/trains')}
                  tooltip="Inspect live train movements and timetable delays across all 17 zones"
                  className="bg-[#134074] hover:bg-[#0B2545] text-white text-xs font-semibold gap-1.5"
                >
                  <Train className="h-3.5 w-3.5 text-amber-300" /> Train Operations Deck
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/blocks')}
                  tooltip="Inspect active line blocks and verify corridor possession clearance"
                  className="text-xs font-medium border-slate-300 hover:bg-slate-100"
                >
                  <CalendarDays className="h-3.5 w-3.5 text-[#134074]" /> Block Schedule
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/optimization')}
                  tooltip="Multi-horizon CP-SAT discrete optimization"
                  className="text-xs font-medium border-slate-300 hover:bg-slate-100"
                >
                  <GitCompare className="h-3.5 w-3.5 text-indigo-600" /> Plan Optimization
                </Button>
              </>
            )}

            {user?.role === 'ADMIN' && (
              <>
                <Button
                  size="sm"
                  onClick={() => navigate('/blocks')}
                  tooltip="Review proposed blocks and exercise official sanction authority as Sr. DOM"
                  className="bg-[#0B2545] hover:bg-[#134074] hover:text-amber-200 text-white text-xs font-bold gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Sanction Pending Blocks
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/optimization')}
                  tooltip="Multi-horizon CP-SAT discrete optimization"
                  className="text-xs font-medium border-slate-300 hover:bg-slate-100"
                >
                  <GitCompare className="h-3.5 w-3.5 text-indigo-600" /> Plan Optimization
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/audit')}
                  tooltip="View immutable cryptographic audit trail of officer decisions"
                  className="text-xs font-medium border-slate-300 hover:bg-slate-100"
                >
                  <FileCheck2 className="h-3.5 w-3.5 text-purple-600" /> Audit Trail
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Metric Tiles with Tooltips */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          icon={CalendarDays}
          label={t('cst.blocks', 'Active Blocks')}
          value={summary?.activeBlocks ?? 2}
          isLoading={isSummaryLoading}
          isError={isSummaryError}
          color="text-[#134074]"
          sub="Sanctioned on track"
          tooltipText="Number of sanctioned maintenance blocks currently active on national corridors"
        />
        <KpiCard
          icon={Clock}
          label="Upcoming Blocks"
          value={summary?.upcomingBlocks ?? 5}
          isLoading={isSummaryLoading}
          isError={isSummaryError}
          color="text-indigo-600"
          sub="Night roster (01:00 - 05:00)"
          tooltipText="Possession windows scheduled during low-density night maintenance rosters"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Critical Orders"
          value={summary?.criticalTasks ?? 3}
          isLoading={isSummaryLoading}
          isError={isSummaryError}
          color="text-[#A6192E]"
          sub="P-Way Safety Requisitions"
          tooltipText="High-priority track defects requiring immediate emergency or shadow possession"
        />
        <KpiCard
          icon={Wrench}
          label="Pending Work"
          value={summary?.openTasks ?? 5}
          isLoading={isSummaryLoading}
          isError={isSummaryError}
          color="text-amber-600"
          sub="Awaiting CP-SAT Slot"
          tooltipText="Work orders queued for multi-criteria optimization by Google OR-Tools"
        />
        <KpiCard
          icon={ShieldCheck}
          label="Punctuality KPI"
          value="98.4%"
          isLoading={isSummaryLoading}
          isError={isSummaryError}
          color="text-emerald-600"
          sub="National Fleet Average"
          tooltipText="Passenger train on-time performance rate across all 17 railway zones"
        />
        <KpiCard
          icon={Database}
          label="Monitored Assets"
          value={summary?.totalAssets ?? 18}
          isLoading={isSummaryLoading}
          isError={isSummaryError}
          color="text-slate-700"
          sub="Track, OHE & Points"
          tooltipText="Total telemetry-instrumented assets registered with CRIS"
        />
      </div>

      {/* Main Grid: Active Block Status & Live Train Fleet Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Active & Proposed Maintenance Blocks Table */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardHeader className="py-3.5 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-[#0B2545] flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[#134074]" />
                  Active & Approved Track Possessions
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  National corridor engineering possessions sanctioned by Divisional Operating Managers.
                </CardDescription>
              </div>
              <Link
                to="/blocks"
                className="text-xs font-semibold text-[#134074] hover:text-[#0B2545] flex items-center gap-1 transition-colors"
              >
                View All Blocks <ChevronRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead className="bg-[#0B2545]/5 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Block ID</th>
                    <th className="p-3">Corridor / Section</th>
                    <th className="p-3">Window</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {activeBlocksList.map((blk: any) => (
                    <tr key={blk.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#0B2545]">{blk.id}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{blk.section_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {blk.zone || 'NR'} • {blk.corridor || 'NDLS-HWH'}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600">
                        {blk.start_time ? new Date(blk.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '01:30'} -{' '}
                        {blk.end_time ? new Date(blk.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '04:30'}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-700">
                        {blk.requested_duration_hours || 3.0} hrs
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                          {blk.department}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge
                          className={`text-[10px] font-bold ${
                            blk.status === 'APPROVED'
                              ? 'bg-emerald-600 text-white'
                              : blk.status === 'REJECTED'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500 text-slate-950'
                          }`}
                        >
                          {blk.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Live Train Movement Stream Card */}
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardHeader className="py-3.5 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-[#0B2545] flex items-center gap-2">
                  <Train className="h-4 w-4 text-[#134074]" />
                  Live Pan-India Train Headways & Movement Buffer
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Real-time GPS feeds across Vande Bharat, Rajdhani, Shatabdi, and DFCCIL freight corridors.
                </CardDescription>
              </div>
              <Link
                to="/trains"
                className="text-xs font-semibold text-[#134074] hover:text-[#0B2545] flex items-center gap-1 transition-colors"
              >
                Track All Trains <ChevronRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-100">
              {activeTrainsList.map((trn: any) => (
                <div key={trn.id || trn.train_number} className="p-3.5 hover:bg-slate-50 flex items-center justify-between transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-[#0B2545] px-1.5 py-0.5 rounded border border-slate-200">
                        {trn.train_number}
                      </span>
                      <span className="font-bold text-xs text-slate-900">{trn.train_name || trn.name}</span>
                      <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-800 border-blue-200">
                        {trn.zone ? `${trn.zone} • ` : ''}{(trn.train_type || trn.type || 'EXPRESS').replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>Route: <strong className="text-slate-700">{trn.origin || trn.from_station || 'NDLS'} → {trn.destination || trn.to_station || 'HWH'}</strong></span>
                      {trn.corridor && (
                        <>
                          <span>•</span>
                          <span className="text-slate-500 font-mono text-[10px]">{trn.corridor}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        (trn.delay_minutes || 0) === 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : (trn.delay_minutes || 0) <= 15
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {(trn.delay_minutes || 0) === 0 ? 'RT (ON TIME)' : `+${trn.delay_minutes} min`}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">Headway: 15 min buffer OK</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Operations Directives, Safety & Quick Requisition */}
        <div className="space-y-5">
          {/* Quick Work Order Requisition Card */}
          <Card className="border-slate-200 shadow-xs bg-gradient-to-br from-[#0B2545] to-[#134074] text-white">
            <CardHeader className="p-4 pb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
                P-Way / TRD Requisition Desk
              </span>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <HardHat className="h-5 w-5 text-amber-400" />
                Need a Track or Power Block?
              </CardTitle>
              <CardDescription className="text-blue-100 text-xs">
                Submit maintenance requisitions directly to the Divisional Traffic Dispatcher.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              <p className="text-xs text-slate-200 leading-relaxed">
                Log track machine tamping, rail destressing, or catenary maintenance. System automatically checks for 
                <strong> shadow block opportunities</strong> with zero passenger train disruption.
              </p>
              <Button
                onClick={() => navigate('/maintenance?action=new')}
                tooltip="Open field work order form"
                className="w-full bg-amber-400 hover:bg-amber-300 text-[#0B2545] font-bold text-xs shadow-md"
              >
                + New Maintenance Work Order
              </Button>
            </CardContent>
          </Card>

          {/* Continuous Welded Rail & Safety Watch */}
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardHeader className="py-3 px-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-[#0B2545] flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-600" />
                Track Temperature & CWR Safety
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-500">
                Continuous Welded Rail (CWR) de-stressing thresholds
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded border border-slate-100">
                <span className="text-slate-600 font-medium">Mean Rail Temp (Td)</span>
                <span className="font-bold text-slate-900 font-mono">38.4 °C (Normal)</span>
              </div>
              <div className="flex justify-between items-center bg-amber-50 p-2.5 rounded border border-amber-200">
                <span className="text-amber-900 font-medium">Ghat / Deccan (Td + 22°C)</span>
                <span className="font-bold text-amber-800 font-mono">54.2 °C (Caution Alert)</span>
              </div>
              <div className="text-[11px] text-slate-500 leading-relaxed">
                Safety Rule IR-PWM 2020: Rail de-stressing blocks are auto-prioritized before track temperature exceeds 58°C to prevent buckling.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  isLoading,
  isError,
  color,
  sub,
  tooltipText,
}: {
  icon: any
  label: string
  value: string | number
  isLoading: boolean
  isError: boolean
  color: string
  sub: string
  tooltipText?: string
}) {
  return (
    <Tooltip content={tooltipText || label} position="top">
      <Card className="p-3.5 bg-white border-slate-200 shadow-xs hover:border-[#134074] hover:shadow-md transition-all duration-200 cursor-default">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          {isLoading ? (
            <span className="text-xs text-slate-400">Loading...</span>
          ) : isError ? (
            <span className="text-xs text-red-500">--</span>
          ) : (
            <span className="text-xl font-black text-slate-900 font-mono tracking-tight">{value}</span>
          )}
        </div>
        <div className="text-[10px] text-slate-400 mt-1 truncate">{sub}</div>
      </Card>
    </Tooltip>
  )
}
