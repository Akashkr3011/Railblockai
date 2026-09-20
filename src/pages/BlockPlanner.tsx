import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blocksApi, sectionsApi } from '@/lib/api'
import {
  CalendarDays,
  Clock,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Plus,
  Loader2,
  Filter,
  Check,
  X,
  AlertTriangle,
  MapPin,
  Train,
  Wrench,
  FileCheck,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Drawer } from '@/components/ui/drawer'

export function BlockPlanner() {
  const queryClient = useQueryClient()
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PROPOSED' | 'APPROVED'>('ALL')
  const [selectedSection, setSelectedSection] = useState<string>('ALL')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false)

  // Form states for creating new block request
  const [newBlockType, setNewBlockType] = useState<string>('INTEGRATED')
  const [newBlockSection, setNewBlockSection] = useState<string>('sec-003')
  const [newBlockDuration, setNewBlockDuration] = useState<number>(3.0)
  const [newBlockPurpose, setNewBlockPurpose] = useState<string>('')
  const [newBlockDept, setNewBlockDept] = useState<string>('CIVIL_ENGINEERING')

  const { data: blocks, isLoading, isError } = useQuery({
    queryKey: ['blocks'],
    queryFn: blocksApi.list,
  })

  const { data: sections } = useQuery<{ items: any[]; total: number }>({
    queryKey: ['sections'],
    queryFn: () => sectionsApi.list(),
  })

  // Approval Mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => blocksApi.approve(id, 'Sr. DOM / Mumbai Division (Shri V. R. Sharma, IRTS)'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] })
    },
  })

  // Rejection Mutation
  const rejectMutation = useMutation({
    mutationFn: (id: string) => blocksApi.reject(id, 'Excessive Mail/Express Passenger delay on fast corridor'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] })
    },
  })

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => blocksApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] })
      setIsCreateModalOpen(false)
      setNewBlockPurpose('')
    },
  })

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      block_type: newBlockType,
      section_id: newBlockSection,
      requested_duration_hours: newBlockDuration,
      purpose: newBlockPurpose || 'Scheduled track and overhead electrical works',
      department: newBlockDept,
      start_time: '2026-09-20T01:30:00Z',
      end_time: '2026-09-20T04:30:00Z',
    })
  }

  const rawBlocks = blocks?.items || []
  const filteredBlocks = rawBlocks.filter((b: any) => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false
    if (selectedSection !== 'ALL' && b.section_id !== selectedSection) return false
    return true
  })

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 overflow-auto bg-[#F4F6F9] min-h-[calc(100vh-4rem)] font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#CBD5E1] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-[#134074] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Control Office Module
            </span>
            <h1 className="text-xl font-bold tracking-tight text-[#0B2545] flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#134074]" />
              Maintenance Block Planning & Operational Roster
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate Traffic, Power (OHE), and S&T blocks without disrupting Mail/Express timetable paths.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#A6192E] hover:bg-[#8A1425] text-white text-xs font-bold gap-1.5 h-8"
        >
          <Plus className="h-3.5 w-3.5" /> Requisition New Block
        </Button>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="bg-white p-3 rounded border border-[#CBD5E1] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Filter className="h-3 w-3 text-slate-500" /> Filter:
          </span>

          <div className="flex bg-[#E2E8F0] p-0.5 rounded font-semibold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'ALL' ? 'bg-[#0B2545] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Windows ({rawBlocks.length})
            </button>
            <button
              onClick={() => setStatusFilter('PROPOSED')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'PROPOSED' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Proposed / For Review ({rawBlocks.filter((b: any) => b.status === 'PROPOSED').length})
            </button>
            <button
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'APPROVED' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Approved Roster ({rawBlocks.filter((b: any) => b.status === 'APPROVED').length})
            </button>
          </div>

          {/* Section Filter */}
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 bg-white text-xs font-mono"
          >
            <option value="ALL">All Sections (CR Mumbai)</option>
            {sections?.items?.map((sec: any) => (
              <option key={sec.id} value={sec.id}>
                {sec.code} — {sec.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Showing {filteredBlocks.length} operational blocks
        </div>
      </div>

      {/* Main Blocks Table with 24-Hour Corridor Allocation Timeline */}
      <Card className="border-[#CBD5E1] shadow-xs overflow-hidden bg-white">
        <div className="p-3 border-b border-slate-100 bg-[#F8FAFC] flex justify-between items-center text-xs font-semibold text-[#0B2545]">
          <span>CENTRAL RAILWAY — DIVISIONAL BLOCK SCHEDULE</span>
          <span className="font-mono text-slate-500">24-HOUR TIME CYCLE</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-slate-400 text-xs">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Fetching divisional block roster...
          </div>
        ) : filteredBlocks.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No block windows match current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#EBF0F5] text-[#0B2545] font-bold border-b border-[#CBD5E1]">
                <tr>
                  <th className="px-4 py-2.5 font-bold w-48">Block Requisition</th>
                  <th className="px-3 py-2.5 font-bold w-48">Section / Line</th>
                  <th className="px-3 py-2.5 font-bold w-28">Status</th>
                  <th className="px-4 py-2.5 font-bold">24h Schedule & Headway Window</th>
                  <th className="px-3 py-2.5 font-bold text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredBlocks.map((block: any) => {
                  const s = new Date(block.start_time)
                  const e = new Date(block.end_time)
                  const sHours = s.getHours() + s.getMinutes() / 60
                  const eHours = e.getHours() + e.getMinutes() / 60
                  const left = (sHours / 24) * 100
                  let width = ((eHours - sHours) / 24) * 100
                  if (width <= 0) width = 12.5

                  return (
                    <tr key={block.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 align-top">
                        <div className="font-bold text-[#0B2545] font-mono">{block.id}</div>
                        <div className="text-[11px] font-bold text-slate-600 mt-0.5">
                          {block.block_type} BLOCK
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                          {block.purpose || 'Track engineering works'}
                        </div>
                        <button
                          onClick={() => setSelectedBlockId(block.id)}
                          className="text-[#134074] hover:underline font-bold text-[10px] mt-1 block"
                        >
                          View Safety Dossier →
                        </button>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <div className="font-semibold text-slate-800 text-[11px]">
                          {block.section_name || block.section_id}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Dept: <span className="font-mono font-bold text-slate-700">{block.department || 'OPERATING'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Req Duration: <span className="font-bold text-slate-800">{block.requested_duration_hours || 3} hrs</span>
                        </div>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <BlockStatusBadge status={block.status} />
                        {block.approving_officer && (
                          <div className="text-[9px] text-emerald-800 font-semibold mt-1">
                            Approved by DOM
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <div className="w-full bg-slate-100 h-7 rounded border border-slate-200 relative overflow-hidden">
                          {/* Hour markers */}
                          {[0, 6, 12, 18].map((h) => (
                            <div
                              key={h}
                              className="absolute top-0 bottom-0 border-l border-slate-300 text-[8px] text-slate-400 pl-0.5 pt-0.5"
                              style={{ left: `${(h / 24) * 100}%` }}
                            >
                              {String(h).padStart(2, '0')}:00
                            </div>
                          ))}

                          {/* Block Allocation bar */}
                          <div
                            className={`absolute top-1 bottom-1 rounded border shadow-2xs flex items-center px-1.5 cursor-pointer ${
                              block.status === 'APPROVED'
                                ? 'bg-emerald-600/20 border-emerald-600 text-emerald-900'
                                : block.status === 'REJECTED'
                                ? 'bg-red-500/20 border-red-500 text-red-900'
                                : 'bg-amber-500/20 border-amber-600 text-amber-900'
                            }`}
                            style={{ left: `${Math.min(85, Math.max(2, left))}%`, width: `${Math.max(10, width)}%` }}
                            onClick={() => setSelectedBlockId(block.id)}
                            title={`${s.toLocaleTimeString()} - ${e.toLocaleTimeString()}`}
                          >
                            <span className="text-[9px] font-bold font-mono truncate">
                              {block.block_type} ({block.requested_duration_hours}h)
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1 px-0.5">
                          <span>00:00 (Midnight)</span>
                          <span>06:00 (Morning Peak)</span>
                          <span>12:00 (Noon)</span>
                          <span>18:00 (Evening Peak)</span>
                          <span>24:00</span>
                        </div>
                      </td>

                      <td className="px-3 py-3 align-top text-right">
                        {block.status === 'PROPOSED' ? (
                          <div className="flex flex-col gap-1 items-end">
                            <Button
                              size="sm"
                              disabled={approveMutation.isPending}
                              onClick={() => approveMutation.mutate(block.id)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] h-6 px-2 font-bold w-24 gap-1"
                            >
                              <Check className="h-3 w-3" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={rejectMutation.isPending}
                              onClick={() => rejectMutation.mutate(block.id)}
                              className="border-red-300 text-red-700 hover:bg-red-50 text-[10px] h-6 px-2 font-bold w-24 gap-1"
                            >
                              <X className="h-3 w-3" /> Reject
                            </Button>
                          </div>
                        ) : block.status === 'APPROVED' ? (
                          <div className="text-emerald-700 font-bold flex items-center justify-end gap-1 text-[11px]">
                            <FileCheck className="h-3.5 w-3.5" /> Ready for Line Clear
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">No action required</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Block Detail Drawer */}
      <BlockDetailDrawer
        id={selectedBlockId}
        onClose={() => setSelectedBlockId(null)}
        onApprove={(id) => approveMutation.mutate(id)}
        onReject={(id) => rejectMutation.mutate(id)}
      />

      {/* Create Block Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 text-xs space-y-4 border border-slate-300">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-sm font-bold text-[#0B2545] uppercase">
                Requisition Maintenance Block Window
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBlock} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Block Discipline / Type</label>
                <select
                  value={newBlockType}
                  onChange={(e) => setNewBlockType(e.target.value)}
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="INTEGRATED">INTEGRATED (Joint Civil Track + TRD Overhead)</option>
                  <option value="POWER_OHE">POWER_OHE (25kV Catenary Isolation)</option>
                  <option value="TRAFFIC">TRAFFIC (Track Renewal / Heavy Machine Tamping)</option>
                  <option value="SIGNAL">SIGNAL (Electronic Interlocking / Points Maintenance)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Section / Corridor</label>
                <select
                  value={newBlockSection}
                  onChange={(e) => setNewBlockSection(e.target.value)}
                  className="w-full p-2 border rounded bg-white"
                >
                  {sections?.items?.map((sec: any) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.code} — {sec.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="8"
                    value={newBlockDuration}
                    onChange={(e) => setNewBlockDuration(Number(e.target.value))}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department</label>
                  <select
                    value={newBlockDept}
                    onChange={(e) => setNewBlockDept(e.target.value)}
                    className="w-full p-2 border rounded bg-white"
                  >
                    <option value="CIVIL_ENGINEERING">Civil Engineering (Permanent Way)</option>
                    <option value="ELECTRICAL_TRD">Electrical TRD (Traction Distribution)</option>
                    <option value="SIGNAL_TELECOM">Signal & Telecommunication (S&T)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Purpose & Safety Precautions</label>
                <textarea
                  rows={2}
                  value={newBlockPurpose}
                  onChange={(e) => setNewBlockPurpose(e.target.value)}
                  placeholder="e.g. Ultrasonic flaw detection and turnout facing point packing..."
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-[#A6192E] hover:bg-[#8A1425] text-white font-bold"
                >
                  {createMutation.isPending ? 'Submitting...' : 'Submit Requisition to DOM'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function BlockDetailDrawer({
  id,
  onClose,
  onApprove,
  onReject,
}: {
  id: string | null
  onClose: () => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
}) {
  const { data: block, isLoading } = useQuery({
    queryKey: ['block', id],
    queryFn: () => blocksApi.get(id!),
    enabled: !!id,
  })

  return (
    <Drawer isOpen={!!id} onClose={onClose} title="Maintenance Block Safety Dossier" width="w-[520px]">
      {isLoading ? (
        <div className="flex h-32 items-center justify-center text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !block ? (
        <div className="p-8 text-center text-slate-500">Block record unavailable</div>
      ) : (
        <div className="space-y-5 text-xs text-slate-700 font-sans">
          {/* Header info */}
          <div className="bg-[#0B2545] text-white p-3 rounded">
            <div className="flex justify-between items-center">
              <span className="font-mono text-sm font-bold">{block.id}</span>
              <BlockStatusBadge status={block.status} />
            </div>
            <div className="text-blue-200 font-bold uppercase mt-1">
              {block.block_type} BLOCK • {block.department || 'OPERATING'}
            </div>
          </div>

          {/* Section details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Section</span>
              <span className="font-bold text-slate-900">{block.section_name || block.section_id}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Duration</span>
              <span className="font-bold text-slate-900">{block.requested_duration_hours} Hours</span>
            </div>
          </div>

          {/* Purpose */}
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Operational Purpose</span>
            <p className="text-slate-800 leading-relaxed">{block.purpose}</p>
          </div>

          {/* Safety Precautions */}
          <div>
            <h4 className="font-bold text-[#0B2545] uppercase text-[11px] mb-2 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600" /> Mandatory Safety Protocols (IR General Rules)
            </h4>
            <div className="space-y-1.5 bg-amber-50/60 border border-amber-200 p-3 rounded">
              {(block.safety_precautions || [
                'OHE Traction Power cut permit issued by SCADA controller',
                'Earthing discharge rods secured on both sides at 100m distance',
                'Banner flag & detonator protection placed at 600m on both UP/DN tracks',
                'Facing turnout clamped and padlocked with Station Master key custody',
              ]).map((p: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-[11px] text-amber-950">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Affected Trains */}
          <div>
            <h4 className="font-bold text-[#0B2545] uppercase text-[11px] mb-2 flex items-center gap-1.5">
              <Train className="h-3.5 w-3.5 text-[#134074]" /> Affected Train Services
            </h4>
            <div className="border border-slate-200 rounded p-2.5 bg-white divide-y divide-slate-100">
              {(block.affected_train_ids?.length ? block.affected_train_ids : ['CON-4091 JNPT Freight']).map(
                (t: string, idx: number) => (
                  <div key={idx} className="py-1 flex justify-between items-center text-[11px]">
                    <span className="font-mono font-bold text-slate-800">{t}</span>
                    <span className="text-slate-500 text-[10px]">Looped / Regulated</span>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Approval details / actions */}
          {block.status === 'PROPOSED' ? (
            <div className="pt-3 border-t border-slate-200 flex gap-2">
              <Button
                onClick={() => {
                  onApprove(block.id)
                  onClose()
                }}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-1"
              >
                <Check className="h-4 w-4" /> Approve Block
              </Button>
              <Button
                onClick={() => {
                  onReject(block.id)
                  onClose()
                }}
                variant="outline"
                className="flex-1 border-red-300 text-red-700 hover:bg-red-50 font-bold gap-1"
              >
                <X className="h-4 w-4" /> Reject Block
              </Button>
            </div>
          ) : block.status === 'APPROVED' ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 text-xs">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" /> Approved by {block.approving_officer}
              </div>
              <div className="text-[10px] text-emerald-700 mt-1 font-mono">
                Sanctioned at: {block.approval_timestamp || new Date().toLocaleString()}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Drawer>
  )
}

function BlockStatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase()
  if (s === 'approved')
    return (
      <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100 border border-emerald-300 shadow-none font-bold text-[10px]">
        APPROVED
      </Badge>
    )
  if (s === 'proposed')
    return (
      <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100 border border-amber-300 shadow-none font-bold text-[10px]">
        PROPOSED
      </Badge>
    )
  if (s === 'rejected')
    return (
      <Badge className="bg-red-100 text-red-900 hover:bg-red-100 border border-red-300 shadow-none font-bold text-[10px]">
        REJECTED
      </Badge>
    )
  return <Badge variant="outline" className="text-slate-600 text-[10px]">{status}</Badge>
}
