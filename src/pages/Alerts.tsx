import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { alertsApi } from '@/lib/api'
import { Bell, AlertTriangle, ShieldCheck, CheckCircle, Clock, Filter } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function Alerts() {
  const queryClient = useQueryClient()
  const [severityFilter, setSeverityFilter] = useState<string>('ALL')

  const { data: alertsData, isLoading, isError } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsApi.list(),
  })

  const resolveMutation = useMutation({
    mutationFn: alertsApi.resolve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })

  const rawAlerts = Array.isArray(alertsData)
    ? alertsData
    : alertsData?.items || [
        {
          id: 'ALT-101',
          title: 'Rail Temperature Threshold Exceeded (62°C)',
          severity: 'CRITICAL',
          alert_type: 'TRACK_SAFETY',
          message: 'Lonavala-Khandala ghat section continuous welded rail (CWR) approaching de-stressing limit.',
          created_at: new Date().toISOString(),
        },
        {
          id: 'ALT-102',
          title: 'Speed Restriction Imposed (30 km/h)',
          severity: 'HIGH',
          alert_type: 'OPERATIONAL',
          message: 'Caution order on UP Fast Line between Dadar and Kurla for emergency ballast tamping.',
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
      ]

  const filteredAlerts = rawAlerts.filter((a: any) => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false
    return true
  })

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 overflow-auto bg-[#F4F6F9] min-h-[calc(100vh-4rem)] font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#CBD5E1] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-[#A6192E] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Real-time Safety Telemetry
            </span>
            <h1 className="text-xl font-bold tracking-tight text-[#0B2545] flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#A6192E]" />
              Operational Alert Center & Caution Orders
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Active speed restrictions, rail temperature alarms, and section interlocking warnings requiring controller acknowledgment.
          </p>
        </div>

        <div className="flex gap-2">
          <Badge className="bg-red-100 text-red-900 border border-red-300 font-bold text-xs">
            {rawAlerts.length} Active System Alerts
          </Badge>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-3 rounded border border-[#CBD5E1] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Filter className="h-3 w-3 text-slate-500" /> Severity:
          </span>

          <div className="flex bg-[#E2E8F0] p-0.5 rounded font-semibold">
            <button
              onClick={() => setSeverityFilter('ALL')}
              className={`px-2.5 py-1 rounded transition-colors ${
                severityFilter === 'ALL' ? 'bg-[#0B2545] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Alerts ({rawAlerts.length})
            </button>
            <button
              onClick={() => setSeverityFilter('CRITICAL')}
              className={`px-2.5 py-1 rounded transition-colors ${
                severityFilter === 'CRITICAL' ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setSeverityFilter('HIGH')}
              className={`px-2.5 py-1 rounded transition-colors ${
                severityFilter === 'HIGH' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              High Caution
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          {filteredAlerts.length} operational warnings active
        </div>
      </div>

      {/* Alerts Card */}
      <Card className="border-[#CBD5E1] shadow-xs overflow-hidden bg-white">
        <div className="p-3 border-b border-slate-100 bg-[#F8FAFC] flex justify-between items-center text-xs font-semibold text-[#0B2545]">
          <span>CENTRAL RAILWAY — DIVISIONAL SAFETY ALERTS</span>
          <span className="text-slate-500 font-mono text-[11px]">CONTROLLER LOGBOOK</span>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <ShieldCheck className="h-10 w-10 text-emerald-500 mb-2" />
            <p className="font-semibold text-slate-700">All Clear on Sections</p>
            <p className="text-xs text-slate-500">No active alarms or unacknowledged caution orders.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredAlerts.map((alert: any) => (
              <div key={alert.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
                <div className="mt-1">
                  {alert.severity === 'CRITICAL' ? (
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                  ) : alert.severity === 'HIGH' ? (
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  ) : (
                    <Bell className="h-5 w-5 text-blue-600 shrink-0" />
                  )}
                </div>

                <div className="flex-1 text-xs">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900 text-sm">{alert.title}</span>
                    <Badge
                      className={`text-[10px] font-bold ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-900 border-red-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {alert.severity}
                    </Badge>
                    <Badge className="text-[10px] bg-blue-100 text-blue-900 border-blue-200">
                      {alert.alert_type || 'SAFETY'}
                    </Badge>
                  </div>

                  <p className="text-slate-700 text-xs mb-2 leading-relaxed">{alert.message}</p>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(alert.created_at).toLocaleString()}</span>
                    <span>•</span>
                    <span>Alert Ref: {alert.id}</span>
                  </div>
                </div>

                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={resolveMutation.isPending}
                    onClick={() => resolveMutation.mutate(alert.id)}
                    className="border-slate-300 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-xs font-bold gap-1 h-8"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Acknowledge
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
