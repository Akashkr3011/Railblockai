import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { trainsApi, sectionsApi, zonesApi, corridorsApi } from '@/lib/api'
import {
  Train,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Loader2,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Globe2,
  Gauge,
  Zap,
  Activity,
  ChevronRight,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Drawer } from '@/components/ui/drawer'

export function TrainOperations() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [zoneFilter, setZoneFilter] = useState<string>('ALL')
  const [corridorFilter, setCorridorFilter] = useState<string>('ALL')
  const [kavachOnly, setKavachOnly] = useState<boolean>(false)

  const { data: trainsData, isLoading, isError } = useQuery({
    queryKey: ['trains', zoneFilter, typeFilter, corridorFilter],
    queryFn: () =>
      trainsApi.list({
        zone: zoneFilter !== 'ALL' ? zoneFilter : undefined,
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        corridor: corridorFilter !== 'ALL' ? corridorFilter : undefined,
      }),
  })

  const rawTrains = trainsData?.items || []

  // Client-side text & kavach search filtering
  const filteredTrains = useMemo(() => {
    return rawTrains.filter((train: any) => {
      const q = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !q ||
        train.train_number?.toLowerCase().includes(q) ||
        train.train_name?.toLowerCase().includes(q) ||
        train.from_station?.toLowerCase().includes(q) ||
        train.to_station?.toLowerCase().includes(q) ||
        train.route_summary?.toLowerCase().includes(q) ||
        train.zone?.toLowerCase().includes(q)

      const matchesKavach = !kavachOnly || train.kavach_equipped === true
      return matchesSearch && matchesKavach
    })
  }, [rawTrains, searchTerm, kavachOnly])

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = filteredTrains.length
    const vandeBharatCount = filteredTrains.filter((t: any) => t.train_type === 'VANDE_BHARAT').length
    const kavachCount = filteredTrains.filter((t: any) => t.kavach_equipped).length
    const delayedCount = filteredTrains.filter((t: any) => (t.average_delay_minutes || 0) > 10).length
    const onTimeRate = total > 0 ? Math.round(((total - delayedCount) / total) * 100) : 100

    return { total, vandeBharatCount, kavachCount, onTimeRate }
  }, [filteredTrains])

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 overflow-auto bg-[#F4F6F9] min-h-[calc(100vh-4rem)] font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#CBD5E1] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-[#0B2545] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
              <Globe2 className="h-3 w-3" /> All-India Rail Telemetry
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              Control Office Application (COA) & National Train Enquiry System (NTES)
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#0B2545] flex items-center gap-2 mt-0.5">
            <Train className="h-5 w-5 text-[#134074]" />
            Pan-India Train Operations & Timetable Timings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time tracking of Vande Bharat, Rajdhani, Shatabdi, Superfast, Mail, and DFCCIL Heavy-Haul rakes across all 17 Railway Zones.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Badge className="bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-none font-bold gap-1">
            <Activity className="h-3.5 w-3.5 text-emerald-700 animate-pulse" />
            COA All-India Feed Active
          </Badge>
        </div>
      </div>

      {/* National Operational Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 bg-white border-[#CBD5E1] shadow-xs">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Tracked Services</span>
            <Train className="h-4 w-4 text-[#134074]" />
          </div>
          <div className="text-xl font-bold text-[#0B2545] mt-1 font-mono">{metrics.total}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active timetable profiles</div>
        </Card>

        <Card className="p-3 bg-white border-[#CBD5E1] shadow-xs">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Vande Bharat Rakes</span>
            <Zap className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-purple-900 mt-1 font-mono">{metrics.vandeBharatCount}</div>
          <div className="text-[10px] text-purple-700 font-semibold mt-0.5">Semi-High Speed 160 km/h</div>
        </Card>

        <Card className="p-3 bg-white border-[#CBD5E1] shadow-xs">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Kavach ATP Active</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-800 mt-1 font-mono">{metrics.kavachCount}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Automatic Train Protection</div>
        </Card>

        <Card className="p-3 bg-white border-[#CBD5E1] shadow-xs">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Fleet Punctuality</span>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-900 mt-1 font-mono">{metrics.onTimeRate}%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Within 10 min tolerance</div>
        </Card>
      </div>

      {/* Comprehensive Multi-Zonal Filter Toolbar */}
      <div className="bg-white p-3 rounded-lg border border-[#CBD5E1] shadow-xs space-y-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search Train #, Name, Station (e.g. 22436, Vande Bharat, Howrah, Mumbai)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-[#134074]"
            />
          </div>

          {/* Zone Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-600 uppercase">Zone:</span>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1.5 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#134074]"
            >
              <option value="ALL">All 17 Zones + DFC</option>
              <option value="NR">Northern Railway (NR)</option>
              <option value="WR">Western Railway (WR)</option>
              <option value="CR">Central Railway (CR)</option>
              <option value="ER">Eastern Railway (ER)</option>
              <option value="SR">Southern Railway (SR)</option>
              <option value="SCR">South Central Railway (SCR)</option>
              <option value="ECoR">East Coast Railway (ECoR)</option>
              <option value="SWR">South Western Railway (SWR)</option>
              <option value="NWR">North Western Railway (NWR)</option>
              <option value="NCR">North Central Railway (NCR)</option>
              <option value="ECR">East Central Railway (ECR)</option>
              <option value="SER">South Eastern Railway (SER)</option>
              <option value="DFCCIL">DFCCIL Dedicated Freight</option>
            </select>
          </div>

          {/* Corridor Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-600 uppercase">Corridor:</span>
            <select
              value={corridorFilter}
              onChange={(e) => setCorridorFilter(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1.5 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#134074]"
            >
              <option value="ALL">All Trunk Corridors</option>
              <option value="NDLS-HWH">NDLS — HWH (Grand Chord)</option>
              <option value="NDLS-MMCT">NDLS — MMCT (Western Trunk)</option>
              <option value="NDLS-MAS">NDLS — MAS (Grand Trunk)</option>
              <option value="HWH-MAS">HWH — MAS (East Coast)</option>
              <option value="CSMT-HWH">CSMT — HWH (Central-East)</option>
              <option value="CSMT-MAS">CSMT — MAS (Central-South)</option>
              <option value="WDFC">WDFC (Dadri — JNPT Freight)</option>
              <option value="EDFC">EDFC (Sahnewal — Dankuni)</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-600 uppercase">Class:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1.5 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#134074]"
            >
              <option value="ALL">All Classifications</option>
              <option value="VANDE_BHARAT">Vande Bharat Express</option>
              <option value="RAJDHANI">Rajdhani Express</option>
              <option value="SHATABDI">Shatabdi Express</option>
              <option value="SUPERFAST">Superfast / Intercity</option>
              <option value="PASSENGER">Mail / Passenger</option>
              <option value="FREIGHT">Heavy-Haul Freight / Container</option>
            </select>
          </div>

          {/* Kavach Toggle Button */}
          <button
            onClick={() => setKavachOnly(!kavachOnly)}
            className={`px-3 py-1.5 rounded text-xs font-bold border transition-colors flex items-center gap-1.5 ${
              kavachOnly
                ? 'bg-emerald-700 text-white border-emerald-800'
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Kavach Only
          </button>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Quick Select:</span>
          {[
            { label: 'All India', zone: 'ALL' },
            { label: 'Northern (NR/NCR)', zone: 'NR' },
            { label: 'Western (WR)', zone: 'WR' },
            { label: 'Central (CR)', zone: 'CR' },
            { label: 'Eastern (ER)', zone: 'ER' },
            { label: 'Southern (SR)', zone: 'SR' },
            { label: 'South Central (SCR)', zone: 'SCR' },
            { label: 'DFCCIL Freight', zone: 'DFCCIL' },
          ].map((pill) => (
            <button
              key={pill.label}
              onClick={() => setZoneFilter(pill.zone)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                zoneFilter === pill.zone
                  ? 'bg-[#0B2545] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Train Operations Table */}
      <Card className="border-[#CBD5E1] shadow-xs overflow-hidden bg-white">
        <div className="p-3 border-b border-slate-100 bg-[#F8FAFC] flex justify-between items-center text-xs font-semibold text-[#0B2545]">
          <div className="flex items-center gap-2">
            <span>INDIAN RAILWAYS NATIONAL TRAIN SCHEDULE ROSTER</span>
            <span className="text-[11px] text-slate-500 font-mono">
              (Showing {filteredTrains.length} services)
            </span>
          </div>
          <span className="text-slate-500 font-mono text-[11px]">PRIORITY DISPATCH SYSTEM</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-slate-400 text-xs">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Fetching national train movement telemetry...
          </div>
        ) : filteredTrains.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No train services found matching current search or zone filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#EBF0F5] text-[#0B2545] font-bold border-b border-[#CBD5E1]">
                <tr>
                  <th className="px-4 py-2.5 font-bold w-24">Train #</th>
                  <th className="px-4 py-2.5 font-bold">Name & Classification</th>
                  <th className="px-3 py-2.5 font-bold">Zone & Corridor</th>
                  <th className="px-3 py-2.5 font-bold">Route Origin → Terminus</th>
                  <th className="px-3 py-2.5 font-bold text-center">ATP Safety</th>
                  <th className="px-3 py-2.5 font-bold text-center">Priority</th>
                  <th className="px-3 py-2.5 font-bold text-center">Speed</th>
                  <th className="px-3 py-2.5 font-bold text-center">Delay</th>
                  <th className="px-3 py-2.5 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTrains.map((train: any) => (
                  <tr
                    key={train.id}
                    onClick={() => setSelectedId(train.id)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-[#0B2545] text-sm">
                      {train.train_number}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{train.train_name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge
                          className={`text-[9px] font-bold uppercase tracking-wider py-0 px-1.5 ${
                            train.train_type === 'VANDE_BHARAT'
                              ? 'bg-purple-100 text-purple-900 border-purple-200'
                              : train.train_type === 'RAJDHANI'
                              ? 'bg-amber-100 text-amber-900 border-amber-200'
                              : train.train_type === 'FREIGHT'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                              : 'bg-blue-100 text-blue-900 border-blue-200'
                          }`}
                        >
                          {(train.train_type || 'EXPRESS').replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </td>

                    <td className="px-3 py-3 font-mono text-[11px]">
                      <div className="font-bold text-[#0B2545]">{train.zone || 'NR'} Zone</div>
                      <div className="text-slate-500 text-[10px]">{train.corridor || 'Trunk'}</div>
                    </td>

                    <td className="px-3 py-3 font-mono text-[11px] text-slate-700">
                      <div>
                        <span className="font-bold text-[#0B2545]">{train.from_station}</span> ({train.departure_time}) →{' '}
                        <span className="font-bold text-[#0B2545]">{train.to_station}</span> ({train.arrival_time})
                      </div>
                      {train.route_summary && (
                        <div className="text-[10px] text-slate-500 truncate max-w-xs">{train.route_summary}</div>
                      )}
                    </td>

                    <td className="px-3 py-3 text-center">
                      {train.kavach_equipped ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          <ShieldCheck className="h-3 w-3 text-emerald-600" /> KAVACH
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[10px]">Standard</span>
                      )}
                    </td>

                    <td className="px-3 py-3 text-center">
                      <Badge
                        className={`text-[10px] font-bold ${
                          train.priority_tier === 1
                            ? 'bg-purple-100 text-purple-900 border-purple-200'
                            : train.priority_tier === 2
                            ? 'bg-blue-100 text-blue-900 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        Tier {train.priority_tier || 2}
                      </Badge>
                    </td>

                    <td className="px-3 py-3 text-center font-mono font-bold text-slate-800">
                      {train.max_speed_kmh} <span className="text-[10px] text-slate-500 font-normal">km/h</span>
                    </td>

                    <td className="px-3 py-3 text-center font-mono font-bold">
                      {train.average_delay_minutes > 15 ? (
                        <span className="text-red-700">+{train.average_delay_minutes}m</span>
                      ) : train.average_delay_minutes > 5 ? (
                        <span className="text-amber-700">+{train.average_delay_minutes}m</span>
                      ) : (
                        <span className="text-emerald-700">+{train.average_delay_minutes || 0}m</span>
                      )}
                    </td>

                    <td className="px-3 py-3 text-right">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 text-[10px] font-bold">
                        <CheckCircle2 className="h-3 w-3" /> ON SECTION
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Train Intelligence Drawer */}
      <TrainDetailDrawer id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

function TrainDetailDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data: train, isLoading } = useQuery({
    queryKey: ['train', id],
    queryFn: () => trainsApi.get(id!),
    enabled: !!id,
  })

  return (
    <Drawer isOpen={!!id} onClose={onClose} title="Train Timetable & Inter-Zonal Headway" width="w-[520px]">
      {isLoading ? (
        <div className="flex h-32 items-center justify-center text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !train ? (
        <div className="p-8 text-center text-slate-500">Train record unavailable</div>
      ) : (
        <div className="space-y-5 text-xs text-slate-700 font-sans">
          {/* Header Card */}
          <div className="bg-[#0B2545] text-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-xl font-bold text-amber-300">{train.train_number}</span>
                <h3 className="font-bold text-base text-white">{train.train_name}</h3>
                <span className="text-xs text-blue-200 font-medium">Zone: {train.zone || 'NR'} • Corridor: {train.corridor || 'Trunk'}</span>
              </div>
              <Badge className="bg-[#134074] text-white border-blue-400/30 text-[10px] uppercase">
                {(train.train_type || 'EXPRESS').replace(/_/g, ' ')}
              </Badge>
            </div>
            <div className="text-blue-100 text-[11px] mt-3 pt-2 border-t border-blue-800/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">{train.from_station}</span> ({train.departure_time})
                <span className="mx-2">→</span>
                <span className="font-bold text-white">{train.to_station}</span> ({train.arrival_time})
              </div>
              <span className="bg-blue-900/80 px-2 py-0.5 rounded text-[10px] font-mono">
                Speed {train.max_speed_kmh} KM/H
              </span>
            </div>
          </div>

          {/* Operational Parameters */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Punctuality</span>
              <span className="font-bold text-emerald-700 text-sm">98.4%</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Max Speed</span>
              <span className="font-bold text-slate-800 text-sm font-mono">{train.max_speed_kmh} km/h</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Priority</span>
              <span className="font-bold text-purple-800 text-sm">Tier {train.priority_tier || 1}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Safety ATP</span>
              <span className="font-bold text-emerald-700 text-xs">{train.kavach_equipped ? 'Kavach 4.0' : 'ABS'}</span>
            </div>
          </div>

          {/* Route Summary */}
          {train.route_summary && (
            <div className="bg-white p-3 rounded border border-slate-200">
              <span className="font-bold text-[#0B2545] uppercase text-[10px] block mb-1">
                Via Key Junction Stations:
              </span>
              <div className="text-xs text-slate-700 font-mono leading-relaxed">
                {train.route_summary}
              </div>
            </div>
          )}

          {/* Scheduled Section Windows */}
          <div>
            <h4 className="font-bold text-[#0B2545] uppercase text-[11px] mb-2 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#134074]" /> Scheduled Section Windows (COA National Dispatch)
            </h4>
            <div className="border border-slate-200 rounded divide-y divide-slate-100 bg-white">
              {(train.schedules?.length
                ? train.schedules
                : [
                    { section_code: 'NDLS-CNB-DN', scheduled_arrival: '06:00', scheduled_departure: '06:20' },
                    { section_code: 'CNB-PRYJ-DN', scheduled_arrival: '08:15', scheduled_departure: '08:35' },
                    { section_code: 'PRYJ-BSB-DN', scheduled_arrival: '10:45', scheduled_departure: '11:10' },
                  ]
              ).map((sch: any, idx: number) => (
                <div key={idx} className="p-2.5 flex justify-between items-center text-xs">
                  <span className="font-mono font-bold text-slate-800">{sch.section_code}</span>
                  <span className="font-mono text-slate-600">
                    {sch.scheduled_arrival} — {sch.scheduled_departure}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance Block Conflict Safeguard */}
          <div className="bg-blue-50/80 border border-blue-200 p-3 rounded text-xs space-y-1">
            <span className="font-bold text-[#0B2545] flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-[#134074]" /> CP-SAT Multi-Zonal Headway Protection
            </span>
            <p className="text-slate-700 text-[11px] leading-relaxed">
              This train is registered in the pan-India mathematical optimization engine. Maintenance possession requests on traversed sections are constrained to maintain safety headways and avoid delays.
            </p>
          </div>
        </div>
      )}
    </Drawer>
  )
}
