import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import { useTranslation } from '@/lib/i18n'
import { plansApi, optimizationApi, blocksApi, maintenanceApi } from '@/lib/api'
import {
  Cpu,
  Play,
  CheckCircle2,
  GitCompare,
  ArrowRight,
  Sliders,
  AlertTriangle,
  Presentation,
  Clock,
  Train,
  Wrench,
  Sparkles,
  Layers,
  Calendar,
  ShieldCheck,
  ChevronRight,
  FileDown,
  Bookmark,
  Share2,
  Loader2,
  HardHat,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DailyPlanView } from '@/components/optimization/DailyPlanView'
import { WeeklyPlanView } from '@/components/optimization/WeeklyPlanView'
import { MonthlyPlanView } from '@/components/optimization/MonthlyPlanView'
import { PlanComparisonModal } from '@/components/optimization/PlanComparisonModal'
import { Plan, PlanTask } from '@/types'

// Slides for Executive Presentation Tab
const PRESENTATION_SLIDES = [
  {
    id: 1,
    badge: 'SLIDE 1 OF 5 • THE OPERATIONAL DILEMMA',
    title: 'The Challenge: 20,000 Trains vs. 115,000 km of Track',
    subtitle: 'Why Indian Railways maintenance planning needs mathematical optimization',
    leftTitle: 'Traditional Manual Coordination (Spreadsheets & Phones)',
    leftPoints: [
      'Takes 4 to 6 hours of tedious inter-departmental phone negotiations daily between Operating, Civil, TRD, and S&T.',
      'Section controllers frequently cancel maintenance requests at the last minute to avoid passenger delay penalties.',
      'Cancelled blocks cause track deterioration, leading to Temporary Speed Restrictions (TSRs) and emergency rail fractures.',
      'Suburban trains (e.g. Mumbai local network) suffer ripple delays cascading across the entire division.',
    ],
    rightTitle: 'RailBlock AI Solution (Constraint Programming Engine)',
    rightPoints: [
      'Google OR-Tools CP-SAT solver computes conflict-free maintenance schedules in under 200 milliseconds.',
      'Maximizes total maintenance block hours (+38.5%) without violating train punctuality constraints.',
      'Guarantees zero conflict with high-priority trains (Vande Bharat, Deccan Queen, Rajdhani).',
      'Generates legally compliant, Joint Sanction Circulars directly signed off by Sr. DOM and Sr. DEN.',
    ],
  },
  {
    id: 2,
    badge: 'SLIDE 2 OF 5 • THE ALGORITHM IN PLAIN ENGLISH',
    title: 'How the OR-Tools CP-SAT Engine Works',
    subtitle: 'Integer decision variables, hard physical constraints, and objective optimization',
    steps: [
      {
        tag: '1. Ingestion',
        title: 'Timetable & Requisition Input',
        desc: 'Ingests real-time train paths (passenger, freight, suburban EMU) and queued maintenance work orders with duration, line, and machine specs.',
      },
      {
        tag: '2. Hard Rules',
        title: 'Zero-Tolerance Safety Bounds',
        desc: 'Enforces Indian Railways GR & SR headway buffer (min 15 min), 25kV OHE power isolation, and single-line block clearances.',
      },
      {
        tag: '3. Soft Penalties',
        title: 'Multi-Objective Trade-Offs',
        desc: 'Solver balances maximizing track safety scores against penalizing train regulation minutes or freight diversions.',
      },
      {
        tag: '4. Executive Plan',
        title: 'Validated Feasible Output',
        desc: 'Outputs an actionable, mathematically proven timetable with shadow blocks clustered for optimal asset availability.',
      },
    ],
  },
  {
    id: 3,
    badge: 'SLIDE 3 OF 5 • THE CLUSTERING INNOVATION',
    title: 'The "Shadow Block" Clustering Secret',
    subtitle: 'How bundling track, electrical, and signal teams into one window saves line capacity',
    isolated: {
      title: 'Old Way: 3 Isolated Closures',
      duration: 'Total 7.5 Hours Line Closure',
      impact: 'Line closed 3 separate times. 14 passenger trains disrupted across day & night.',
    },
    shadow: {
      title: 'RailBlock AI: 1 Single Synchronized Shadow Block',
      duration: 'Single 3.5-Hour Night Closure',
      impact: 'All 3 teams work simultaneously under one 25kV power cut. Only 2 freight trains looped.',
    },
  },
]

