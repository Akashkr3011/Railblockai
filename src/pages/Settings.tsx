import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useTranslation, SUPPORTED_LANGUAGES } from '@/lib/i18n'
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Cpu,
  Globe,
  Sliders,
  BellRing,
  Clock,
  Save,
  CheckCircle2,
  HardDrive,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Settings() {
  const { user } = useAuth()
  const { language, setLanguage, t } = useTranslation()

  const [savedSuccess, setSavedSuccess] = useState(false)
  const [divisionConfig, setDivisionConfig] = useState({
    divisionName: 'CR-MUM (Central Railway Mumbai Division)',
    timeZone: 'Asia/Kolkata (IST +05:30)',
    maxBlockHours: 8,
    minHeadwayMinutes: 5,
    autoTsrBufferKm: 2,
    algorithmMode: 'CP_SAT_STRICT',
    enforceHumanSignoff: true,
    immutableAuditTrail: true,
    emailAlerts: true,
    smsAlerts: false,
  })

  if (user?.role !== 'ADMIN') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-amber-900 uppercase tracking-wide">
            Administrative Clearance Required
          </h2>
          <p className="text-xs text-amber-800 max-w-md mx-auto">
            System configuration parameters and solver optimization boundaries are restricted to Senior Divisional Operations Managers (Sr. DOM).
          </p>
        </div>
      </div>
    )
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#0B2545] text-amber-300">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#0B2545] tracking-tight">
              {t('settings.title', 'System Settings & Operational Parameters')}
            </h1>
            <p className="text-xs text-slate-500">
              {t('settings.subtitle', 'Configure divisional boundary limits, solver constraints, and railway safety standards.')}
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Settings saved successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Divisional Jurisdiction */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Sliders className="h-4 w-4 text-[#0B2545]" />
            <h2 className="text-xs font-bold uppercase text-[#0B2545] tracking-wider">
              Divisional Jurisdiction & Boundary Settings
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Railway Division Code & Name
              </label>
              <input
                type="text"
                value={divisionConfig.divisionName}
                onChange={(e) => setDivisionConfig({ ...divisionConfig, divisionName: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs outline-none focus:ring-2 focus:ring-[#0B2545]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Time Zone Synchronization (CRIS NTP)
              </label>
              <input
                type="text"
                disabled
                value={divisionConfig.timeZone}
                className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-md text-xs text-slate-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* 2. Solver & Safety Thresholds */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Cpu className="h-4 w-4 text-[#0B2545]" />
            <h2 className="text-xs font-bold uppercase text-[#0B2545] tracking-wider">
              OR-Tools CP-SAT Algorithm & Safety Windows
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Maximum Continuous Block Window (Hours)
              </label>
              <input
                type="number"
                min={2}
                max={12}
                value={divisionConfig.maxBlockHours}
                onChange={(e) => setDivisionConfig({ ...divisionConfig, maxBlockHours: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs outline-none focus:ring-2 focus:ring-[#0B2545]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Minimum Train Headway (Minutes)
              </label>
              <input
                type="number"
                min={3}
                max={15}
                value={divisionConfig.minHeadwayMinutes}
                onChange={(e) => setDivisionConfig({ ...divisionConfig, minHeadwayMinutes: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs outline-none focus:ring-2 focus:ring-[#0B2545]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Auto TSR Safety Buffer (km)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={divisionConfig.autoTsrBufferKm}
                onChange={(e) => setDivisionConfig({ ...divisionConfig, autoTsrBufferKm: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs outline-none focus:ring-2 focus:ring-[#0B2545]"
              />
            </div>
          </div>
        </div>

        {/* 3. Language & Internationalization */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Globe className="h-4 w-4 text-[#0B2545]" />
            <h2 className="text-xs font-bold uppercase text-[#0B2545] tracking-wider">
              Default Operational Language (I18n)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Official Interface Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-[#0B2545] outline-none focus:ring-2 focus:ring-[#0B2545]"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.nativeName} ({l.label})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Supports official bilingual standards (English and Hindi).
              </p>
            </div>
          </div>
        </div>

        {/* 4. Statutory Compliance & Audit Rules */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <HardDrive className="h-4 w-4 text-[#0B2545]" />
            <h2 className="text-xs font-bold uppercase text-[#0B2545] tracking-wider">
              Statutory Compliance & Security Policies
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={divisionConfig.enforceHumanSignoff}
                onChange={(e) => setDivisionConfig({ ...divisionConfig, enforceHumanSignoff: e.target.checked })}
                className="h-4 w-4 rounded text-[#0B2545] focus:ring-[#0B2545]"
              />
              <div>
                <span className="font-bold text-slate-800">
                  Enforce Class-A Human Sign-Off (Indian Railways General Rules GR 4.09)
                </span>
                <p className="text-[11px] text-slate-500">
                  AI suggestions cannot auto-execute without human officer cryptographic signature.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={divisionConfig.immutableAuditTrail}
                onChange={(e) => setDivisionConfig({ ...divisionConfig, immutableAuditTrail: e.target.checked })}
                className="h-4 w-4 rounded text-[#0B2545] focus:ring-[#0B2545]"
              />
              <div>
                <span className="font-bold text-slate-800">
                  Immutable Cryptographic Audit Logging (SHA-256 Hash Chain)
                </span>
                <p className="text-[11px] text-slate-500">
                  Every user login, plan edit, approval, and conflict resolution is preserved for Commissioner of Railway Safety (CRS) inquiries.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            className="bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-bold flex items-center gap-2 px-5 py-2 shadow-sm"
          >
            <Save className="h-4 w-4 text-amber-300" />
            <span>Save Configuration</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
