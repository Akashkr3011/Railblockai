import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { blocksApi, trainsApi, alertsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useTranslation } from '@/lib/i18n'
import { Tooltip } from '@/components/ui/Tooltip'
import {
  ChevronDown,
  ChevronUp,
  TableProperties,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  Train,
  CalendarDays,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  HardHat,
  Radio,
  Building2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function CornerSlideTable() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'blocks' | 'trains' | 'alerts'>('blocks')
  const [searchQuery, setSearchQuery] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const { user } = useAuth()
  const { t } = useTranslation()

  const { data: blocksData, refetch: refetchBlocks, isFetching: isBlocksFetching } = useQuery({
    queryKey: ['corner-blocks'],
    queryFn: () => blocksApi.list(),
    refetchInterval: 20000,
  })

  const { data: trainsData, refetch: refetchTrains, isFetching: isTrainsFetching } = useQuery({
    queryKey: ['corner-trains'],
    queryFn: () => trainsApi.list(),
    refetchInterval: 15000,
  })

  const { data: alertsData, refetch: refetchAlerts, isFetching: isAlertsFetching } = useQuery({
    queryKey: ['corner-alerts'],
    queryFn: () => alertsApi.list(),
    refetchInterval: 25000,
  })

  const blocks = blocksData?.items || []
  const trains = trainsData?.items || []
  const alerts = alertsData?.items || []

  const handleRefresh = () => {
    refetchBlocks()
    refetchTrains()
    refetchAlerts()
  }

  // Filter items
  const filteredBlocks = blocks.filter((b: any) =>
    (b.section_name || b.section_id || b.department || b.block_type || '')
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  )

  const filteredTrains = trains.filter((t: any) =>
    (t.train_number || t.train_name || t.zone || t.corridor || '')
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  )

  const filteredAlerts = alerts.filter((a: any) =>
    (a.title || a.location || a.severity || a.category || '')
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="fixed bottom-3 right-3 z-40 font-sans select-none print:hidden">
      {/* Closed State Floating Trigger Button */}
      {!isOpen && (
        <Tooltip content={t('tt.corner_table', 'Click to slide open live multi-corridor railway operations monitor')} position="left">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-[#0B2545] hover:bg-[#134074] text-white rounded-lg shadow-2xl border-2 border-amber-400/80 transition-all duration-200 hover:scale-105 active:scale-95 group cursor-pointer"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <TableProperties className="h-4 w-4 text-amber-300 group-hover:rotate-12 transition-transform" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold tracking-wide uppercase flex items-center gap-1.5 text-amber-200">
                {t('cst.title', 'Live Operations Monitor')}
              </span>
              <span className="text-[10px] text-slate-300 font-mono">
                {blocks.length} Blocks • {trains.length} Trains
              </span>
            </div>
            <ChevronUp className="h-4 w-4 text-amber-300 ml-1 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </Tooltip>
      )}

      {/* Slide-In Open Drawer Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`bg-white rounded-xl shadow-2xl border-2 border-[#134074] flex flex-col overflow-hidden transition-all duration-300 ${
              isExpanded
                ? 'w-[95vw] md:w-[880px] h-[85vh] max-h-[750px]'
                : 'w-[92vw] sm:w-[480px] md:w-[580px] h-[480px]'
            }`}
          >
            {/* Header Strip */}
            <div className="bg-[#0B2545] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-amber-400">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded bg-[#134074] border border-amber-400/40 flex items-center justify-center">
                  <TableProperties className="h-4 w-4 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold tracking-wide text-white uppercase font-sans">
                      {t('cst.title', 'Corner Live Operations Monitor')}
                    </h3>
                    <Badge className="bg-emerald-600/90 text-white text-[9px] py-0 px-1.5 font-mono">
                      LIVE NROC
                    </Badge>
                  </div>
                  <p className="text-[10px] text-blue-200 font-mono">
                    Role Clearance: {user?.role || 'ALL_DEPARTMENTS'}
                  </p>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-1">
                <Tooltip content="Refresh live operational data" position="bottom">
                  <button
                    onClick={handleRefresh}
                    className="p-1.5 text-blue-200 hover:text-white hover:bg-[#134074] rounded transition-colors"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${
                        isBlocksFetching || isTrainsFetching || isAlertsFetching ? 'animate-spin text-amber-300' : ''
                      }`}
                    />
                  </button>
                </Tooltip>

                <Tooltip content={isExpanded ? 'Restore default size' : 'Expand full width'} position="bottom">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1.5 text-blue-200 hover:text-white hover:bg-[#134074] rounded transition-colors hidden sm:inline-flex"
                  >
                    {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                  </button>
                </Tooltip>

                <Tooltip content="Slide table into corner" position="bottom">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-amber-300 hover:text-white hover:bg-[#134074] rounded transition-colors ml-1"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Navigation Tabs & Search */}
            <div className="bg-slate-100 p-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-lg">
                <Tooltip content="View active and proposed track possessions" position="top">
                  <button
                    onClick={() => setActiveTab('blocks')}
                    className={`px-3 py-1.5 rounded-md font-bold text-[11px] transition-all duration-150 flex items-center gap-1.5 ${
                      activeTab === 'blocks'
                        ? 'bg-[#0B2545] text-amber-300 shadow-sm'
                        : 'text-slate-600 hover:text-[#0B2545] hover:bg-slate-300/50'
                    }`}
                  >
                    <CalendarDays className="h-3 w-3" />
                    <span>{t('cst.blocks', 'Active Blocks')}</span>
                    <span className="text-[9px] bg-slate-900/30 px-1 rounded-full font-mono">
                      {blocks.length}
                    </span>
                  </button>
                </Tooltip>

                <Tooltip content="View live trains running on national network" position="top">
                  <button
                    onClick={() => setActiveTab('trains')}
                    className={`px-3 py-1.5 rounded-md font-bold text-[11px] transition-all duration-150 flex items-center gap-1.5 ${
                      activeTab === 'trains'
                        ? 'bg-[#0B2545] text-amber-300 shadow-sm'
                        : 'text-slate-600 hover:text-[#0B2545] hover:bg-slate-300/50'
                    }`}
                  >
                    <Train className="h-3 w-3" />
                    <span>{t('cst.trains', 'Train Delays')}</span>
                    <span className="text-[9px] bg-slate-900/30 px-1 rounded-full font-mono">
                      {trains.length}
                    </span>
                  </button>
                </Tooltip>

                <Tooltip content="Inspect active speed restrictions and safety alerts" position="top">
                  <button
                    onClick={() => setActiveTab('alerts')}
                    className={`px-3 py-1.5 rounded-md font-bold text-[11px] transition-all duration-150 flex items-center gap-1.5 ${
                      activeTab === 'alerts'
                        ? 'bg-[#A6192E] text-white shadow-sm'
                        : 'text-slate-600 hover:text-[#A6192E] hover:bg-slate-300/50'
                    }`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    <span>{t('cst.alerts', 'Safety Alerts')}</span>
                    <span className="text-[9px] bg-slate-900/30 px-1 rounded-full font-mono">
                      {alerts.length}
                    </span>
                  </button>
                </Tooltip>
              </div>

              {/* Live Search Input */}
              <div className="relative flex-1 min-w-[140px] max-w-[200px]">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter table..."
                  className="w-full pl-8 pr-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0B2545]"
                />
              </div>
            </div>

            {/* Table Content Area */}
            <div className="flex-1 overflow-auto p-3 text-xs bg-slate-50">
              {/* TAB 1: BLOCKS */}
              {activeTab === 'blocks' && (
                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0B2545]/5 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Block ID</th>
                        <th className="p-2.5">Corridor / Section</th>
                        <th className="p-2.5">Duration</th>
                        <th className="p-2.5">Dept</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {filteredBlocks.map((blk: any) => (
                        <tr key={blk.id} className="hover:bg-blue-50/50 transition-colors">
                          <td className="p-2.5 font-mono font-bold text-[#0B2545]">{blk.id}</td>
                          <td className="p-2.5">
                            <div className="font-semibold text-slate-800">{blk.section_name}</div>
                            <div className="text-[9px] text-slate-500 font-mono">
                              {blk.zone || 'NR'} • {blk.corridor || 'NDLS-HWH'}
                            </div>
                          </td>
                          <td className="p-2.5 font-mono">
                            {blk.requested_duration_hours || 2.5} hrs
                          </td>
                          <td className="p-2.5">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[9px] font-bold">
                              {blk.department}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <Badge
                              className={`text-[9px] font-bold ${
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
                          <td className="p-2.5 text-right">
                            {user?.role === 'ADMIN' && (blk.status === 'PROPOSED' || blk.status === 'PENDING_APPROVAL') ? (
                              <span className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer">
                                Sanction
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#134074] font-medium">Logged</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredBlocks.length === 0 && (
                    <div className="p-6 text-center text-slate-400 text-xs font-sans">
                      No matching maintenance blocks found.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: TRAINS */}
              {activeTab === 'trains' && (
                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0B2545]/5 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Train No / Name</th>
                        <th className="p-2.5">Type & Zone</th>
                        <th className="p-2.5">Route</th>
                        <th className="p-2.5">Speed</th>
                        <th className="p-2.5">Delay Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {filteredTrains.map((tr: any) => (
                        <tr key={tr.id || tr.train_number} className="hover:bg-blue-50/50 transition-colors">
                          <td className="p-2.5">
                            <div className="font-bold text-[#0B2545] font-mono">{tr.train_number}</div>
                            <div className="text-[10px] text-slate-700 font-medium truncate max-w-[140px]">
                              {tr.train_name}
                            </div>
                          </td>
                          <td className="p-2.5">
                            <div className="font-mono text-[10px] font-bold text-slate-800">{tr.zone || 'NR'}</div>
                            <span className="text-[9px] text-slate-500">{tr.type || 'SUPERFAST'}</span>
                          </td>
                          <td className="p-2.5 text-[10px] text-slate-600 font-mono">
                            {tr.origin} → {tr.destination}
                          </td>
                          <td className="p-2.5 font-mono text-[10px]">
                            {tr.speed_kmh || 110} km/h
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                                (tr.delay_minutes || 0) > 15
                                  ? 'bg-rose-100 text-rose-800'
                                  : (tr.delay_minutes || 0) > 0
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {(tr.delay_minutes || 0) === 0 ? 'RT (Right Time)' : `+${tr.delay_minutes} min`}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredTrains.length === 0 && (
                    <div className="p-6 text-center text-slate-400 text-xs font-sans">
                      No matching train movements found.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ALERTS */}
              {activeTab === 'alerts' && (
                <div className="space-y-2">
                  {filteredAlerts.map((al: any) => (
                    <div
                      key={al.id}
                      className={`p-2.5 rounded-lg border flex items-start gap-2.5 ${
                        al.severity === 'CRITICAL'
                          ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                          : 'bg-amber-50/70 border-amber-200 text-amber-950'
                      }`}
                    >
                      <AlertTriangle
                        className={`h-4 w-4 shrink-0 mt-0.5 ${
                          al.severity === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{al.title || 'Track Caution Alert'}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/80 font-bold">
                            {al.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 mt-0.5">{al.description || al.message}</p>
                        <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                          <span>Location: {al.location || 'Section MP 42/10'}</span>
                          <span>Timestamp: {al.created_at || '10 mins ago'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredAlerts.length === 0 && (
                    <div className="p-6 text-center text-slate-400 text-xs bg-white rounded-lg border border-slate-200">
                      No active critical track alerts reported.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Summary Strip */}
            <div className="p-2.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-mono">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>IR-CRIS Real-Time Telemetry Stream</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs text-[#0B2545] font-bold hover:underline cursor-pointer"
              >
                {t('cst.minimize', 'Minimize Table [ - ]')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
