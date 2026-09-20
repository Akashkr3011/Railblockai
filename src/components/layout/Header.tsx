import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation, SUPPORTED_LANGUAGES } from '@/lib/i18n'
import { Tooltip } from '@/components/ui/Tooltip'
import {
  Clock,
  LogOut,
  Train,
  Building2,
  Radio,
  HardHat,
  ChevronDown,
  Globe,
  Menu,
  Check,
  ShieldCheck,
} from 'lucide-react'

interface HeaderProps {
  onToggleMobileMenu?: () => void
}

export function Header({ onToggleMobileMenu }: HeaderProps) {
  const { user, logout } = useAuth()
  const { language, setLanguage, t } = useTranslation()
  const navigate = useNavigate()
  const [istTime, setIstTime] = useState<string>('')
  const [istDate, setIstDate] = useState<string>('')
  const [showLangMenu, setShowLangMenu] = useState(false)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const istOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }
      const dateOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
      setIstTime(new Intl.DateTimeFormat('en-IN', istOptions).format(now))
      setIstDate(new Intl.DateTimeFormat('en-IN', dateOptions).format(now))
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  const roleLabel =
    user?.role === 'ADMIN'
      ? t('role.admin', 'ADMIN (SR. DOM)')
      : user?.role === 'PLANNER'
      ? t('role.ops', 'PLANNER (CONTROLLER)')
      : t('role.worker', 'WORKER (FIELD STAFF)')

  const roleIcon =
    user?.role === 'ADMIN' ? (
      <Building2 className="h-3.5 w-3.5 text-amber-300" />
    ) : user?.role === 'PLANNER' ? (
      <Radio className="h-3.5 w-3.5 text-blue-300" />
    ) : (
      <HardHat className="h-3.5 w-3.5 text-rose-300" />
    )

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0]

  const handleSignOut = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="w-full bg-[#0B2545] text-white border-b-2 border-[#A6192E] shadow-sm select-none z-30 relative">
      {/* Top Tricolour Ribbon */}
      <div className="h-1 w-full flex">
        <div className="h-full w-1/3 bg-[#FF9933]"></div>
        <div className="h-full w-1/3 bg-white"></div>
        <div className="h-full w-1/3 bg-[#138808]"></div>
      </div>

      <div className="px-3 sm:px-4 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
        {/* Left: Mobile Menu Toggle + Ministry & System Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Mobile hamburger menu toggle */}
          {onToggleMobileMenu && (
            <Tooltip content={t('tt.mobile_menu', 'Toggle navigation menu')} position="right">
              <button
                onClick={onToggleMobileMenu}
                className="lg:hidden p-2 bg-[#134074] hover:bg-[#1a5394] text-white rounded-md border border-blue-400/30 transition-colors cursor-pointer"
                aria-label="Toggle navigation"
              >
                <Menu className="h-4 w-4" />
              </button>
            </Tooltip>
          )}

          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded bg-[#134074] border border-blue-400/30 flex items-center justify-center shrink-0 shadow-inner">
            <Train className="h-5 w-5 sm:h-6 sm:w-6 text-amber-300" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[10px] sm:text-[11px] font-semibold tracking-wider text-amber-300 uppercase">
              <span>{t('gov.india', 'Government of India')}</span>
              <span className="text-blue-300 text-[10px]">|</span>
              <span className="text-slate-200">{t('min.railways', 'Ministry of Railways')}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <Link
                to="/"
                className="text-sm sm:text-base font-bold tracking-tight text-white uppercase font-sans hover:text-amber-200 transition-colors"
              >
                {t('app.title', 'RAILBLOCK AI')}
              </Link>
              <span className="text-[11px] text-blue-200 font-medium hidden xl:inline truncate max-w-md">
                — {t('app.subtitle', 'Integrated Maintenance Block Planning & Decision Support')}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Language Switcher, IST Clock, Verified Officer Clearance Badge & Sign Out */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 text-xs">
          {/* 1. Language Button (English / हिन्दी) */}
          <div className="relative">
            <Tooltip content={t('tt.lang', 'Change language / भाषा बदलें')} position="bottom">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="bg-[#134074] hover:bg-[#1a5394] px-2.5 py-1.5 rounded border border-amber-400/40 text-amber-200 hover:text-white flex items-center gap-1.5 transition-all duration-200 font-medium shadow-sm active:scale-95 cursor-pointer"
              >
                <Globe className="h-3.5 w-3.5 text-amber-300" />
                <span className="font-bold text-[11px] tracking-wide font-sans">
                  {currentLangObj.nativeName} ({currentLangObj.label})
                </span>
                <ChevronDown className="h-3 w-3 text-amber-300 ml-0.5" />
              </button>
            </Tooltip>

            {/* Language Selection Dropdown Menu */}
            {showLangMenu && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white text-slate-800 rounded-lg shadow-2xl border-2 border-[#134074] py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                  <span>{t('lang.switch', 'Select Language')}</span>
                  <Globe className="h-3 w-3 text-slate-400" />
                </div>

                {SUPPORTED_LANGUAGES.map((item) => (
                  <button
                    key={item.code}
                    onClick={() => {
                      setLanguage(item.code)
                      setShowLangMenu(false)
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-blue-50 transition-colors cursor-pointer ${
                      language === item.code ? 'bg-blue-50 font-bold text-[#0B2545]' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{item.flag}</span>
                      <div>
                        <div className="font-semibold text-xs">{item.nativeName}</div>
                        <div className="text-[10px] text-slate-500">{item.label}</div>
                      </div>
                    </div>
                    {language === item.code && <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Live IST Clock */}
          <Tooltip content={t('tt.clock', 'Indian Standard Time (IST) synchronized with CRIS NTP')} position="bottom">
            <div className="bg-[#134074]/80 px-2.5 py-1 rounded border border-blue-400/20 text-slate-200 flex flex-col items-start font-mono cursor-default">
              <span className="text-[9px] uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" /> {t('clock.ist', 'IST Control Clock')}
              </span>
              <span className="font-bold text-white text-[11px] sm:text-[12px] tracking-wide">
                {istTime || '12:00:00'} <span className="text-[10px] text-blue-200 font-sans font-normal hidden sm:inline">{istDate}</span>
              </span>
            </div>
          </Tooltip>

          {/* 3. Verified Officer Role Badge - STRICTLY FIXED: No manual role switching permitted! */}
          <div className="bg-[#134074] px-3 py-1 rounded border border-blue-400/30 flex items-center gap-2 shadow-sm cursor-default">
            <div className="flex items-center justify-center p-1.5 rounded bg-[#0B2545] border border-blue-400/20">
              {roleIcon}
            </div>
            <div className="flex flex-col text-right min-w-[120px] sm:min-w-[160px]">
              <div className="flex items-center justify-end gap-1.5">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                <span className="text-[9px] uppercase font-bold tracking-wider text-amber-300 truncate max-w-[140px] sm:max-w-none">
                  {roleLabel}
                </span>
              </div>
              <span className="font-semibold text-white text-[11px] sm:text-[12px] truncate max-w-[150px] sm:max-w-[200px]">
                {user?.full_name || 'Railway Officer'}
              </span>
              <span className="text-[9px] text-blue-200 truncate max-w-[150px] sm:max-w-[200px]">
                {user?.department || 'Operations'} • {user?.division || 'CR-BB'}
              </span>
            </div>
          </div>

          {/* 4. Logout / Sign Out Button */}
          <Tooltip content={t('tt.logout', 'Sign out of current RailNet session')} position="bottom">
            <button
              onClick={handleSignOut}
              className="px-2.5 py-1.5 bg-[#A6192E] hover:bg-[#851424] text-white rounded border border-rose-400/30 transition-all duration-200 flex items-center gap-1.5 font-semibold text-xs shadow-sm active:scale-95 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('sign.out', 'Sign Out')}</span>
            </button>
          </Tooltip>
        </div>
      </div>
    </header>
  )
}
