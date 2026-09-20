import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { resourcesApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useTranslation } from '@/lib/i18n'
import {
  Wrench,
  Users,
  Truck,
  HardHat,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  Filter,
  Activity,
  Layers,
  Zap,
  Gauge,
  Radio,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Resource } from '@/types'

export function Resources() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('ALL')

  const { data: resourcesData, isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: () => resourcesApi.list(),
    refetchInterval: 30000,
  })

  const resources: Resource[] = (resourcesData?.items as Resource[]) || [
    {
      id: 'res-g01',
      name: 'P-Way Maintenance Gang No. 102 (Track & Sleepers)',
      type: 'LABOUR_GANG',
      strength: 18,
      depot: 'Kalyan (KYN) Engineering Depot',
      division: 'Central Railway — Mumbai',
      section_id: 'sec-005',
      is_available: true,
      current_task_id: null,
    },
    {
      id: 'res-g02',
      name: 'TRD Catenary Traction Squad No. 4 (25kV OHE)',
      type: 'SPECIALIST_GANG',
      strength: 12,
      depot: 'Thane (TNA) Traction Depot',
      division: 'Central Railway — Mumbai',
      section_id: 'sec-005',
      is_available: false,
      current_task_id: 'tsk-003',
    },
    {
      id: 'res-m01',
      name: 'Plasser CSM-09 Heavy Continuous Tamping Machine',
      type: 'TRACK_MACHINE',
      strength: 4,
      depot: 'Lonavala (LNL) Machine Siding',
      division: 'Central Railway — Pune',
      section_id: 'sec-008',
      is_available: true,
      current_task_id: null,
    },
    {
      id: 'res-v01',
      name: '8-Wheeler Self-Propelled OHE Tower Wagon TW-44',
      type: 'SPECIAL_VEHICLE',
      strength: 6,
      depot: 'Kurla (CLA) TRD Shed',
      division: 'Central Railway — Mumbai',
      section_id: 'sec-003',
      is_available: true,
      current_task_id: null,
    },
    {
      id: 'res-g03',
      name: 'Signal & Telecom Testing Squad No. 8 (Kavach/ATP)',
      type: 'SPECIALIST_GANG',
      strength: 8,
      depot: 'Dadar (DR) S&T Workshop',
      division: 'Central Railway — Mumbai',
      section_id: 'sec-006',
      is_available: true,
      current_task_id: null,
    },
    {
      id: 'res-m02',
      name: 'USFD Ultrasonic Dual-Rail Flaw Detection Squad',
      type: 'SPECIALIST_GANG',
      strength: 5,
      depot: 'Kanpur Central (CNB) Testing Lab',
      division: 'North Central Railway — Prayagraj',
      section_id: 'sec-101',
      is_available: true,
      current_task_id: null,
    },
    {
      id: 'res-m03',
      name: 'Plasser Dynamic Track Stabilizer DTS-300',
      type: 'TRACK_MACHINE',
      strength: 3,
      depot: 'Vadodara (BRC) Track Machine Depot',
      division: 'Western Railway — Vadodara',
      section_id: 'sec-204',
      is_available: false,
      current_task_id: 'tsk-201',
    },
  ]

  const filtered = resources.filter((res) => {
    const matchesSearch =
      res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.depot.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'ALL' || res.type === typeFilter
    const matchesAvail =
      availabilityFilter === 'ALL' ||
      (availabilityFilter === 'AVAILABLE' && res.is_available) ||
      (availabilityFilter === 'ALLOCATED' && !res.is_available)
    return matchesSearch && matchesType && matchesAvail
  })

  const availableCount = resources.filter((r) => r.is_available).length
  const allocatedCount = resources.filter((r) => !r.is_available).length
  const totalStrength = resources.reduce((acc, r) => acc + (r.strength || 0), 0)

  return (
    <div className="flex-1 space-y-5 p-4 sm:p-6 overflow-auto bg-[#F4F6F9] min-h-[calc(100vh-4rem)] font-sans">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0B2545] text-amber-300 px-2.5 py-0.5 rounded">
              OPERATIONS FLEET • RESOURCES
            </span>
            <span className="text-xs text-slate-500 font-medium">Indian Railways Maintenance Squads & Heavy Plant</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B2545]">
            Operational Resource Allocation & Gang Fleet
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time readiness status for P-Way gangs, OHE tower wagons, ballast tampers, and USFD ultrasonic teams.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-mono text-xs px-3 py-1">
            {availableCount} Available for Blocks
          </Badge>
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-mono text-xs px-3 py-1">
            {allocatedCount} Active on Block
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Total Resource Units</p>
              <h3 className="text-xl font-black text-slate-900">{resources.length}</h3>
              <p className="text-[11px] text-slate-500">{totalStrength} Personnel on Duty</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Available Squads</p>
              <h3 className="text-xl font-black text-emerald-700">{availableCount}</h3>
              <p className="text-[11px] text-emerald-600 font-medium">Ready for Shadow Windows</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Allocated in Blocks</p>
              <h3 className="text-xl font-black text-amber-700">{allocatedCount}</h3>
              <p className="text-[11px] text-slate-500">Possessions in Progress</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-700 rounded-lg">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Heavy Plant & Wagons</p>
              <h3 className="text-xl font-black text-purple-700">
                {resources.filter((r) => r.type === 'TRACK_MACHINE' || r.type === 'SPECIAL_VEHICLE').length}
              </h3>
              <p className="text-[11px] text-slate-500">Tampers, Tower Cars & DTS</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search gang name, machine, depot, or resource ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#134074]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="h-3.5 w-3.5" />
            <span>Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Resource Types</option>
              <option value="LABOUR_GANG">Labour Gangs (P-Way)</option>
              <option value="SPECIALIST_GANG">Specialist Squads (TRD/S&T)</option>
              <option value="TRACK_MACHINE">Heavy Track Machines</option>
              <option value="SPECIAL_VEHICLE">Tower Wagons</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Status:</span>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ALLOCATED">Currently Allocated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((res) => {
          const isMachine = res.type === 'TRACK_MACHINE'
          const isVehicle = res.type === 'SPECIAL_VEHICLE'
          const isGang = res.type === 'LABOUR_GANG'

          return (
            <Card
              key={res.id}
              className={`border transition-all shadow-xs ${
                res.is_available ? 'bg-white border-slate-200' : 'bg-amber-50/30 border-amber-200'
              }`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-lg ${
                        isMachine
                          ? 'bg-purple-100 text-purple-700'
                          : isVehicle
                          ? 'bg-blue-100 text-blue-700'
                          : isGang
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isMachine ? (
                        <Gauge className="h-4 w-4" />
                      ) : isVehicle ? (
                        <Truck className="h-4 w-4" />
                      ) : (
                        <HardHat className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-500">{res.id}</span>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">{res.name}</h4>
                    </div>
                  </div>

                  <Badge
                    className={
                      res.is_available
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]'
                        : 'bg-amber-100 text-amber-800 border-amber-300 text-[10px]'
                    }
                  >
                    {res.is_available ? 'AVAILABLE' : 'IN BLOCK'}
                  </Badge>
                </div>

                <div className="text-[11px] text-slate-600 space-y-1.5 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Depot Base:</span>
                    <span className="font-medium text-slate-800">{res.depot}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Operational Division:</span>
                    <span className="font-medium text-slate-800">{res.division || 'Central Railway'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Crew Strength:</span>
                    <span className="font-mono font-bold text-slate-800">{res.strength} Staff</span>
                  </div>
                  {res.current_task_id && (
                    <div className="flex items-center justify-between bg-amber-100/60 p-1.5 rounded text-[11px]">
                      <span className="text-amber-800 font-semibold">Active Work Order:</span>
                      <span className="font-mono font-bold text-amber-900">{res.current_task_id}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {res.is_available ? 'Ready for CP-SAT automated assignment' : 'Assigned to active block schedule'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
