import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { auditApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { Shield, Clock, CheckCircle2, User, KeyRound, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function Audit() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: auditData, isLoading } = useQuery({
    queryKey: ['audit'],
    queryFn: () => auditApi.list(),
    enabled: user?.role === 'ADMIN',
  })

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-[#F4F6F9]">
        <Card className="max-w-md w-full p-6 text-center bg-white border-red-200 shadow-lg space-y-4">
          <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Access Restricted by RBAC Policy</h2>
            <p className="text-xs text-slate-500 mt-1">
              Safety and cryptographic audit logs are restricted exclusively to Senior DOM Administration accounts under CRIS security guidelines.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded text-xs text-slate-600 font-mono">
            Current role: <strong className="text-slate-900">{user?.role}</strong> (Permission Denied)
          </div>
          <Button
            onClick={() => navigate('/')}
            className="w-full bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-semibold gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Return to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  const rawAudit = Array.isArray(auditData) ? auditData : auditData?.items || []

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 overflow-auto bg-[#F4F6F9] min-h-[calc(100vh-4rem)] font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#CBD5E1] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-[#134074] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Compliance & Security
            </span>
            <h1 className="text-xl font-bold tracking-tight text-[#0B2545] flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#134074]" />
              Immutable Safety Audit Log & Decision Trail
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically sealed journal of officer sanctions, CP-SAT solver executions, and interlocking overrides.
          </p>
        </div>

        <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 font-bold text-xs gap-1">
          <KeyRound className="h-3 w-3" /> Strict RBAC & Digital Signatures Active
        </Badge>
      </div>

      {/* Audit Table */}
      <Card className="border-[#CBD5E1] shadow-xs overflow-hidden bg-white">
        <div className="p-3 border-b border-slate-100 bg-[#F8FAFC] flex justify-between items-center text-xs font-semibold text-[#0B2545]">
          <span>CENTRAL RAILWAY — DIVISIONAL AUDIT REGISTER</span>
          <span className="text-slate-500 font-mono text-[11px]">IMMUTABLE CHRONICLE</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading tamper-evident audit records...
          </div>
        ) : rawAudit.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No audit records logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#EBF0F5] text-[#0B2545] font-bold border-b border-[#CBD5E1]">
                <tr>
                  <th className="px-4 py-2.5 font-bold w-40">Timestamp</th>
                  <th className="px-4 py-2.5 font-bold">Action / Event</th>
                  <th className="px-4 py-2.5 font-bold">Officer / System Principal</th>
                  <th className="px-4 py-2.5 font-bold">Target Entity</th>
                  <th className="px-4 py-2.5 font-bold">Audit Chronicle Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rawAudit.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-xs text-[#0B2545]">
                      <Badge className="bg-blue-50 text-[#0B2545] border-blue-200 font-bold text-[10px]">
                        {log.action}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {log.user}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-xs">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                        {log.entity_type}: {log.entity_id}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
