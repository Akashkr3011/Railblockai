import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { userManagementApi } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'
import { UserRole } from '@/types'
import {
  Users as UsersIcon,
  ShieldCheck,
  Building2,
  Radio,
  HardHat,
  Eye,
  UserPlus,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Search,
  X,
  Lock,
  Calendar,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface UserItem {
  id: string
  username?: string
  full_name: string
  email: string
  role: UserRole
  department: string
  designation: string
  division: string
  clearance: string
  permissions: string[]
  status?: string
  created_at?: string
  last_login?: string | null
}

export function Users() {
  const { user: currentUser } = useAuth()
  const { t } = useTranslation()
  const [users, setUsers] = useState<UserItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')

  // Modals
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [targetRole, setTargetRole] = useState<UserRole>('WORKER')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    full_name: '',
    email: '',
    username: '',
    role: 'WORKER' as UserRole,
    department: 'Civil Engineering / P-Way Depot',
    designation: 'Senior Section Engineer (P-Way)',
    division: 'CR-BB (Mumbai Division)',
    clearance: 'Level-3 Field Execution & Maintenance',
    password: '',
  })

  const [showResetModal, setShowResetModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const res = await userManagementApi.getUsers()
      setUsers(res.items || [])
    } catch {
      // Fallback
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      fetchUsers()
    }
  }, [currentUser?.role])

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-amber-900 uppercase tracking-wide">
            Executive Clearance Required (Sr. DOM Only)
          </h2>
          <p className="text-xs text-amber-800 max-w-md mx-auto">
            {t(
              'users.admin_only_banner',
              'Personnel & Role-Based Access Control is strictly restricted to Senior Divisional Operations Managers (Sr. DOM) under CRIS security standards.',
            )}
          </p>
          <div className="pt-2">
            <span className="text-[11px] font-mono bg-white px-3 py-1 rounded border border-amber-300 text-amber-900 inline-block">
              Current Session: {currentUser?.role} ({currentUser?.full_name})
            </span>
          </div>
        </div>
      </div>
    )
  }

  const handleOpenRoleModal = (user: UserItem) => {
    setSelectedUser(user)
    setTargetRole(user.role)
    setActionError(null)
    setActionSuccess(null)
    setShowRoleModal(true)
  }

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setActionLoading(true)
    setActionError(null)
    try {
      await userManagementApi.updateRole(selectedUser.id, targetRole)
      setActionSuccess(`Role for ${selectedUser.full_name} successfully updated to ${targetRole}.`)
      await fetchUsers()
      setTimeout(() => {
        setShowRoleModal(false)
        setSelectedUser(null)
        setActionSuccess(null)
      }, 1200)
    } catch (err: any) {
      setActionError(err?.response?.data?.detail || 'Failed to update user role.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleStatus = async (user: UserItem) => {
    const nextStatus = user.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE'
    try {
      await userManagementApi.updateStatus(user.id, nextStatus)
      await fetchUsers()
    } catch (err: any) {
      setActionError(err?.response?.data?.detail || 'Failed to update account status.')
    }
  }

  const handleOpenResetModal = (user: UserItem) => {
    setSelectedUser(user)
    setNewPassword('RailNet@2026')
    setActionError(null)
    setActionSuccess(null)
    setShowResetModal(true)
  }

  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setActionLoading(true)
    setActionError(null)
    try {
      await userManagementApi.resetPassword(selectedUser.id, newPassword)
      setActionSuccess(`Password reset successfully for ${selectedUser.full_name}.`)
      setTimeout(() => {
        setShowResetModal(false)
        setSelectedUser(null)
        setActionSuccess(null)
      }, 1200)
    } catch (err: any) {
      setActionError(err?.response?.data?.detail || 'Failed to reset password.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    setActionError(null)
    try {
      await userManagementApi.createUser(createForm)
      setActionSuccess(`Account created for ${createForm.full_name} (${createForm.role}).`)
      await fetchUsers()
      setTimeout(() => {
        setShowCreateModal(false)
        setActionSuccess(null)
        setCreateForm({
          full_name: '',
          email: '',
          username: '',
          role: 'WORKER',
          department: 'Civil Engineering / P-Way Depot',
          designation: 'Senior Section Engineer (P-Way)',
          division: 'CR-BB (Mumbai Division)',
          clearance: 'Level-3 Field Execution & Maintenance',
          password: '',
        })
      }, 1200)
    } catch (err: any) {
      setActionError(err?.response?.data?.detail || 'Failed to create user account.')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(search.toLowerCase())) ||
      u.department.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <Building2 className="h-3.5 w-3.5 text-amber-600" />
      case 'PLANNER':
        return <Radio className="h-3.5 w-3.5 text-blue-600" />
      case 'WORKER':
        return <HardHat className="h-3.5 w-3.5 text-rose-600" />
      default:
        return <Building2 className="h-3.5 w-3.5 text-slate-600" />
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#0B2545] text-amber-300">
              <UsersIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#0B2545] tracking-tight">
                {t('users.title', 'Personnel & Role-Based Access Control')}
              </h1>
              <p className="text-xs text-slate-500">
                {t(
                  'users.subtitle',
                  'Manage railway officers, assign clearance roles (ADMIN, PLANNER, WORKER), and audit permissions.',
                )}
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => {
            setActionError(null)
            setActionSuccess(null)
            setShowCreateModal(true)
          }}
          className="bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <UserPlus className="h-4 w-4 text-amber-300" />
          <span>{t('users.create_btn', 'Create Personnel Account')}</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Officers</div>
          <div className="text-xl font-bold text-[#0B2545] mt-0.5">{users.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">CRIS Directory Synced</div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-amber-200 shadow-xs">
          <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
            <Building2 className="h-3 w-3" /> Admins (Sr. DOM)
          </div>
          <div className="text-xl font-bold text-[#0B2545] mt-0.5">
            {users.filter((u) => u.role === 'ADMIN').length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Statutory Sanction Authority</div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-blue-200 shadow-xs">
          <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
            <Radio className="h-3 w-3" /> Planners (Controllers)
          </div>
          <div className="text-xl font-bold text-[#134074] mt-0.5">
            {users.filter((u) => u.role === 'PLANNER').length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Traffic & Timetable Control</div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-rose-200 shadow-xs">
          <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
            <HardHat className="h-3 w-3" /> Field Workers (SSE)
          </div>
          <div className="text-xl font-bold text-[#A6192E] mt-0.5">
            {users.filter((u) => u.role === 'WORKER').length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Trackwork & Defect Logging</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, username or dept..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md text-xs outline-none focus:ring-2 focus:ring-[#0B2545]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Filter by Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-[#0B2545] font-semibold text-[#0B2545]"
          >
            <option value="ALL">All Roles ({users.length})</option>
            <option value="ADMIN">ADMIN (Sr. DOM)</option>
            <option value="PLANNER">PLANNER (Controller)</option>
            <option value="WORKER">WORKER (SSE P-Way)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#0B2545]" />
            <p className="text-xs">Synchronizing personnel records from CRIS backend...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-3 px-4">{t('users.col_name', 'Officer Name')}</th>
                  <th className="py-3 px-4">{t('users.col_username', 'Username / Email')}</th>
                  <th className="py-3 px-4">{t('users.col_role', 'Assigned Role')}</th>
                  <th className="py-3 px-4">{t('users.col_dept', 'Department & Division')}</th>
                  <th className="py-3 px-4">{t('users.col_status', 'Status')}</th>
                  <th className="py-3 px-4">{t('users.col_last_login', 'Last Authentication')}</th>
                  <th className="py-3 px-4 text-right">{t('users.col_actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No personnel matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((item) => {
                    const isSelf = item.id === currentUser?.id
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{item.full_name}</div>
                          <div className="text-[10px] text-slate-500">{item.designation}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <div className="text-slate-800">{item.email}</div>
                          {item.username && <div className="text-[10px] text-slate-400">user: {item.username}</div>}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            {getRoleIcon(item.role)}
                            <Badge
                              className={`text-[10px] font-bold ${
                                item.role === 'ADMIN'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : item.role === 'PLANNER'
                                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                                  : item.role === 'WORKER'
                                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                                  : 'bg-teal-100 text-teal-900 border-teal-300'
                              }`}
                            >
                              {item.role}
                            </Badge>
                          </div>
                          <div className="text-[9px] text-slate-500 mt-0.5 truncate max-w-xs">{item.clearance}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div className="font-medium">{item.department}</div>
                          <div className="text-[10px] text-slate-400">{item.division}</div>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => !isSelf && handleToggleStatus(item)}
                            disabled={isSelf}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === 'INACTIVE'
                                ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            } ${isSelf ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                          >
                            {item.status === 'INACTIVE' ? (
                              <>
                                <ToggleLeft className="h-3.5 w-3.5 text-slate-400" /> INACTIVE
                              </>
                            ) : (
                              <>
                                <ToggleRight className="h-3.5 w-3.5 text-emerald-600" /> ACTIVE
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[10px]">
                          {item.last_login ? new Date(item.last_login).toLocaleString('en-IN') : 'Never'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenRoleModal(item)}
                              className="text-[10px] h-7 px-2 border-blue-300 text-[#0B2545] hover:bg-blue-50 font-bold"
                            >
                              {t('users.change_role_btn', 'Change Role')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenResetModal(item)}
                              className="text-[10px] h-7 px-2 border-slate-300 text-slate-700 hover:bg-slate-100"
                              title="Reset Password"
                            >
                              <KeyRound className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Modification Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-[#0B2545] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-300" />
                <h3 className="font-bold text-sm">
                  {t('users.modal_role_title', 'Modify Officer Role & Clearances')}
                </h3>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="p-5 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded text-xs text-rose-800">
                  {actionError}
                </div>
              )}
              {actionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800">{selectedUser.full_name}</div>
                <div className="text-slate-500 font-mono">{selectedUser.email}</div>
                <div className="text-slate-600">Current Role: <span className="font-bold">{selectedUser.role}</span></div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  {t('users.select_role', 'Select New Role Clearance')}
                </label>
                <div className="space-y-2">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      targetRole === 'ADMIN' ? 'border-[#0B2545] bg-amber-50/50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="ADMIN"
                      checked={targetRole === 'ADMIN'}
                      onChange={() => setTargetRole('ADMIN')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-xs text-[#0B2545]">
                        {t('users.role_admin_option', 'ADMIN — Senior DOM / Executive Approval Authority')}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Class-A Final Human Approval Authority, CP-SAT Algorithm Tuning, User Management.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      targetRole === 'PLANNER' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="PLANNER"
                      checked={targetRole === 'PLANNER'}
                      onChange={() => setTargetRole('PLANNER')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-xs text-[#134074]">
                        {t('users.role_planner_option', 'PLANNER — Section Controller / Traffic Scheduling')}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Real-time train movements, headway regulation, block proposals & what-if simulation.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      targetRole === 'WORKER' ? 'border-rose-600 bg-rose-50/50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="WORKER"
                      checked={targetRole === 'WORKER'}
                      onChange={() => setTargetRole('WORKER')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-xs text-[#A6192E]">
                        {t('users.role_worker_option', 'WORKER — Senior Section Engineer (P-Way / Field Staff)')}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Field work orders, rail renewal requisitions, USFD flaw register, tamping slots.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 bg-blue-50 p-2.5 rounded border border-blue-200">
                Live Session Sync: Role changes update immediately in memory for any active sessions and write an immutable audit log.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRoleModal(false)}
                  className="text-xs"
                >
                  {t('btn.cancel', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-bold flex items-center gap-1.5"
                >
                  {actionLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>{t('users.btn_save_role', 'Update Role Sanction')}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Reset Password Modal */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-[#0B2545] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-300" />
                <h3 className="font-bold text-sm">Administrative Password Reset</h3>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveResetPassword} className="p-5 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded text-xs text-rose-800">
                  {actionError}
                </div>
              )}
              {actionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              <div className="text-xs text-slate-600">
                Set a new PIN or password for <strong className="text-slate-800">{selectedUser.full_name}</strong> ({selectedUser.email}).
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">New Password</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-[#0B2545]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowResetModal(false)}
                  className="text-xs"
                >
                  {t('btn.cancel', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-bold flex items-center gap-1.5"
                >
                  {actionLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>Update Password</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#0B2545] text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-amber-300" />
                <h3 className="font-bold text-sm">Create Personnel Account</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-3.5 overflow-y-auto">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded text-xs text-rose-800">
                  {actionError}
                </div>
              )}
              {actionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                    placeholder="e.g. Shri R. K. Gupta"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs outline-none focus:ring-2 focus:ring-[#0B2545]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">RailNet Email *</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="officer@cr.railnet.gov.in"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono outline-none focus:ring-2 focus:ring-[#0B2545]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Username</label>
                  <input
                    type="text"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    placeholder="e.g. rkgupta"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono outline-none focus:ring-2 focus:ring-[#0B2545]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Assigned Role *</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-bold text-[#0B2545] outline-none focus:ring-2 focus:ring-[#0B2545]"
                  >
                    <option value="ADMIN">ADMIN (Sr. DOM / Approver)</option>
                    <option value="PLANNER">PLANNER (Section Controller)</option>
                    <option value="WORKER">WORKER (SSE P-Way / Field)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Department</label>
                  <input
                    type="text"
                    value={createForm.department}
                    onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs outline-none focus:ring-2 focus:ring-[#0B2545]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Designation</label>
                  <input
                    type="text"
                    value={createForm.designation}
                    onChange={(e) => setCreateForm({ ...createForm, designation: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs outline-none focus:ring-2 focus:ring-[#0B2545]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Initial Password</label>
                <input
                  type="text"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Leave blank for default: RailNet@2026"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono outline-none focus:ring-2 focus:ring-[#0B2545]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs"
                >
                  {t('btn.cancel', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-bold flex items-center gap-1.5"
                >
                  {actionLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>Save Account</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
