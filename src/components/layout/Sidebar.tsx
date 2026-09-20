import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Train,
  CalendarDays,
  FileCheck2,
  Wrench,
  ClipboardList,
  AlertTriangle,
  Database,
  GitCompare,
  Film,
  FileText,
  MapPin,
  X,
  HardHat,
  Radio,
  Building2,
  LifeBuoy,
  Users,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { useTranslation } from '@/lib/i18n'
import { Tooltip } from '@/components/ui/Tooltip'
import { UserRole } from '@/types'

interface NavItem {
  labelKey: string
  defaultLabel: string
  path: string
  icon: any
  badge?: string
  priorityForRole?: UserRole
  allowedRoles?: UserRole[]
  tooltipDesc: string
}

interface NavSection {
  titleKey: string
  defaultTitle: string
  allowedRoles?: UserRole[]
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    titleKey: 'nav.operations',
    defaultTitle: 'OPERATIONS',
    items: [
      {
        labelKey: 'nav.assets',
        defaultLabel: 'Assets',
        path: '/assets',
        icon: Database,
        priorityForRole: 'WORKER',
        tooltipDesc: 'Track condition index (TGI), USFD rail defect logs, and bridge assets',
      },
      {
        labelKey: 'nav.tasks',
        defaultLabel: 'Tasks',
        path: '/tasks',
        icon: Wrench,
        priorityForRole: 'WORKER',
        tooltipDesc: 'File P-Way work orders, rail renewal requisitions, and machine slots',
      },
      {
        labelKey: 'nav.trains',
        defaultLabel: 'Trains',
        path: '/trains',
        icon: Train,
        priorityForRole: 'PLANNER',
        tooltipDesc: 'Real-time train monitoring, timetable regulation, and Kavach ATP status',
      },
      {
        labelKey: 'nav.corridors',
        defaultLabel: 'Corridors',
        path: '/corridors',
        icon: MapPin,
        priorityForRole: 'PLANNER',
        tooltipDesc: 'Pan-India 17-zone network corridors, junctions, and live line block overlays',
      },
      {
        labelKey: 'nav.resources',
        defaultLabel: 'Resources',
        path: '/resources',
        icon: HardHat,
        priorityForRole: 'PLANNER',
        tooltipDesc: 'Maintenance crew gangs, OHE tower wagons, ballast tampers, and USFD squads',
      },
    ],
  },
  {
    titleKey: 'nav.blocks_heading',
    defaultTitle: 'BLOCK MANAGEMENT',
    allowedRoles: ['ADMIN', 'PLANNER', 'WORKER'],
    items: [
      {
        labelKey: 'nav.blocks',
        defaultLabel: 'Block Management',
        path: '/blocks',
        icon: CalendarDays,
        priorityForRole: 'PLANNER',
        tooltipDesc: 'Corridor possession scheduling, AI solver plans, and human approval workflow',
      },
    ],
  },
  {
    titleKey: 'nav.optimization_heading',
    defaultTitle: 'PLAN OPTIMIZATION',
    allowedRoles: ['ADMIN', 'PLANNER'],
    items: [
      {
        labelKey: 'nav.daily_plan',
        defaultLabel: 'Daily Optimization',
        path: '/optimization?level=daily',
        icon: GitCompare,
        badge: 'DAILY',
        priorityForRole: 'PLANNER',
        tooltipDesc: 'Daily horizon CP-SAT timetable optimization and conflict resolution',
      },
      {
        labelKey: 'nav.weekly_plan',
        defaultLabel: 'Weekly Optimization',
        path: '/optimization?level=weekly',
        icon: GitCompare,
        badge: '7-DAY',
        priorityForRole: 'PLANNER',
        tooltipDesc: 'Full 7-day multi-corridor workload balancing and block allocation',
      },
      {
        labelKey: 'nav.monthly_plan',
        defaultLabel: 'Monthly Optimization',
        path: '/optimization?level=monthly',
        icon: GitCompare,
        badge: 'MONTH',
        priorityForRole: 'ADMIN',
        tooltipDesc: 'Monthly calendar trends, risk assessment, and recommended maintenance windows',
      },
    ],
  },
  {
    titleKey: 'nav.ai_support',
    defaultTitle: 'DECISION SUPPORT & GOVERNANCE',
    allowedRoles: ['ADMIN', 'PLANNER'],
    items: [
      {
        labelKey: 'nav.simulation',
        defaultLabel: 'AI Insights & What-If',
        path: '/simulation',
        icon: Film,
        tooltipDesc: 'Simulate cascading train delays under varying maintenance duration windows',
      },
      {
        labelKey: 'nav.reports',
        defaultLabel: 'Reports & Circulars',
        path: '/reports',
        icon: FileText,
        priorityForRole: 'ADMIN',
        tooltipDesc: 'Generate statutory Railway Board joint circular certifications and logs',
      },
      {
        labelKey: 'nav.audit',
        defaultLabel: 'Audit Logs',
        path: '/audit',
        icon: FileCheck2,
        priorityForRole: 'ADMIN',
        allowedRoles: ['ADMIN', 'PLANNER'],
        tooltipDesc: 'Immutable officer sign-off trail, cryptographically logged for safety inspection',
      },
    ],
  },
  {
    titleKey: 'nav.admin_compliance',
    defaultTitle: 'SYSTEM ADMINISTRATION',
    allowedRoles: ['ADMIN'],
    items: [
      {
        labelKey: 'nav.users',
        defaultLabel: 'User Management',
        path: '/users',
        icon: Users,
        priorityForRole: 'ADMIN',
        allowedRoles: ['ADMIN'],
        tooltipDesc: 'Manage personnel accounts, assign authorized roles, and inspect security clearance',
      },
      {
        labelKey: 'nav.settings',
        defaultLabel: 'System Settings',
        path: '/settings',
        icon: Settings,
        priorityForRole: 'ADMIN',
        allowedRoles: ['ADMIN'],
        tooltipDesc: 'Configure divisional parameters, safety interlocking, and solver constraints',
      },
    ],
  },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth()
  const { t } = useTranslation()

  const roleTag =
    user?.role === 'WORKER'
      ? { label: t('role.badge.worker', 'FIELD P-WAY FOCUS'), icon: HardHat, color: 'text-rose-300 border-rose-400/40 bg-rose-950/40' }
      : user?.role === 'PLANNER'
      ? { label: t('role.badge.ops', 'TRAIN CONTROL FOCUS'), icon: Radio, color: 'text-blue-300 border-blue-400/40 bg-blue-950/40' }
      : { label: t('role.badge.admin', 'SANCTION AUTHORITY'), icon: Building2, color: 'text-amber-300 border-amber-400/40 bg-amber-950/40' }

  return (
    <>
      {/* Mobile/Tablet Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      {/* Sidebar Container: Fixed on Desktop, Slide-Over Drawer on Mobile/Tablet */}
      <aside
        className={cn(
          'w-64 bg-[#0B2545] text-slate-200 border-r border-[#134074] flex flex-col shrink-0 select-none text-xs font-sans transition-transform duration-300 z-40',
          'fixed inset-y-0 left-0 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Mobile Header Close Button */}
        <div className="p-3 border-b border-[#134074] flex items-center justify-between">
          <NavLink
            to="/"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-3 py-2 rounded font-medium transition-all duration-200 flex-1 mr-2',
                isActive
                  ? 'bg-[#134074] text-white border-l-4 border-amber-400 font-bold shadow-sm'
                  : 'text-slate-300 hover:bg-[#134074]/60 hover:text-white',
              )
            }
          >
            <LayoutDashboard className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="font-semibold">{t('nav.dashboard', 'Control Dashboard')}</span>
          </NavLink>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#134074]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role Adaptation Indicator Pill */}
        <div className="mx-3 mt-2.5 p-2 rounded border flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider font-bold shadow-inner justify-between transition-colors duration-200"
          style={{
            backgroundColor:
              user?.role === 'WORKER'
                ? '#3d0c14'
                : user?.role === 'PLANNER'
                ? '#082040'
                : '#2d1f05',
          }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <roleTag.icon className="h-3.5 w-3.5 shrink-0 text-amber-300" />
            <span className="truncate text-slate-100">{roleTag.label}</span>
          </div>
          <span className="text-[9px] px-1 py-0.5 rounded bg-black/40 text-emerald-300 font-bold font-mono shrink-0">
            ACTIVE
          </span>
        </div>

        {/* Nav Sections with Role Prioritization & Tooltips */}
        <div className="flex-1 overflow-y-auto py-2 space-y-4 px-2">
          {navSections
            .filter((section) => !section.allowedRoles || (user && section.allowedRoles.includes(user.role)))
            .map((section) => {
              const visibleItems = section.items.filter(
                (item) => !item.allowedRoles || (user && item.allowedRoles.includes(user.role)),
              )
              if (visibleItems.length === 0) return null
              return (
                <div key={section.titleKey} className="space-y-1">
                  <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-blue-300 uppercase flex items-center justify-between">
                    <span>{t(section.titleKey, section.defaultTitle)}</span>
                  </div>
                  {visibleItems.map((item) => {
                    const Icon = item.icon
                    const isPriority = item.priorityForRole === user?.role
                    return (
                      <Tooltip
                        key={item.path}
                        content={item.tooltipDesc}
                        position="right"
                        className="hidden lg:inline-flex"
                      >
                        <NavLink
                          to={item.path}
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center justify-between px-3 py-1.5 rounded transition-all duration-200 group w-full',
                              isActive
                                ? 'bg-[#134074] text-white font-semibold border-l-3 border-amber-400 shadow-sm'
                                : 'text-slate-300 hover:bg-[#134074]/60 hover:text-white',
                              isPriority && !isActive && 'bg-[#134074]/20 text-blue-100',
                            )
                          }
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={cn(
                                'h-3.5 w-3.5 shrink-0 transition-colors',
                                isPriority
                                  ? 'text-amber-300'
                                  : 'text-blue-300 group-hover:text-amber-300',
                              )}
                            />
                            <span className="truncate">{t(item.labelKey, item.defaultLabel)}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {isPriority && (
                              <span className="text-[8px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1 py-0.2 rounded font-mono font-bold">
                                CORE
                              </span>
                            )}
                            {item.badge && (
                              <span className="text-[8px] bg-blue-500/30 text-blue-200 border border-blue-400/30 px-1 py-0.2 rounded font-mono font-bold">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </NavLink>
                      </Tooltip>
                    )
                  })}
                </div>
              )
            })}
        </div>

        {/* Footer / Department Information */}
        <div className="p-3 border-t border-[#134074] bg-[#001D3D] text-[11px] text-slate-400">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300">Indian Railways</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
              ALL-INDIA NROC
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Control Office Application Integration</div>
        </div>
      </aside>
    </>
  )
}
