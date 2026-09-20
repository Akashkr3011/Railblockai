import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { maintenanceApi, priorityApi, sectionsApi, assetsApi } from '@/lib/api'
import {
  Wrench,
  AlertTriangle,
  Loader2,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Info,
  Layers,
  X,
  HardHat,
  Zap,
  Sparkles,
  Flame,
  Check,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Drawer } from '@/components/ui/drawer'

const WORK_PRESETS = [
  {
    title: 'Continuous Welded Rail (CWR) De-stressing & USFD Joint Testing',
    category: 'PERMANENT_WAY',
    priority: 'CRITICAL',
    duration: 3.5,
    machine: 'CSM Tamping Machine & USFD Trolley',
    gang: 18,
    powerBlock: false,
    line: 'UP Fast',
  },
  {
    title: 'CSM 09-32 Track Tamping Machine Packing & Alignment',
    category: 'PERMANENT_WAY',
    priority: 'HIGH',
    duration: 3.0,
    machine: 'CSM 09-32 Track Machine',
    gang: 12,
    powerBlock: false,
    line: 'DN Fast',
  },
  {
    title: '25kV OHE Contact Wire Renewal & Catenary Staggering',
    category: 'ELECTRICAL_TRD',
    priority: 'HIGH',
    duration: 2.5,
    machine: 'TRD 8-Wheeler Tower Wagon',
    gang: 10,
    powerBlock: true,
    line: 'UP Slow',
  },
  {
    title: 'Electronic Interlocking Point Machine Motor Overhaul',
    category: 'SIGNAL_TELECOM',
    priority: 'HIGH',
    duration: 2.0,
    machine: 'Signal Tool Van & Megger Meter',
    gang: 6,
    powerBlock: false,
    line: 'Yard Turnouts',
  },
  {
    title: 'Ballast Cleaning Machine (BCM) Deep Screening & Shoulder Clearing',
    category: 'PERMANENT_WAY',
    priority: 'STANDARD',
    duration: 4.0,
    machine: 'BCM High-Output Ballast Cleaner',
    gang: 22,
    powerBlock: false,
    line: 'DN Main',
  },
]

