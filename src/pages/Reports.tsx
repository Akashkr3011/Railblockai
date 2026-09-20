import { useQuery } from '@tanstack/react-query'
import { maintenanceApi, blocksApi, trainsApi, sectionsApi } from '@/lib/api'
import { FileText, Printer, Download, CheckCircle2, ShieldCheck, Calendar, Building2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function Reports() {
  const { data: maintenance } = useQuery<{ items: any[]; total: number }>({ queryKey: ['maintenance'], queryFn: () => maintenanceApi.list() })
  const { data: blocks } = useQuery<{ items: any[]; total: number }>({ queryKey: ['blocks'], queryFn: () => blocksApi.list() })
  const { data: trains } = useQuery<{ items: any[]; total: number }>({ queryKey: ['trains'], queryFn: () => trainsApi.list() })
  const { data: sections } = useQuery<{ items: any[]; total: number }>({ queryKey: ['sections'], queryFn: () => sectionsApi.list() })

  const rawBlocks = blocks?.items || []
  const rawTasks = maintenance?.items || []
  const approvedBlocks = rawBlocks.filter((b: any) => b.status === 'APPROVED')
  const totalApprovedHours = approvedBlocks.reduce((acc: number, b: any) => acc + (b.requested_duration_hours || 0), 0)

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadCSV = () => {
    const headers = ['Block_ID', 'Type', 'Section', 'Department', 'Duration_Hours', 'Status', 'Start_Time', 'End_Time']
    const rows = rawBlocks.map((b: any) => [
      b.id,
      b.block_type,
      b.section_name || b.section_id,
      b.department || 'CIVIL',
      b.requested_duration_hours,
      b.status,
      b.start_time,
      b.end_time,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'CR_MUM_Block_Schedule_2026.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 overflow-auto bg-[#F4F6F9] min-h-[calc(100vh-4rem)] font-sans print:p-0 print:bg-white">
      {/* Non-print control bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#CBD5E1] pb-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-[#134074] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Official Administration Gazette
            </span>
            <h1 className="text-xl font-bold tracking-tight text-[#0B2545] flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#134074]" />
              Divisional Block Sanction Circular & Joint Safety Memorandum
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Formal engineering & operating circular generated according to Indian Railways Block Working Manual guidelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleDownloadCSV}
            variant="outline"
            className="border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold gap-1.5 h-8"
          >
            <Download className="h-3.5 w-3.5" /> Download CSV Roster
          </Button>

          <Button
            onClick={handlePrint}
            className="bg-[#134074] hover:bg-[#0B2545] text-white text-xs font-bold gap-1.5 h-8 shadow-xs"
          >
            <Printer className="h-3.5 w-3.5" /> Print / Export Official PDF
          </Button>
        </div>
      </div>

      {/* Official Printable Government Circular Document */}
      <div className="max-w-4xl mx-auto bg-white border border-[#CBD5E1] rounded shadow-xs p-6 md:p-10 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Government Header */}
        <div className="text-center border-b-2 border-[#0B2545] pb-4 space-y-1">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
            GOVERNMENT OF INDIA • MINISTRY OF RAILWAYS
          </div>
          <h2 className="text-xl font-bold text-[#0B2545] tracking-tight">
            CENTRAL RAILWAY • MUMBAI DIVISION
          </h2>
          <div className="text-xs font-serif italic text-slate-600">
            Office of the Divisional Railway Manager, Annex Building, CSMT, Mumbai – 400001
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-200 mt-2">
            <span>MEMORANDUM NO: CR/OPTG/ENGG/BLOCK/2026/09/W-1</span>
            <span>DATE OF ISSUE: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Circular Subject */}
        <div className="bg-[#F8FAFC] border-l-4 border-[#134074] p-3 text-xs space-y-1">
          <div className="font-bold text-[#0B2545] uppercase">
            SUBJECT: JOINT SANCTION PROGRAMME FOR TRAFFIC, POWER (OHE), AND S&T MAINTENANCE BLOCKS
          </div>
          <p className="text-slate-600 leading-relaxed">
            In accordance with Railway Board guidelines and General & Subsidiary Rules (G&SR), the following maintenance block allocations are sanctioned for execution by Open Line Civil, Electrical (TRD), and S&T branches on the Mumbai–Kalyan–Pune Mainline corridor.
          </p>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Sanctioned Blocks</span>
            <span className="text-xl font-bold text-[#0B2545] font-mono">{approvedBlocks.length}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Block Duration</span>
            <span className="text-xl font-bold text-[#0B2545] font-mono">{totalApprovedHours.toFixed(1)} hrs</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Active Rakes Monitored</span>
            <span className="text-xl font-bold text-[#0B2545] font-mono">{trains?.items?.length || 18}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Timetable Punctuality</span>
            <span className="text-xl font-bold text-emerald-700 font-mono">98.4%</span>
          </div>
        </div>

        {/* Section 1: Sanctioned Block Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1">
            <Building2 className="h-4 w-4 text-[#134074]" />
            1. Sanctioned Maintenance Block Schedule
          </h3>

          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#EBF0F5] text-[#0B2545] font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 font-bold w-24">Block ID</th>
                  <th className="p-2 font-bold">Discipline & Section</th>
                  <th className="p-2 font-bold w-24 text-center">Duration</th>
                  <th className="p-2 font-bold">Planned Timing Window</th>
                  <th className="p-2 font-bold w-28 text-right">Sanction Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {rawBlocks.map((b: any) => (
                  <tr key={b.id} className="text-[11px]">
                    <td className="p-2 font-bold text-[#0B2545]">{b.id}</td>
                    <td className="p-2 font-sans">
                      <div className="font-bold text-slate-800">{b.block_type} BLOCK</div>
                      <div className="text-slate-500 text-[10px]">{b.section_name || b.section_id}</div>
                    </td>
                    <td className="p-2 text-center font-bold text-slate-700">
                      {b.requested_duration_hours || 3} hrs
                    </td>
                    <td className="p-2 text-slate-600 text-[10px]">
                      {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} —{' '}
                      {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-2 text-right font-sans">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          b.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Safety & Interlocking Compliance */}
        <div className="space-y-2 text-xs">
          <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1">
            <ShieldCheck className="h-4 w-4 text-[#134074]" />
            2. Safety Compliance & Operating Directives
          </h3>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded space-y-1.5 text-slate-700 text-[11px] leading-relaxed">
            <p>1. <b>Power Disconnection:</b> Traction Power Controller (TPC) shall issue permit to work only after ensuring 25kV OHE isolation and physical earthing on both sides.</p>
            <p>2. <b>Line Clear & Clamping:</b> Station Masters of concerned block sections shall keep facing points locked for diversion before issuing line clear message.</p>
            <p>3. <b>Caution Orders:</b> Caution orders shall be issued to all Loco Pilots and Guards of succeeding Mail/Express trains indicating speed restrictions (if applicable).</p>
          </div>
        </div>

        {/* Signatures / Administrative Sign-Off Box */}
        <div className="border-t-2 border-slate-300 pt-6 mt-6">
          <div className="grid grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-1">
              <div className="h-10 border-b border-dashed border-slate-400 max-w-[200px] mx-auto flex items-end justify-center pb-1">
                <span className="font-serif italic text-slate-700 font-bold">V. R. Sharma, IRTS</span>
              </div>
              <div className="font-bold text-[#0B2545]">Senior Divisional Operations Manager</div>
              <div className="text-[10px] text-slate-500">Sr. DOM / Mumbai Division, Central Railway</div>
            </div>

            <div className="space-y-1">
              <div className="h-10 border-b border-dashed border-slate-400 max-w-[200px] mx-auto flex items-end justify-center pb-1">
                <span className="font-serif italic text-slate-700 font-bold">R. K. Meena, IRSE</span>
              </div>
              <div className="font-bold text-[#0B2545]">Senior Divisional Engineer (Co-ordination)</div>
              <div className="text-[10px] text-slate-500">Sr. DEN (Co-ord) / Mumbai Division, Central Railway</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