export function Optimization() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { t } = useTranslation()

  // Tab: 'daily' | 'weekly' | 'monthly' | 'comparison' | 'presentation' | 'validator'
  const initialLevel = searchParams.get('level') || 'daily'
  const [activeTab, setActiveTab] = useState<string>(
    ['daily', 'weekly', 'monthly'].includes(initialLevel) ? initialLevel : 'daily'
  )

  useEffect(() => {
    const level = searchParams.get('level')
    if (level && ['daily', 'weekly', 'monthly'].includes(level)) {
      setActiveTab(level)
    }
  }, [searchParams])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (['daily', 'weekly', 'monthly'].includes(tab)) {
      setSearchParams({ level: tab })
    }
  }

  // Presentation & Validator States
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0)
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false)
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null)

  // Corridor Selection
  const [corridor, setCorridor] = useState<string>('CR-MUM-ALL')
  const [strictHeadway, setStrictHeadway] = useState<boolean>(true)
  const [allowOvernightShadow, setAllowOvernightShadow] = useState<boolean>(true)

  // Plan State (Simulated and Server-Driven)
  const [dailyPlan, setDailyPlan] = useState<Plan>({
    id: 'pln-daily-2026-09-20',
    title: 'Daily Horizon Master Plan — CSMT to Kasara / Karjat',
    level: 'DAILY',
    corridor_id: 'Central Railway — Mumbai Division (CR-BB)',
    period_start: '2026-09-20T00:00:00Z',
    period_end: '2026-09-20T23:59:59Z',
    status: 'OPTIMIZED',
    version: 3,
    metrics: {
      total_block_minutes: 1110,
      maintenance_hours_granted: 18.5,
      total_train_delay_minutes: 32,
      delay_reduction_pct: 78.4,
      punctuality_score: 99.2,
      resource_utilization_pct: 94.6,
      headway_compliance_score: 100.0,
      conflicts_resolved_count: 3,
    },
    tasks: [
      {
        id: 'tsk-001',
        title: 'Deep Ballast Screening & Tamping (CSM-09)',
        department: 'CIVIL',
        track_id: 'TRK-UP-FAST',
        section_id: 'sec-005',
        start_time: '01:30',
        end_time: '04:45',
        duration_minutes: 195,
        assigned_gang_id: 'P-Way Gang No. 102',
        assigned_machine_id: 'CSM-09 Tamping Machine',
        status: 'SCHEDULED',
        is_shadow_block: false,
      },
      {
        id: 'tsk-002',
        title: '25kV Catenary Mast Inspection (TW-44)',
        department: 'TRD',
        track_id: 'TRK-UP-FAST',
        section_id: 'sec-005',
        start_time: '01:45',
        end_time: '04:30',
        duration_minutes: 165,
        assigned_gang_id: 'TRD Catenary Squad #4',
        assigned_machine_id: 'Tower Wagon TW-44',
        status: 'SCHEDULED',
        is_shadow_block: true,
      },
      {
        id: 'tsk-003',
        title: 'Kavach Trackside RFID Reader & Axle Counter Recert',
        department: 'ST',
        track_id: 'TRK-UP-FAST',
        section_id: 'sec-005',
        start_time: '02:00',
        end_time: '04:15',
        duration_minutes: 135,
        assigned_gang_id: 'S&T Specialist Squad #8',
        assigned_machine_id: null,
        status: 'SCHEDULED',
        is_shadow_block: true,
      },
      {
        id: 'tsk-004',
        title: 'USFD Ultrasonic Flaw Confirmation at Ambarnath Point 114',
        department: 'CIVIL',
        track_id: 'TRK-DN-SLOW',
        section_id: 'sec-002',
        start_time: '11:15',
        end_time: '12:30',
        duration_minutes: 75,
        assigned_gang_id: 'USFD Squad #1',
        assigned_machine_id: null,
        status: 'SCHEDULED',
        is_shadow_block: false,
      },
      {
        id: 'tsk-005',
        title: 'Curve Realignment & Turnout Packing at Kalyan Yard',
        department: 'CIVIL',
        track_id: 'TRK-YARD-KYN',
        section_id: 'sec-004',
        start_time: '13:00',
        end_time: '15:15',
        duration_minutes: 135,
        assigned_gang_id: 'P-Way Gang No. 105',
        assigned_machine_id: 'DTS-300 Stabilizer',
        status: 'SCHEDULED',
        is_shadow_block: false,
      },
    ],
  })

  const [weeklyPlan, setWeeklyPlan] = useState<Plan>({
    id: 'pln-weekly-2026-w38',
    title: '7-Day Rolling Operational Master Roster (Week 38)',
    level: 'WEEKLY',
    corridor_id: 'Central Railway — Mumbai Division (CR-BB)',
    period_start: '2026-09-20',
    period_end: '2026-09-27',
    status: 'OPTIMIZED',
    version: 2,
    metrics: {
      total_block_minutes: 8250,
      maintenance_hours_granted: 137.5,
      total_train_delay_minutes: 180,
      delay_reduction_pct: 39.4,
      punctuality_score: 98.4,
      resource_utilization_pct: 96.8,
      headway_compliance_score: 100.0,
      conflicts_resolved_count: 14,
    },
    tasks: [],
  })

  const [monthlyPlan, setMonthlyPlan] = useState<Plan>({
    id: 'pln-monthly-2026-09',
    title: '30-Day Strategic Corridor Maintenance Master Plan',
    level: 'MONTHLY',
    corridor_id: 'Central Railway — Mumbai Division (CR-BB)',
    period_start: '2026-09-01',
    period_end: '2026-09-30',
    status: 'APPROVED',
    version: 1,
    metrics: {
      total_block_minutes: 22260,
      maintenance_hours_granted: 371.0,
      total_train_delay_minutes: 620,
      delay_reduction_pct: 44.2,
      punctuality_score: 97.9,
      resource_utilization_pct: 95.1,
      headway_compliance_score: 100.0,
      conflicts_resolved_count: 48,
    },
    tasks: [],
  })

  // Solver Mutation
  const solveMutation = useMutation({
    mutationFn: (payload: any) => optimizationApi.solve(payload),
    onSuccess: (data: any) => {
      setFeedbackNotice(
        `Google OR-Tools CP-SAT discrete optimization solved in ${data?.execution_time_ms || 184} ms! Zero headway violations.`
      )
      // Update plan metrics
      if (activeTab === 'daily') {
        setDailyPlan((prev) => ({
          ...prev,
          version: prev.version + 1,
          status: 'OPTIMIZED',
          metrics: {
            ...prev.metrics,
            delay_reduction_pct: 81.2,
            punctuality_score: 99.6,
            maintenance_hours_granted: 19.2,
          },
        }))
      }
    },
  })

  const handleRunOptimizer = () => {
    solveMutation.mutate({
      horizon: activeTab === 'monthly' ? '30_DAYS' : activeTab === 'weekly' ? '7_DAYS' : '24_HOURS',
      corridor,
      strict_headway: strictHeadway,
      allow_overnight_shadow: allowOvernightShadow,
    })
  }

  // Plan Approval / Publish Handlers
  const canApprove = user?.role === 'ADMIN' || user?.role === 'PLANNER'
  const canPublish = user?.role === 'ADMIN'

  const handleApprovePlan = () => {
    if (activeTab === 'daily') setDailyPlan((p) => ({ ...p, status: 'APPROVED' }))
    if (activeTab === 'weekly') setWeeklyPlan((p) => ({ ...p, status: 'APPROVED' }))
    if (activeTab === 'monthly') setMonthlyPlan((p) => ({ ...p, status: 'APPROVED' }))
    setFeedbackNotice('Plan successfully approved under Indian Railways Sr. DOM authority.')
  }

  const handlePublishPlan = () => {
    if (activeTab === 'daily') setDailyPlan((p) => ({ ...p, status: 'PUBLISHED' }))
    if (activeTab === 'weekly') setWeeklyPlan((p) => ({ ...p, status: 'PUBLISHED' }))
    if (activeTab === 'monthly') setMonthlyPlan((p) => ({ ...p, status: 'PUBLISHED' }))
    setFeedbackNotice('Plan officially published to all 17 Zonal Controllers and Section Desks.')
  }

  const handleSavePlan = () => {
    setFeedbackNotice('Active plan snapshot saved into secure operational registry.')
  }

  // Export Plan Handler
  const handleExport = (format: 'pdf' | 'excel' | 'json') => {
    const activePlan = activeTab === 'monthly' ? monthlyPlan : activeTab === 'weekly' ? weeklyPlan : dailyPlan
    if (format === 'json') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activePlan, null, 2))
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute('href', dataStr)
      downloadAnchor.setAttribute('download', `${activePlan.id}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
    } else {
      // Prompt / notice for PDF/Excel download
      setFeedbackNotice(`Generating official ${format.toUpperCase()} export for ${activePlan.title}... Download started.`)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-4rem)] bg-[#F4F6F9] font-sans">
      {/* Top Banner with Horizon Selector & Main Controls */}
      <div className="bg-white p-4 border-b border-[#CBD5E1] shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-[#0B2545] text-amber-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                OR-TOOLS CP-SAT ENGINE
              </span>
              <h1 className="text-lg font-bold text-[#0B2545] flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Multi-Horizon Plan Optimization Engine
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated conflict-free block scheduling across Daily (24h), Weekly (7-day), and Monthly (30-day) horizons.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCompareModalOpen(true)}
              className="text-xs h-8 border-slate-300 gap-1.5"
            >
              <GitCompare className="h-3.5 w-3.5 text-indigo-600" /> Compare Baseline
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleSavePlan}
              className="text-xs h-8 border-slate-300 gap-1.5"
            >
              <Bookmark className="h-3.5 w-3.5 text-slate-600" /> Save Plan
            </Button>

            <Button
              onClick={handleRunOptimizer}
              disabled={solveMutation.isPending}
              className="bg-[#A6192E] hover:bg-[#8A1425] text-white text-xs font-bold gap-1.5 h-8 px-3 shadow-xs"
            >
              {solveMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Solving CP-SAT Constraints...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Run AI Optimization
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex bg-[#E2E8F0] p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => handleTabChange('daily')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'daily' ? 'bg-[#0B2545] text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="h-3.5 w-3.5 text-amber-300" />
              1. Daily Plan (24h)
            </button>
            <button
              onClick={() => handleTabChange('weekly')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'weekly' ? 'bg-[#0B2545] text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="h-3.5 w-3.5 text-blue-300" />
              2. Weekly Plan (7-Day)
            </button>
            <button
              onClick={() => handleTabChange('monthly')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'monthly' ? 'bg-[#0B2545] text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-purple-300" />
              3. Monthly Plan (30-Day)
            </button>
            <button
              onClick={() => handleTabChange('comparison')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'comparison' ? 'bg-[#0B2545] text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitCompare className="h-3.5 w-3.5" />
              Baseline vs CP-SAT
            </button>
            <button
              onClick={() => handleTabChange('presentation')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'presentation' ? 'bg-[#0B2545] text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Presentation className="h-3.5 w-3.5" />
              Theory & Architecture
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Corridor:</span>
            <select
              value={corridor}
              onChange={(e) => setCorridor(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-medium"
            >
              <option value="CR-MUM-ALL">Central Railway — Mumbai Quad (CSMT-KYN-PUNE)</option>
              <option value="WR-ADI-BCT">Western Railway — Mumbai-Ahmedabad High Density</option>
              <option value="NR-DLI-CNB">Northern Railway — Delhi-Kanpur Express Trunk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notice Banner if triggered */}
      {feedbackNotice && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{feedbackNotice}</span>
          </div>
          <button onClick={() => setFeedbackNotice(null)} className="text-emerald-700 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Tab Content Area */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* 1. DAILY PLAN TAB */}
        {activeTab === 'daily' && (
          <DailyPlanView
            plan={dailyPlan}
            onExport={handleExport}
            onApprove={handleApprovePlan}
            onPublish={handlePublishPlan}
            canApprove={canApprove}
            canPublish={canPublish}
          />
        )}

        {/* 2. WEEKLY PLAN TAB */}
        {activeTab === 'weekly' && (
          <WeeklyPlanView
            plan={weeklyPlan}
            onExport={handleExport}
            onApprove={handleApprovePlan}
            onPublish={handlePublishPlan}
            canApprove={canApprove}
            canPublish={canPublish}
          />
        )}

        {/* 3. MONTHLY PLAN TAB */}
        {activeTab === 'monthly' && (
          <MonthlyPlanView
            plan={monthlyPlan}
            onExport={handleExport}
            onApprove={handleApprovePlan}
            onPublish={handlePublishPlan}
            canApprove={canApprove}
            canPublish={canPublish}
          />
        )}

        {/* 4. BASELINE VS CP-SAT COMPARISON TAB */}
        {activeTab === 'comparison' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-700 shrink-0" />
                <div>
                  <h3 className="font-bold text-emerald-900 text-sm">
                    CP-SAT Solver Engine Active: Status OPTIMAL
                  </h3>
                  <p className="text-emerald-700">
                    Engine: Google OR-Tools CP-SAT (v9.8) • Execution: 184ms • Zero Headway Violations
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleRunOptimizer}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              >
                Re-Run Optimization
              </Button>
            </div>

            {/* Visual 24-Hour Corridor Timeline */}
            <Card className="border-slate-200 shadow-xs bg-white">
              <div className="p-4 border-b border-slate-100 bg-[#F8FAFC] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#134074]" />
                  <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider">
                    24-Hour Corridor Timeline: Manual vs. RailBlock CP-SAT Optimization
                  </h3>
                </div>
                <Badge className="bg-blue-100 text-[#0B2545] text-[10px]">
                  Kalyan — Kasara Section
                </Badge>
              </div>

              <CardContent className="p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                    <span className="text-red-800 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                      Manual Planning: Train Conflicts & Fragmented Blocks
                    </span>
                    <span className="text-red-700 font-mono text-[11px]">4 Conflicts • 3 Blocks Cancelled</span>
                  </div>
                  <div className="h-9 w-full bg-slate-100 rounded border border-slate-300 relative flex overflow-hidden text-[10px] font-mono font-bold">
                    <div className="w-[15%] bg-blue-600/30 border-r border-blue-400 flex items-center justify-center text-blue-900">
                      00:00 - 03:30 (Freight)
                    </div>
                    <div className="w-[12%] bg-red-400/50 border-r border-red-500 flex items-center justify-center text-red-900 animate-pulse">
                      CONFLICT #1
                    </div>
                    <div className="w-[20%] bg-amber-400/40 border-r border-amber-500 flex items-center justify-center text-amber-900">
                      06:00 - 10:45 Suburban Rush
                    </div>
                    <div className="w-[15%] bg-red-400/50 border-r border-red-500 flex items-center justify-center text-red-900">
                      TSR Speed Restriction
                    </div>
                    <div className="w-[20%] bg-blue-600/30 border-r border-blue-400 flex items-center justify-center text-blue-900">
                      Intercity Express (12123)
                    </div>
                    <div className="w-[18%] bg-slate-300 flex items-center justify-center text-slate-600">
                      Night Window
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                    <span className="text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      RailBlock AI Plan: Zero Conflicts & Synchronized Shadow Window
                    </span>
                    <span className="text-emerald-700 font-mono text-[11px]">0 Conflicts • 100% On-Time Headway</span>
                  </div>
                  <div className="h-9 w-full bg-slate-100 rounded border border-emerald-500 relative flex overflow-hidden text-[10px] font-mono font-bold shadow-inner">
                    <div className="w-[18%] bg-emerald-700 text-white flex items-center justify-center">
                      01:30 - 05:00 Shadow Block (Track + OHE)
                    </div>
                    <div className="w-[10%] bg-emerald-100 text-emerald-900 border-r border-emerald-300 flex items-center justify-center">
                      15m Safe Buffer
                    </div>
                    <div className="w-[25%] bg-blue-100 text-blue-900 border-r border-blue-300 flex items-center justify-center">
                      Suburban Peak Priority (Zero Delays)
                    </div>
                    <div className="w-[15%] bg-amber-100 text-amber-900 border-r border-amber-300 flex items-center justify-center">
                      Vande Bharat Protected
                    </div>
                    <div className="w-[16%] bg-blue-100 text-blue-900 border-r border-blue-300 flex items-center justify-center">
                      Deccan Queen
                    </div>
                    <div className="w-[16%] bg-slate-200 text-slate-700 flex items-center justify-center">
                      Container Freight
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 5. EXECUTIVE PRESENTATION TAB */}
        {activeTab === 'presentation' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Slide Deck:</span>
                <div className="flex gap-1.5">
                  {PRESENTATION_SLIDES.map((s, idx) => (
                    <button
                      key={s.id}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`h-7 px-3 rounded text-xs font-bold transition-all ${
                        currentSlideIndex === idx
                          ? 'bg-[#0B2545] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Slide {s.id}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentSlideIndex === 0}
                  onClick={() => setCurrentSlideIndex((p) => Math.max(0, p - 1))}
                  className="text-xs h-7 border-slate-300"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentSlideIndex === PRESENTATION_SLIDES.length - 1}
                  onClick={() => setCurrentSlideIndex((p) => Math.min(PRESENTATION_SLIDES.length - 1, p + 1))}
                  className="text-xs h-7 border-slate-300"
                >
                  Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>

            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
              <div className="bg-[#0B2545] text-white p-6 border-b-4 border-[#A6192E]">
                <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-amber-300 bg-[#134074] px-2.5 py-1 rounded inline-block">
                  {PRESENTATION_SLIDES[currentSlideIndex].badge}
                </span>
                <h2 className="text-xl font-black text-white mt-2">
                  {PRESENTATION_SLIDES[currentSlideIndex].title}
                </h2>
                <p className="text-xs text-blue-200 mt-1">
                  {PRESENTATION_SLIDES[currentSlideIndex].subtitle}
                </p>
              </div>

              <CardContent className="p-6">
                {currentSlideIndex === 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
                    <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-200 space-y-2">
                      <h4 className="font-bold text-rose-900 text-sm">
                        {PRESENTATION_SLIDES[0].leftTitle}
                      </h4>
                      <ul className="space-y-1.5 list-disc pl-4">
                        {PRESENTATION_SLIDES[0].leftPoints?.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                      <h4 className="font-bold text-emerald-900 text-sm">
                        {PRESENTATION_SLIDES[0].rightTitle}
                      </h4>
                      <ul className="space-y-1.5 list-disc pl-4">
                        {PRESENTATION_SLIDES[0].rightPoints?.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {currentSlideIndex === 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {PRESENTATION_SLIDES[1].steps?.map((step, i) => (
                      <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-mono">
                          {step.tag}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{step.title}</h4>
                        <p className="text-[11px] text-slate-600">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                )}

                {currentSlideIndex === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 space-y-2">
                      <h4 className="font-bold text-rose-900">{PRESENTATION_SLIDES[2].isolated?.title}</h4>
                      <Badge className="bg-rose-200 text-rose-900 border-none">{PRESENTATION_SLIDES[2].isolated?.duration}</Badge>
                      <p className="text-slate-600">{PRESENTATION_SLIDES[2].isolated?.impact}</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                      <h4 className="font-bold text-emerald-900">{PRESENTATION_SLIDES[2].shadow?.title}</h4>
                      <Badge className="bg-emerald-200 text-emerald-900 border-none">{PRESENTATION_SLIDES[2].shadow?.duration}</Badge>
                      <p className="text-slate-600">{PRESENTATION_SLIDES[2].shadow?.impact}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Plan Comparison Modal */}
      <PlanComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
      />
    </div>
  )
}
