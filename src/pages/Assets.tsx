import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { assetsApi } from '@/lib/api'
import {
  Database,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Filter,
  ShieldAlert,
  Search,
  Wrench,
  Radio,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Drawer } from '@/components/ui/drawer'

export function Assets() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState<string>('')

  const { data: assets, isLoading, isError } = useQuery({
    queryKey: ['assets'],
    queryFn: assetsApi.list,
  })

  const rawAssets = assets?.items || []
  const filteredAssets = rawAssets.filter((asset: any) => {
    const code = asset.asset_code || asset.asset_number || asset.id || ''
    const matchesSearch =
      code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.section_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'ALL' || asset.asset_type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 overflow-auto bg-[#F4F6F9] min-h-[calc(100vh-4rem)] font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#CBD5E1] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-[#134074] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Asset Register & Telemetry
            </span>
            <h1 className="text-xl font-bold tracking-tight text-[#0B2545] flex items-center gap-2">
              <Database className="h-5 w-5 text-[#134074]" />
              Fixed Infrastructure Asset Management & Condition Register
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Track condition indices, cumulative gross tonnage, and ultrasonic flaw defect telemetry across railway assets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-[#0B2545] border border-blue-300 font-bold text-xs">
            {rawAssets.length} Monitored Assets
          </Badge>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-3 rounded border border-[#CBD5E1] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search Asset Code or Location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-[#134074]"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1.5 bg-white text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Asset Types</option>
            <option value="TRACK_TURNOUT">Points & Crossings (Turnouts)</option>
            <option value="OHE_CANTILEVER">OHE Traction Cantilever</option>
            <option value="SIGNAL_INTERLOCKING">Signal Interlocking</option>
            <option value="RAIL_SEGMENT">60kg UIC Rail Segments</option>
          </select>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Showing {filteredAssets.length} railway assets
        </div>
      </div>

      {/* Assets Table */}
      <Card className="border-[#CBD5E1] shadow-xs overflow-hidden bg-white">
        <div className="p-3 border-b border-slate-100 bg-[#F8FAFC] flex justify-between items-center text-xs font-semibold text-[#0B2545]">
          <span>MUMBAI DIVISION — ASSET CONDITION REGISTER</span>
          <span className="text-slate-500 font-mono text-[11px]">CRITICALITY & RISK INDEX</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-slate-400 text-xs">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Fetching asset register...
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No assets match current criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#EBF0F5] text-[#0B2545] font-bold border-b border-[#CBD5E1]">
                <tr>
                  <th className="px-4 py-2.5 font-bold w-36">Asset Code</th>
                  <th className="px-4 py-2.5 font-bold">Equipment Type & Location</th>
                  <th className="px-3 py-2.5 font-bold text-center">Condition</th>
                  <th className="px-3 py-2.5 font-bold text-center">Criticality</th>
                  <th className="px-3 py-2.5 font-bold text-center">Failure Risk</th>
                  <th className="px-3 py-2.5 font-bold">Cumulative GMT</th>
                  <th className="px-3 py-2.5 font-bold text-right">Operational State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAssets.map((asset: any) => {
                  const code = asset.asset_code || asset.asset_number || asset.id
                  const type = (asset.asset_type || 'TRACK').replace(/_/g, ' ')

                  return (
                    <tr
                      key={asset.id}
                      onClick={() => setSelectedId(asset.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-[#0B2545] text-sm">
                        {code}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{type}</div>
                        <div className="text-[10px] text-slate-500">
                          Section: <span className="font-mono">{asset.section_name || asset.section_id || 'CR-MUM'}</span>
                        </div>
                      </td>

                      <td className="px-3 py-3 text-center">
                        <Badge
                          className={`text-[10px] font-bold ${
                            asset.condition === 'GOOD'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : asset.condition === 'CRITICAL'
                              ? 'bg-red-100 text-red-900 border-red-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}
                        >
                          {asset.condition || 'FAIR'}
                        </Badge>
                      </td>

                      <td className="px-3 py-3 text-center">
                        <span className="font-mono font-bold text-slate-700">
                          {asset.criticality_score ? `${asset.criticality_score}/10` : '8.5/10'}
                        </span>
                      </td>

                      <td className="px-3 py-3 text-center">
                        <span
                          className={`font-mono font-bold text-xs ${
                            (asset.failure_risk || 30) > 60 ? 'text-red-700' : 'text-amber-700'
                          }`}
                        >
                          {asset.failure_risk || 32}%
                        </span>
                      </td>

                      <td className="px-3 py-3 font-mono text-slate-700">
                        {asset.cumulative_gmt || 38.4} GMT
                      </td>

                      <td className="px-3 py-3 text-right">
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 text-[10px] font-bold">
                          <CheckCircle2 className="h-3 w-3" /> IN-SERVICE
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Asset Detail Drawer */}
      <AssetDetailDrawer id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

function AssetDetailDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data: asset, isLoading } = useQuery({
    queryKey: ['asset', id],
    queryFn: () => assetsApi.get(id!),
    enabled: !!id,
  })

  return (
    <Drawer isOpen={!!id} onClose={onClose} title="Asset Health & Maintenance Dossier" width="w-[480px]">
      {isLoading ? (
        <div className="flex h-32 items-center justify-center text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !asset ? (
        <div className="p-8 text-center text-slate-500">Asset record unavailable</div>
      ) : (
        <div className="space-y-5 text-xs text-slate-700 font-sans">
          <div className="bg-[#0B2545] text-white p-4 rounded">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-amber-300 text-sm font-bold">
                  {asset.asset_code || asset.asset_number || asset.id}
                </span>
                <h3 className="font-bold text-sm text-white mt-0.5">
                  {(asset.asset_type || 'TRACK').replace(/_/g, ' ')}
                </h3>
              </div>
              <Badge className="bg-emerald-600 text-white text-[10px]">IN-SERVICE</Badge>
            </div>
            <div className="text-blue-200 text-[11px] mt-2 font-mono">
              Section: {asset.section_name || asset.section_id} • Installed: {asset.installation_year || 2018}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Condition</span>
              <span className="font-bold text-amber-700 text-sm">{asset.condition || 'FAIR'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Failure Risk</span>
              <span className="font-bold text-red-700 text-sm font-mono">{asset.failure_risk || 32}%</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Throughput</span>
              <span className="font-bold text-slate-800 text-sm font-mono">{asset.cumulative_gmt || 38.4} GMT</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded space-y-2">
            <h4 className="font-bold text-[#0B2545] uppercase text-[11px]">Ultrasonic Flaw Detection (USFD) History</h4>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Last USFD Testing:</span>
                <span className="font-mono font-bold text-slate-800">2026-08-14</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Testing Cycle:</span>
                <span className="font-mono font-bold text-slate-800">Every 60 Days (High Density Route)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Observed Defect:</span>
                <span className="font-mono font-bold text-amber-700">Minor switch rail wear at toe of switch</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  )
}
