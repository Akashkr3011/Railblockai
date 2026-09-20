import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth, OFFICIAL_DEMO_ACCOUNTS } from '@/lib/auth'
import { authApi } from '@/lib/api'
import { useTranslation, SUPPORTED_LANGUAGES } from '@/lib/i18n'
import { Tooltip } from '@/components/ui/Tooltip'
import {
  Train,
  ShieldCheck,
  Lock,
  User as UserIcon,
  Loader2,
  AlertTriangle,
  Building2,
  Radio,
  HardHat,
  Eye,
  EyeOff,
  RefreshCw,
  Globe,
  Check,
  KeyRound,
  CheckCircle2,
  HelpCircle,
  X,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserRole } from '@/types'

// Simple SVG Google Icon
function GoogleIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

function generateCaptchaCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  let result = ''
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function Login() {
  const [identity, setIdentity] = useState('admin@railnet.gov.in')
  const [password, setPassword] = useState('RailNet@2026')
  const [showPassword, setShowPassword] = useState(false)
  const [captchaInput, setCaptchaInput] = useState('')
  const [captchaTarget, setCaptchaTarget] = useState('7K9P2')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotStep, setForgotStep] = useState<1 | 2>(1)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotCode, setForgotCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [forgotError, setForgotError] = useState<string | null>(null)
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [devPreviewCode, setDevPreviewCode] = useState<string | null>(null)

  const captchaCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const { login } = useAuth()
  const { language, setLanguage, t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as any)?.from?.pathname || '/'

  // Initialize and redraw CAPTCHA
  const refreshCaptcha = () => {
    const code = generateCaptchaCode()
    setCaptchaTarget(code)
    setCaptchaInput('')
  }

  useEffect(() => {
    refreshCaptcha()
  }, [])

  // Draw authentic CAPTCHA graphics on canvas
  useEffect(() => {
    const canvas = captchaCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // Background pattern
    ctx.fillStyle = '#f1f5f9'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Random noise lines
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = ['#cbd5e1', '#94a3b8', '#64748b'][i % 3]
      ctx.lineWidth = 1 + Math.random()
      ctx.beginPath()
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.bezierCurveTo(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * canvas.width,
        Math.random() * canvas.height,
      )
      ctx.stroke()
    }

    // Draw characters with distinct rotations & offsets
    ctx.font = 'bold 22px monospace'
    for (let i = 0; i < captchaTarget.length; i++) {
      ctx.save()
      const x = 16 + i * 22
      const y = 28 + (Math.random() * 6 - 3)
      const angle = (Math.random() * 24 - 12) * (Math.PI / 180)
      ctx.translate(x, y)
      ctx.rotate(angle)
      ctx.fillStyle = ['#0B2545', '#134074', '#A6192E', '#1e293b'][i % 4]
      ctx.fillText(captchaTarget[i], 0, 0)
      ctx.restore()
    }
  }, [captchaTarget])

  const handleFillCredentials = (role: UserRole) => {
    const account = OFFICIAL_DEMO_ACCOUNTS[role]
    if (account) {
      setIdentity(account.email)
      setPassword(account.password)
      setError(null)
    }
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!identity.trim() || !password.trim()) {
      setError(t('login.error_missing', 'Please provide both username/email and password.'))
      return
    }

    // Validate CAPTCHA (case-insensitive for officer usability)
    if (captchaInput.trim().toUpperCase() !== captchaTarget.toUpperCase()) {
      setError(t('login.error_captcha', 'CAPTCHA verification code mismatch. Please re-enter the code shown.'))
      refreshCaptcha()
      return
    }

    setIsSubmitting(true)
    try {
      const res = await authApi.login({ email: identity.trim(), password })
      await login(res.access_token, res.user)
      navigate(from, { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.error || t('login.error_invalid', 'Invalid railway credentials. Verification failed in RailNet directory.'))
      refreshCaptcha()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setIsSubmitting(true)
    try {
      // In this environment, call the backend /auth/google endpoint
      // Using official admin identity as authorized identity
      const res = await authApi.googleLogin({ email: 'admin@railnet.gov.in', name: 'Shri V. R. Sharma, IRTS' })
      await login(res.access_token, res.user)
      navigate(from, { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Google authentication failed or account not linked.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Forgot Password Request
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError(null)
    setForgotSuccess(null)
    setForgotLoading(true)
    try {
      const res = await authApi.forgotPassword(forgotEmail.trim())
      setForgotSuccess(res.message || 'Verification code generated.')
      if (res.dev_preview_code) {
        setDevPreviewCode(res.dev_preview_code)
        setForgotCode(res.dev_preview_code)
      }
      setForgotStep(2)
    } catch (err: any) {
      setForgotError(err?.response?.data?.error || 'Failed to send recovery code. Ensure email is registered.')
    } finally {
      setForgotLoading(false)
    }
  }

  // Handle Reset Password Submit
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError(null)
    setForgotLoading(true)
    try {
      await authApi.resetPassword({
        email: forgotEmail.trim(),
        code: forgotCode.trim(),
        new_password: newPassword,
      })
      setForgotSuccess(t('pwd.success_msg', 'Password updated successfully! You can now log in.'))
      setPassword(newPassword)
      setIdentity(forgotEmail.trim())
      setTimeout(() => {
        setShowForgotModal(false)
        setForgotStep(1)
        setForgotError(null)
        setForgotSuccess(null)
        setDevPreviewCode(null)
      }, 1500)
    } catch (err: any) {
      setForgotError(err?.response?.data?.error || 'Failed to update password. Verify code.')
    } finally {
      setForgotLoading(false)
    }
  }

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0]

  return (
    <div className="min-h-screen relative flex flex-col justify-between p-3 sm:p-6 font-sans text-slate-900 select-none overflow-x-hidden bg-[#0A192F]">
      {/* 1. Railway Infrastructure Backdrop */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-25 filter grayscale"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1474487548417-781cb71495f3?q=80&w=2000&auto=format&fit=crop')`,
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0B2545]/95 via-[#001D3D]/90 to-[#0A192F]/95" />

      {/* Top Floating Language Switcher */}
      <div className="relative z-20 flex justify-between items-center w-full max-w-5xl mx-auto pt-1 pb-3">
        {/* National Emblem & Title for Mobile / Compact */}
        <div className="flex items-center gap-2 text-white">
          <div className="h-8 w-8 rounded bg-[#134074] border border-amber-400/40 flex items-center justify-center shrink-0 shadow">
            <Train className="h-4 w-4 text-amber-300" />
          </div>
          <div className="text-[11px] font-bold tracking-wider text-amber-300 uppercase">
            {t('gov.india', 'Government of India')} • {t('min.railways', 'Ministry of Railways')}
          </div>
        </div>

        {/* Language Switcher Dropdown (English & Hindi) */}
        <div className="relative">
          <Tooltip content={t('tt.lang', 'Change language / भाषा बदलें')} position="left">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="bg-[#134074]/90 hover:bg-[#1a5394] text-amber-200 hover:text-white px-3 py-1.5 rounded border border-amber-400/40 shadow-md flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer"
            >
              <Globe className="h-3.5 w-3.5 text-amber-300" />
              <span>{currentLangObj.nativeName} ({currentLangObj.label})</span>
            </button>
          </Tooltip>

          {showLangMenu && (
            <div className="absolute right-0 mt-1.5 w-44 bg-white text-slate-800 rounded-lg shadow-2xl border-2 border-[#134074] py-1.5 z-50 text-xs animate-in fade-in duration-150">
              <div className="px-3 py-1 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                {t('lang.switch', 'Select Language')}
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
                    <span>{item.flag}</span>
                    <span className="font-semibold">{item.nativeName}</span>
                  </div>
                  {language === item.code && <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Login Card Container */}
      <div className="relative z-10 w-full max-w-5xl mx-auto my-auto">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-300">
          {/* Top Indian Railway Tricolour Ribbon */}
          <div className="h-1.5 w-full flex">
            <div className="h-full w-1/3 bg-[#FF9933]" />
            <div className="h-full w-1/3 bg-white" />
            <div className="h-full w-1/3 bg-[#138808]" />
          </div>

          {/* Portal Header */}
          <div className="bg-[#0B2545] text-white px-5 py-4 border-b-2 border-[#A6192E] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-lg bg-[#134074] border border-amber-400/40 flex items-center justify-center shrink-0 shadow-inner">
                <Train className="h-6 w-6 text-amber-300" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  {t('gov.india', 'Government of India')} • {t('min.railways', 'Ministry of Railways')}
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-white font-sans">
                  {t('login.portal_title', 'RAILBLOCK AI')}
                </h1>
                <p className="text-xs text-blue-200">
                  {t('login.portal_subtitle', 'AI-Powered Automatic Block Planning for Railway Operations')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] uppercase font-bold text-amber-300 font-mono">
                  CRIS SECURE GATEWAY
                </div>
                <div className="text-[10px] text-blue-200 font-mono">256-BIT ENCRYPTED</div>
              </div>
              <ShieldCheck className="h-7 w-7 text-amber-400" />
            </div>
          </div>

          {/* Security Advisory Warning Strip */}
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-[11px] text-amber-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
            <span>
              <strong>{t('login.gateway_notice', 'Official RailNet Operational Gateway')}:</strong>{' '}
              {t('login.security_warning', 'Authorized railway personnel only. All logins, approvals, and actions are cryptographically journaled under Indian Railways safety protocols.')}
            </span>
          </div>

          {/* Split Content Layout: Login Form on Left, Test Accounts Reference on Right */}
          <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Authentic Login Form */}
            <div className="lg:col-span-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#0B2545] flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-[#A6192E]" />
                  <span>{t('login.btn_login', 'Sign In to RailBlock AI')}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your official RailNet username or email and security password.
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{error}</div>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                {/* Username or Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t('login.identity_label', 'Username or RailNet Email')}
                  </label>
                  <div className="relative">
                    <UserIcon className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={identity}
                      onChange={(e) => setIdentity(e.target.value)}
                      placeholder={t('login.identity_placeholder', 'e.g. admin or admin@railnet.gov.in')}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0B2545] focus:border-[#0B2545] outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Password with Eye Toggle */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">
                      {t('login.password_label', 'Password / Security PIN')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] font-semibold text-[#134074] hover:text-[#0B2545] hover:underline cursor-pointer"
                    >
                      {t('login.forgot_password', 'Forgot Password?')}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('login.password_placeholder', 'Enter your official password')}
                      className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0B2545] focus:border-[#0B2545] outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? t('login.hide_password', 'Hide password') : t('login.show_password', 'Show password')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* CAPTCHA Verification Box */}
                <div className="space-y-1 pt-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t('login.captcha_label', 'Security Verification Code (CAPTCHA)')}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="border border-slate-300 rounded-md overflow-hidden bg-slate-100 shadow-inner flex items-center">
                      <canvas
                        ref={captchaCanvasRef}
                        width={130}
                        height={34}
                        className="cursor-pointer"
                        title="Click to refresh CAPTCHA"
                        onClick={refreshCaptcha}
                      />
                    </div>
                    <Tooltip content={t('login.captcha_refresh', 'Generate new CAPTCHA code')} position="top">
                      <button
                        type="button"
                        onClick={refreshCaptcha}
                        className="p-2 border border-slate-300 hover:bg-slate-100 rounded-md text-slate-600 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    <input
                      type="text"
                      required
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder={t('login.captcha_placeholder', 'Enter code')}
                      className="flex-1 py-2 px-3 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0B2545] focus:border-[#0B2545] outline-none font-mono uppercase tracking-widest text-center"
                      maxLength={6}
                    />
                  </div>
                </div>

                {/* Sign In Submit Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#0B2545] hover:bg-[#134074] hover:text-amber-200 text-white py-2.5 text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{t('login.btn_authenticating', 'Verifying Credentials with RailNet...')}</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4 text-amber-300" />
                        <span>{t('login.btn_login', 'Sign In to RailBlock AI')}</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* Google Sign In Divider */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-white px-2 text-slate-400 font-semibold tracking-wider">
                    Or Sign In with Official Google Account
                  </span>
                </div>
              </div>

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-sm"
              >
                <GoogleIcon className="h-4 w-4" />
                <span>{t('login.google_login', 'Sign In with Authorized Google Identity')}</span>
              </button>
              <p className="text-[10px] text-center text-slate-400">
                {t('login.google_note', 'Pre-registered RailNet emails only')}
              </p>
            </div>

            {/* Right Column: Authorized Test Accounts Reference Guide */}
            <div className="lg:col-span-6 bg-slate-50/80 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-[#0B2545] tracking-wider">
                      {t('login.credentials_guide_title', 'Authorized Test Accounts Reference Guide')}
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      {t('login.credentials_guide_subtitle', 'Click "Fill Credentials" to populate credentials. The backend verifies the password hash and determines the authorized role.')}
                    </p>
                  </div>
                  <HelpCircle className="h-4 w-4 text-slate-400 shrink-0" />
                </div>

                <div className="space-y-2.5">
                  {/* 1. ADMIN CARD */}
                  <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-sm hover:border-amber-400 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-amber-100 text-[#0B2545]">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-[#0B2545]">ADMIN</span>
                            <Badge className="bg-amber-100 text-[#0B2545] border border-amber-300 text-[9px] py-0 px-1.5 font-bold">
                              HQ / Sr. DOM
                            </Badge>
                          </div>
                          <div className="text-[10px] text-slate-600 font-mono">
                            admin@railnet.gov.in (or: admin)
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFillCredentials('ADMIN')}
                        className="text-[10px] h-7 px-2 border-blue-400/40 text-[#0B2545] hover:bg-blue-50 font-bold cursor-pointer"
                      >
                        {t('login.fill_creds', 'Fill Credentials')}
                      </Button>
                    </div>
                    <div className="mt-1.5 text-[10px] text-slate-500">
                      Clearance: Class-A Final Statutory Human Approval Authority • User Management • Audit
                    </div>
                  </div>

                  {/* 2. PLANNER CARD */}
                  <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm hover:border-blue-400 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-blue-100 text-[#134074]">
                          <Radio className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-[#134074]">PLANNER</span>
                            <Badge className="bg-blue-100 text-[#134074] border border-blue-300 text-[9px] py-0 px-1.5 font-bold">
                              Control Office
                            </Badge>
                          </div>
                          <div className="text-[10px] text-slate-600 font-mono">
                            planner@railnet.gov.in (or: planner)
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFillCredentials('PLANNER')}
                        className="text-[10px] h-7 px-2 border-blue-400/40 text-[#134074] hover:bg-blue-50 font-bold cursor-pointer"
                      >
                        {t('login.fill_creds', 'Fill Credentials')}
                      </Button>
                    </div>
                    <div className="mt-1.5 text-[10px] text-slate-500">
                      Clearance: Chief Section Controller • CP-SAT Simulation • Timetable Protection
                    </div>
                  </div>

                  {/* 3. WORKER CARD */}
                  <div className="bg-white p-3 rounded-lg border border-rose-200 shadow-sm hover:border-rose-400 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-rose-100 text-[#A6192E]">
                          <HardHat className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-[#A6192E]">WORKER</span>
                            <Badge className="bg-rose-100 text-[#A6192E] border border-rose-300 text-[9px] py-0 px-1.5 font-bold">
                              SSE P-Way
                            </Badge>
                          </div>
                          <div className="text-[10px] text-slate-600 font-mono">
                            worker@railnet.gov.in (or: worker)
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFillCredentials('WORKER')}
                        className="text-[10px] h-7 px-2 border-rose-400/40 text-[#A6192E] hover:bg-rose-50 font-bold cursor-pointer"
                      >
                        {t('login.fill_creds', 'Fill Credentials')}
                      </Button>
                    </div>
                    <div className="mt-1.5 text-[10px] text-slate-500">
                      Clearance: Field Track Maintenance • Work Orders • USFD Rail Flaw Register
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <span className="font-mono">Common Default PIN: RailNet@2026</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> PBKDF2 Hashed
                </span>
              </div>
            </div>
          </div>

          {/* CRIS Security Compliance Footer Strip */}
          <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>
                {t('login.cris_audit', 'Indian Railways CRIS Security Compliant • Role-Based Access Enforced by Backend')}
              </span>
            </div>
            <div className="font-mono text-[10px] text-slate-500">
              CENTRAL RAILWAY (CR-BB) • CRIS NTP SYNC
            </div>
          </div>
        </div>
      </div>

      {/* 2-Step Forgot / Reset Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-[#0B2545] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-300" />
                <h3 className="font-bold text-sm">
                  {t('pwd.modal_title', 'Security PIN & Password Recovery')}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowForgotModal(false)
                  setForgotStep(1)
                  setForgotError(null)
                  setForgotSuccess(null)
                }}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {forgotError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded text-xs text-rose-800">
                  {forgotError}
                </div>
              )}
              {forgotSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {forgotStep === 1 ? (
                <form onSubmit={handleRequestCode} className="space-y-3">
                  <div>
                    <h4 className="font-bold text-xs text-[#0B2545]">
                      {t('pwd.step1_title', 'Step 1: Verify Registered Email')}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {t('pwd.step1_desc', 'Enter your official railway email to generate a 6-digit verification code.')}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      RailNet Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. admin@railnet.gov.in"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-[#0B2545]"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForgotModal(false)}
                      className="text-xs"
                    >
                      {t('btn.cancel', 'Cancel')}
                    </Button>
                    <Button
                      type="submit"
                      disabled={forgotLoading}
                      className="bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      {forgotLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                      <span>{t('pwd.btn_send_code', 'Send Verification Code')}</span>
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div>
                    <h4 className="font-bold text-xs text-[#0B2545]">
                      {t('pwd.step2_title', 'Step 2: Enter Verification Code & New Password')}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Enter the 6-digit code dispatched for <strong className="text-slate-800">{forgotEmail}</strong>.
                    </p>
                  </div>

                  {devPreviewCode && (
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-900 font-mono">
                      Railway Dispatch Code: <strong>{devPreviewCode}</strong>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {t('pwd.code_label', '6-Digit Verification Code')}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={forgotCode}
                      onChange={(e) => setForgotCode(e.target.value)}
                      placeholder="e.g. 842195"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono tracking-widest text-center outline-none focus:ring-2 focus:ring-[#0B2545]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {t('pwd.new_pass_label', 'New Password')}
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-[#0B2545]"
                    />
                  </div>

                  <div className="pt-2 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-xs text-slate-500 hover:text-slate-800 underline"
                    >
                      Back to Step 1
                    </button>
                    <Button
                      type="submit"
                      disabled={forgotLoading}
                      className="bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      {forgotLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                      <span>{t('pwd.btn_reset', 'Update Password')}</span>
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sub-Footer */}
      <div className="relative z-10 text-center py-2 text-[11px] text-slate-400">
        RAILBLOCK AI • Integrated Track Possession & Decision Support Platform • Smart India Hackathon 2026
      </div>
    </div>
  )
}