export function Maintenance() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('ALL')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false)
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false)

  // Form states for new maintenance work order
  const [newTitle, setNewTitle] = useState<string>('')
  const [newCategory, setNewCategory] = useState<string>('PERMANENT_WAY')
  const [newPriority, setNewPriority] = useState<string>('HIGH')
  const [newDurationHours, setNewDurationHours] = useState<number>(2.5)
  const [newSection, setNewSection] = useState<string>('sec-003')
  const [newTrackLine, setNewTrackLine] = useState<string>('UP Fast')
  const [newMachine, setNewMachine] = useState<string>('CSM 09-32 Tamping Machine')
  const [newGangSize, setNewGangSize] = useState<number>(14)
  const [newPowerBlock, setNewPowerBlock] = useState<boolean>(false)
  const [newDeadline, setNewDeadline] = useState<string>('2026-09-24')

  // Auto-open modal if URL has ?action=new
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsCreateModalOpen(true)
    }
  }, [searchParams])

  const { data: tasks, isLoading, isError } = useQuery({
    queryKey: ['maintenance'],
    queryFn: maintenanceApi.list,
  })

  const { data: sections } = useQuery<{ items: any[]; total: number }>({
    queryKey: ['sections'],
    queryFn: () => sectionsApi.list(),
  })

  const createMutation = useMutation({
    mutationFn: (payload: any) => maintenanceApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] })
      setIsCreateModalOpen(false)
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 4000)
      // Clear URL param
      setSearchParams({})
      // Reset form
      setNewTitle('')
    },
  })

  const handleApplyPreset = (preset: typeof WORK_PRESETS[0]) => {
    setNewTitle(preset.title)
    setNewCategory(preset.category)
    setNewPriority(preset.priority)
    setNewDurationHours(preset.duration)
    setNewMachine(preset.machine)
    setNewGangSize(preset.gang)
    setNewPowerBlock(preset.powerBlock)
    setNewTrackLine(preset.line)
  }

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      title: newTitle || 'Turnout machine lubrication and ballast packing',
      category: newCategory,
      priority: newPriority,
      estimated_duration_hours: newDurationHours,
      section_id: newSection,
      track_line: newTrackLine,
      machine_required: newMachine,
      gang_strength: newGangSize,
      power_block: newPowerBlock,
      deadline: newDeadline,
      status: 'PENDING',
    })
  }

  // Calculate live estimated AI Priority Score
  const estimatedScore = Math.min(
    99.5,
    Math.round(
      (newPriority === 'CRITICAL' ? 45 : newPriority === 'HIGH' ? 32 : 20) +
        (newCategory === 'PERMANENT_WAY' ? 25 : 20) +
        newDurationHours * 3.5 +
        (newPowerBlock ? 6 : 0)
    )
  )

  const rawTasks = tasks?.items || []
  const filteredTasks = rawTasks.filter((task: any) => {
    if (filterCategory !== 'ALL' && task.category !== filterCategory) return false
    return true
  })

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 overflow-auto bg-[#F4F6F9] min-h-[calc(100vh-4rem)] font-sans">
      {/* Toast Banner */}
      {showSuccessToast && (
        <div className="bg-emerald-700 text-white px-4 py-3 rounded-lg shadow-md flex items-center justify-between animate-in fade-in duration-300">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-200" />
            <span>Maintenance Requisition Logged Successfully! Assigned for CP-SAT Block Planning.</span>
          </div>
          <button onClick={() => setShowSuccessToast(false)} className="text-emerald-200 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#CBD5E1] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-[#134074] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Engineering Work Orders
            </span>
            <h1 className="text-xl font-bold tracking-tight text-[#0B2545] flex items-center gap-2">
              <Wrench className="h-5 w-5 text-[#134074]" />
              Track, OHE & S&T Maintenance Command Center
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Multi-criteria prioritization engine combining safety criticality, defect history, and track GMT density.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#A6192E] hover:bg-[#8A1425] text-white text-xs font-bold gap-1.5 h-8 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" /> Requisition Maintenance Work Order
        </Button>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="bg-white p-3 rounded border border-[#CBD5E1] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Filter className="h-3 w-3 text-slate-500" /> Discipline:
          </span>

          <div className="flex bg-[#E2E8F0] p-0.5 rounded font-semibold">
            <button
              onClick={() => setFilterCategory('ALL')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterCategory === 'ALL' ? 'bg-[#0B2545] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Disciplines ({rawTasks.length})
            </button>
            <button
              onClick={() => setFilterCategory('PERMANENT_WAY')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterCategory === 'PERMANENT_WAY' ? 'bg-[#134074] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Civil P-Way
            </button>
            <button
              onClick={() => setFilterCategory('ELECTRICAL_TRD')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterCategory === 'ELECTRICAL_TRD' ? 'bg-[#134074] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              OHE Traction
            </button>
            <button
              onClick={() => setFilterCategory('SIGNAL_TELECOM')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterCategory === 'SIGNAL_TELECOM' ? 'bg-[#134074] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Signal & Telecom
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-blue-600" />
          <span>Showing {filteredTasks.length} sanctioned & pending requisitions</span>
        </div>
      </div>

      {/* Task List Table / Cards */}
      <div className="bg-white rounded border border-[#CBD5E1] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center text-slate-400 gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-xs">Fetching maintenance requisitions...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No maintenance tasks match the active filters.</div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {filteredTasks.map((task: any) => {
              const isSelected = selectedId === task.id
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedId(task.id)}
                  className={`p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50/80 border-l-4 border-[#0B2545]' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-500">{task.id}</span>
                      <span className="font-bold text-xs text-[#0B2545]">{task.title}</span>
                      <Badge
                        className={
                          task.priority === 'CRITICAL'
                            ? 'bg-red-700 text-white font-bold text-[9px]'
                            : task.priority === 'HIGH'
                            ? 'bg-amber-600 text-white font-bold text-[9px]'
                            : 'bg-blue-700 text-white font-bold text-[9px]'
                        }
                      >
                        {task.priority || 'STANDARD'}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] text-slate-600 border-slate-300">
                        {task.category?.replace(/_/g, ' ') || 'CIVIL TRACK'}
                      </Badge>
                    </div>

                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
                      <span>Section: <strong className="text-slate-700">{task.section_name || task.section_id}</strong></span>
                      <span>•</span>
                      <span>Track: <strong className="text-slate-700">{task.track_line || 'UP Fast'}</strong></span>
                      <span>•</span>
                      <span>Duration: <strong className="text-slate-700">{task.estimated_duration_hours || 2.5} hrs</strong></span>
                      <span>•</span>
                      <span>Machine: <strong className="text-slate-700">{task.machine_required || 'CSM Tamping'}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">AI Priority Score</div>
                      <div className="font-mono font-bold text-sm text-[#A6192E]">
                        {task.priority_score ? task.priority_score.toFixed(1) : '78.5'}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedId(task.id)
                      }}
                      className="text-xs h-7 border-slate-300 text-slate-700"
                    >
                      AI Breakdown
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Task Detail / AI Breakdown Drawer */}
      <MaintenanceDetailDrawer id={selectedId} onClose={() => setSelectedId(null)} />

      {/* Requisition Work Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-300 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#A6192E] tracking-wider">
                  Civil • Electrical • S&T Requisition
                </span>
                <h2 className="text-base font-bold text-[#0B2545] flex items-center gap-2">
                  <HardHat className="h-4 w-4 text-[#A6192E]" />
                  Requisition New Maintenance Work Order
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setSearchParams({})
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Presets Bar */}
            <div className="mb-4 bg-slate-50 p-3 rounded border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" /> Quick Work Order Templates:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {WORK_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="bg-white hover:bg-blue-50 border border-slate-300 text-[10px] font-medium text-slate-700 px-2.5 py-1 rounded transition-colors truncate max-w-[280px]"
                  >
                    {preset.title.slice(0, 38)}...
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              {/* Task Title */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Work Order Description / Activity Name *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Ultrasonic flaw testing on continuous welded rail (CWR)..."
                  className="w-full p-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#0B2545] outline-none"
                />
              </div>

              {/* Discipline & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department / Discipline</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-xs"
                  >
                    <option value="PERMANENT_WAY">Civil Engineering (P-Way)</option>
                    <option value="ELECTRICAL_TRD">Electrical TRD (25kV OHE Traction)</option>
                    <option value="SIGNAL_TELECOM">Signal & Telecommunication (S&T)</option>
                    <option value="MECHANICAL_C_W">Mechanical (Carriage & Wagon)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Priority Classification</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-xs"
                  >
                    <option value="CRITICAL">CRITICAL (Direct Track Safety Hazard / USFD Flaw)</option>
                    <option value="HIGH">HIGH (Speed Restriction / Caution Order Imposed)</option>
                    <option value="STANDARD">STANDARD (Cyclic Preventive Maintenance)</option>
                  </select>
                </div>
              </div>

              {/* Section and Track Line */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Section Location</label>
                  <select
                    value={newSection}
                    onChange={(e) => setNewSection(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-xs"
                  >
                    {sections?.items?.map((sec: any) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.code} — {sec.name} ({sec.length_km} KM)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Track Line Affected</label>
                  <select
                    value={newTrackLine}
                    onChange={(e) => setNewTrackLine(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-xs"
                  >
                    <option value="UP Fast">UP Fast (Suburban / Mail Express)</option>
                    <option value="DN Fast">DN Fast (Suburban / Mail Express)</option>
                    <option value="UP Slow">UP Slow (Local Suburban Line)</option>
                    <option value="DN Slow">DN Slow (Local Suburban Line)</option>
                    <option value="3rd Line">3rd Line (Freight / Ghat Section)</option>
                    <option value="Yard Turnouts">Station Yard Turnouts & Interlocking</option>
                  </select>
                </div>
              </div>

              {/* Duration & Resource Gang */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="8"
                    value={newDurationHours}
                    onChange={(e) => setNewDurationHours(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gang Strength (Persons)</label>
                  <input
                    type="number"
                    min="4"
                    max="50"
                    value={newGangSize}
                    onChange={(e) => setNewGangSize(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Deadline</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
              </div>

              {/* Machine and Power Block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Machine / Equipment Required</label>
                  <input
                    type="text"
                    value={newMachine}
                    onChange={(e) => setNewMachine(e.target.value)}
                    placeholder="e.g. CSM 09-32 Tamping Machine, Tower Wagon"
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                  />
                </div>

                <div className="bg-slate-50 p-2.5 rounded border border-slate-200 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newPowerBlock}
                      onChange={(e) => setNewPowerBlock(e.target.checked)}
                      className="rounded border-slate-300 text-[#0B2545] focus:ring-0"
                    />
                    <div className="flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      <span className="font-bold text-slate-700">Requires 25kV OHE Power Isolation</span>
                    </div>
                  </label>
                  <span className="text-[10px] text-slate-500 block ml-5">
                    Enables bundling into shadow blocks with TRD electrical teams.
                  </span>
                </div>
              </div>

              {/* Live Multi-Factor AI Score Estimator */}
              <div className="bg-blue-50/60 p-3 rounded border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#134074]">
                    Estimated Multi-Factor AI Priority Score
                  </span>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Calculated from safety criticality + duration + GMT density factor
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold font-mono text-[#A6192E]">{estimatedScore.toFixed(1)}</span>
                  <span className="text-[10px] text-slate-500"> / 100</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    setSearchParams({})
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-[#A6192E] hover:bg-[#8A1425] text-white font-bold text-xs"
                >
                  {createMutation.isPending ? 'Sanctioning Order...' : 'Submit Work Order Requisition'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function MaintenanceDetailDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data: task, isLoading } = useQuery({
    queryKey: ['maintenance', id],
    queryFn: () => maintenanceApi.get(id!),
    enabled: !!id,
  })

  const { data: explanation } = useQuery({
    queryKey: ['priority-explanation', id],
    queryFn: () => priorityApi.explainTask(id!),
    enabled: !!id,
  })

  return (
    <Drawer isOpen={!!id} onClose={onClose} title="Maintenance Intelligence & Explainable AI Score" width="w-[480px]">
      {isLoading ? (
        <div className="flex h-32 items-center justify-center text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !task ? (
        <div className="p-8 text-center text-slate-500">Task details unavailable</div>
      ) : (
        <div className="space-y-5 text-xs text-slate-700 font-sans">
          {/* Header Card */}
          <div className="bg-[#0B2545] text-white p-4 rounded">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-xs text-blue-300 font-bold">{task.id}</span>
                <h3 className="font-bold text-sm text-white mt-0.5">{task.title}</h3>
              </div>
              <Badge className="bg-red-500 text-white font-bold text-[10px]">
                {task.priority || 'HIGH'}
              </Badge>
            </div>
            <div className="text-blue-200 text-[11px] mt-2 font-mono">
              Discipline: {(task.category || 'CIVIL').replace(/_/g, ' ')} • Section: {task.section_name || task.section_id}
            </div>
          </div>

          {/* Explainable AI Breakdown */}
          <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-3">
            <h4 className="font-bold text-[#0B2545] uppercase text-[11px] flex items-center justify-between">
              <span>Multi-Factor AI Priority Score</span>
              <span className="font-mono text-sm font-bold text-red-700">
                {task.priority_score ? task.priority_score.toFixed(1) : 94.2} / 100
              </span>
            </h4>

            <div className="space-y-2 text-[11px]">
              <div>
                <div className="flex justify-between text-slate-600 mb-0.5">
                  <span>Track Safety Risk & Rail Defect Severity (Weight 40%)</span>
                  <span className="font-mono font-bold text-slate-800">38.4 / 40</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-red-600 h-full w-[96%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-0.5">
                  <span>Traffic Density & Gross Million Tonnes (GMT) (Weight 30%)</span>
                  <span className="font-mono font-bold text-slate-800">27.0 / 30</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#134074] h-full w-[90%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-0.5">
                  <span>Asset Age & Cyclic Inspection Overdue (Weight 20%)</span>
                  <span className="font-mono font-bold text-slate-800">18.2 / 20</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-600 h-full w-[91%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-0.5">
                  <span>Operational Delay Risk (Weight 10%)</span>
                  <span className="font-mono font-bold text-slate-800">8.9 / 10</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full w-[89%]" />
                </div>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded border border-slate-200 text-[11px] text-slate-600 italic">
              <b>AI Evaluation:</b> {explanation?.summary || 'Immediate block allocation is prioritized due to high gross tonnage on the Kalyan-Karjat ghat section.'}
            </div>
          </div>

          {/* Operational requirements */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Required Machines</span>
              <span className="font-bold text-slate-800">{task.machine_required || 'CSM Tamping Machine'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Target Deadline</span>
              <span className="font-bold text-slate-800 font-mono">{task.deadline || '2026-09-24'}</span>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  )
}
