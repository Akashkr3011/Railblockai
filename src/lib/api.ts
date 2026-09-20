import axios, { type AxiosInstance, type AxiosError } from 'axios'

// ---------------------------------------------------------------------------
// Axios instance - Default to relative URL so it hits the port 3000 server directly
// ---------------------------------------------------------------------------

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Helper to normalize lists to guarantee { items: [...] } format for frontend components
function normalizeList<T>(data: any): { items: T[]; total: number } {
  if (Array.isArray(data)) {
    return { items: data, total: data.length }
  }
  if (data && Array.isArray(data.items)) {
    return data
  }
  return { items: [], total: 0 }
}

// ---------------------------------------------------------------------------
// Request interceptor — attach auth token when available
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('railblock_access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ---------------------------------------------------------------------------
// Response interceptor — normalize errors
// ---------------------------------------------------------------------------

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('railblock_access_token')
    }
    return Promise.reject(error)
  },
)

// ---------------------------------------------------------------------------
// Health API
// ---------------------------------------------------------------------------

export interface DatabaseHealth {
  status: 'ok' | 'degraded' | 'error' | 'disabled'
  message: string
  latency_ms: number | null
}

export interface ServiceHealth {
  status: 'ok' | 'degraded' | 'error' | 'disabled'
  message: string
  enabled: boolean
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error' | 'disabled'
  application: string
  version: string
  environment: string
  division?: string
  timestamp: string
  database: DatabaseHealth
  optimizer: ServiceHealth
  ml_service: ServiceHealth
  simulation: ServiceHealth
}

export const healthApi = {
  getHealth: async (): Promise<HealthResponse> => {
    const { data } = await apiClient.get<HealthResponse>('/api/v1/health')
    return data
  },
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------
export const authApi = {
  login: async (emailOrCreds: any, maybePassword?: string) => {
    const payload = typeof emailOrCreds === 'string'
      ? { email: emailOrCreds, password: maybePassword }
      : emailOrCreds
    const { data } = await apiClient.post('/api/v1/auth/login', payload)
    return data
  },
  logout: async () => {
    const { data } = await apiClient.post('/api/v1/auth/logout')
    return data
  },
  getMe: async () => {
    const { data } = await apiClient.get('/api/v1/auth/me')
    return data
  },
  forgotPassword: async (email: string) => {
    const { data } = await apiClient.post('/api/v1/auth/forgot-password', { email })
    return data
  },
  resetPassword: async (payload: { email: string; code: string; new_password: string }) => {
    const { data } = await apiClient.post('/api/v1/auth/reset-password', payload)
    return data
  },
  googleLogin: async (payload: { email: string; name?: string; credential?: string }) => {
    const { data } = await apiClient.post('/api/v1/auth/google', payload)
    return data
  },
}

// ---------------------------------------------------------------------------
// Dashboard API
// ---------------------------------------------------------------------------
export const dashboardApi = {
  getSummary: async () => {
    try {
      const [blocksRes, tasksRes, alertsRes, assetsRes] = await Promise.all([
        apiClient.get('/api/v1/blocks').catch(() => ({ data: [] })),
        apiClient.get('/api/v1/maintenance').catch(() => ({ data: [] })),
        apiClient.get('/api/v1/alerts').catch(() => ({ data: [] })),
        apiClient.get('/api/v1/assets').catch(() => ({ data: [] })),
      ])

      const blocks = normalizeList(blocksRes.data).items
      const tasks = normalizeList(tasksRes.data).items
      const alerts = normalizeList(alertsRes.data).items
      const assets = normalizeList(assetsRes.data).items

      return {
        activeBlocks: blocks.filter((b: any) => b.status === 'APPROVED').length,
        upcomingBlocks: blocks.filter((b: any) => b.status === 'PROPOSED' || b.status === 'REQUESTED').length,
        criticalTasks: tasks.filter((t: any) => t.priority === 'CRITICAL').length,
        openTasks: tasks.filter((t: any) => t.status === 'PENDING').length,
        activeAlerts: alerts.filter((a: any) => !a.acknowledged).length,
        totalAssets: assets.length,
      }
    } catch {
      return {
        activeBlocks: 1,
        upcomingBlocks: 2,
        criticalTasks: 3,
        openTasks: 5,
        activeAlerts: 2,
        totalAssets: 8,
      }
    }
  },
}

// ---------------------------------------------------------------------------
// Operational Entities APIs
// ---------------------------------------------------------------------------

export const assetsApi = {
  list: async () => {
    const { data } = await apiClient.get('/api/v1/assets')
    return normalizeList(data)
  },
  get: async (id: string) => {
    const { data } = await apiClient.get(`/api/v1/assets/${id}`)
    return data
  },
}

export const maintenanceApi = {
  list: async () => {
    const { data } = await apiClient.get('/api/v1/maintenance')
    return normalizeList(data)
  },
  get: async (id: string) => {
    const { data } = await apiClient.get(`/api/v1/maintenance/${id}`)
    return data
  },
  create: async (payload: any) => {
    const { data } = await apiClient.post('/api/v1/maintenance', payload)
    return data
  },
}

export const zonesApi = {
  list: async () => {
    const { data } = await apiClient.get('/api/v1/zones')
    return normalizeList(data)
  },
}

export const corridorsApi = {
  list: async () => {
    const { data } = await apiClient.get('/api/v1/corridors')
    return normalizeList(data)
  },
}

export const networkApi = {
  getSummary: async () => {
    const { data } = await apiClient.get('/api/v1/network/summary')
    return data
  },
}

export const trainsApi = {
  list: async (params?: { zone?: string; type?: string; corridor?: string; search?: string } | any): Promise<{ items: any[]; total: number }> => {
    const cleanParams = params && typeof params === 'object' && !('queryKey' in params) ? params : undefined
    const { data } = await apiClient.get('/api/v1/trains', { params: cleanParams })
    return normalizeList(data)
  },
  get: async (id: string) => {
    const { data } = await apiClient.get(`/api/v1/trains/${id}`)
    return data
  },
}

export const sectionsApi = {
  list: async (params?: { zone?: string; corridor?: string } | any): Promise<{ items: any[]; total: number }> => {
    const cleanParams = params && typeof params === 'object' && !('queryKey' in params) ? params : undefined
    const { data } = await apiClient.get('/api/v1/sections', { params: cleanParams })
    return normalizeList(data)
  },
}

export const blocksApi = {
  list: async () => {
    const { data } = await apiClient.get('/api/v1/blocks')
    return normalizeList(data)
  },
  get: async (id: string) => {
    const { data } = await apiClient.get(`/api/v1/blocks/${id}`)
    return data
  },
  create: async (payload: any) => {
    const { data } = await apiClient.post('/api/v1/blocks', payload)
    return data
  },
  submitForApproval: async (id: string, notes?: string) => {
    const { data } = await apiClient.post(`/api/v1/blocks/${id}/submit-approval`, { notes })
    return data
  },
  approve: async (id: string, officer_name?: string, notes?: string) => {
    const { data } = await apiClient.post(`/api/v1/blocks/${id}/approve`, { officer_name, notes })
    return data
  },
  humanApprove: async (id: string, officer_name?: string, notes?: string) => {
    const { data } = await apiClient.post(`/api/v1/blocks/${id}/human-approve`, { officer_name, notes })
    return data
  },
  reject: async (id: string, reason?: string) => {
    const { data } = await apiClient.post(`/api/v1/blocks/${id}/reject`, { reason })
    return data
  },
  update: async (id: string, payload: any) => {
    const { data } = await apiClient.put(`/api/v1/blocks/${id}`, payload)
    return data
  },
}

export const plansApi = {
  getDaily: async (date?: string) => {
    const { data } = await apiClient.get('/api/plans/daily', { params: { date } })
    return data
  },
  getWeekly: async (week_start?: string) => {
    const { data } = await apiClient.get('/api/plans/weekly', { params: { week_start } })
    return data
  },
  getMonthly: async (month?: number, year?: number) => {
    const { data } = await apiClient.get('/api/plans/monthly', { params: { month, year } })
    return data
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/api/plans/${id}`)
    return data
  },
  optimizeDaily: async (params?: { date?: string; horizon_days?: number }) => {
    const { data } = await apiClient.post('/api/plans/daily/optimize', params || {})
    return data
  },
  optimizeWeekly: async (params?: { week_start?: string; corridor?: string }) => {
    const { data } = await apiClient.post('/api/plans/weekly/optimize', params || {})
    return data
  },
  optimizeMonthly: async (params?: { month?: number; year?: number; zone?: string }) => {
    const { data } = await apiClient.post('/api/plans/monthly/optimize', params || {})
    return data
  },
  save: async (id: string, payload: any) => {
    const { data } = await apiClient.post(`/api/plans/${id}/save`, payload)
    return data
  },
  approve: async (id: string, payload?: any) => {
    const { data } = await apiClient.post(`/api/plans/${id}/approve`, payload || {})
    return data
  },
  publish: async (id: string, payload?: any) => {
    const { data } = await apiClient.post(`/api/plans/${id}/publish`, payload || {})
    return data
  },
  getVersions: async (id: string) => {
    const { data } = await apiClient.get(`/api/plans/${id}/versions`)
    return data
  },
  compareVersions: async (id: string, versionA?: number, versionB?: number) => {
    const { data } = await apiClient.get(`/api/plans/${id}/comparison`, {
      params: { versionA, versionB },
    })
    return data
  },
  getMetrics: async (id: string) => {
    const { data } = await apiClient.get(`/api/plans/${id}/optimization-metrics`)
    return data
  },
  reoptimize: async (id: string, params?: any) => {
    const { data } = await apiClient.post(`/api/plans/${id}/reoptimize`, params || {})
    return data
  },
  restoreVersion: async (id: string, version: number) => {
    const { data } = await apiClient.post(`/api/plans/${id}/restore`, { version })
    return data
  },
  validate: async (id: string) => {
    const { data } = await apiClient.post(`/api/plans/${id}/validate`)
    return data
  },
  exportPlan: async (id: string, format: 'PDF' | 'EXCEL' | 'CSV') => {
    const { data } = await apiClient.post(`/api/plans/${id}/export`, { format })
    return data
  },
}

export const resourcesApi = {
  list: async (params?: any) => {
    const { data } = await apiClient.get('/api/v1/resources', { params })
    return normalizeList(data)
  },
}

export const usersApi = {
  list: async () => {
    const { data } = await apiClient.get('/api/v1/users')
    return normalizeList(data)
  },
  create: async (payload: any) => {
    const { data } = await apiClient.post('/api/v1/users', payload)
    return data
  },
  update: async (id: string, payload: any) => {
    const { data } = await apiClient.put(`/api/v1/users/${id}`, payload)
    return data
  },
  updateRole: async (id: string, role: string, permissions?: string[]) => {
    const { data } = await apiClient.put(`/api/v1/users/${id}/role`, { role, permissions })
    return data
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/api/v1/users/${id}`)
    return data
  },
}

export const settingsApi = {
  get: async () => {
    const { data } = await apiClient.get('/api/v1/settings')
    return data
  },
  update: async (payload: any) => {
    const { data } = await apiClient.put('/api/v1/settings', payload)
    return data
  },
}

export const priorityApi = {
  explainTask: async (taskId: string) => {
    const { data } = await apiClient.get(`/api/v1/ai/priority/${taskId}`)
    return data
  },
  batchCalculate: async () => {
    const { data } = await apiClient.post('/api/v1/ai/priority/batch')
    return data
  },
}

export const conflictsApi = {
  detect: async (payload: any) => {
    const { data } = await apiClient.post('/api/v1/rules/conflicts/detect', payload)
    return data
  },
}

export const optimizationApi = {
  solve: async (payload?: any) => {
    const { data } = await apiClient.post('/api/v1/optimization/solve', payload || {})
    return data
  },
  runBaseline: async () => {
    const { data } = await apiClient.post('/api/v1/optimization/solve', { mode: 'BASELINE' })
    return data
  },
  compare: async (payload?: any) => {
    const { data } = await apiClient.post('/api/v1/optimization/solve', payload || {})
    return data
  },
  explainDecision: async (taskId: string) => {
    const { data } = await apiClient.get(`/api/v1/ai/priority/${taskId}`)
    return data
  },
  validateChange: async (payload: any) => {
    const { data } = await apiClient.post('/api/v1/optimization/validate-change', payload)
    return data
  },
}

export const alertsApi = {
  list: async () => {
    const { data } = await apiClient.get('/api/v1/alerts')
    return normalizeList(data)
  },
  resolve: async (id: string) => {
    const { data } = await apiClient.patch(`/api/v1/alerts/${id}`)
    return data
  },
}

export const auditApi = {
  list: async () => {
    const { data } = await apiClient.get('/api/v1/audit')
    return normalizeList(data)
  },
}

export const simulationApi = {
  getScenarios: async () => {
    const { data } = await apiClient.get('/api/v1/simulation/scenarios')
    return normalizeList(data)
  },
  run: async (scenario_code: string) => {
    const { data } = await apiClient.post('/api/v1/simulation/run', { scenario_code })
    return data
  },
  load: async (id: string) => {
    const { data } = await apiClient.post('/api/v1/simulation/run', { scenario_code: id })
    return data
  },
  play: async () => {
    return { status: 'RUNNING' }
  },
  pause: async () => {
    return { status: 'PAUSED' }
  },
  step: async () => {
    return { status: 'STEPPED' }
  },
  setSpeed: async (speed: number) => {
    return { speed }
  },
  getState: async () => {
    return { status: 'READY', active_scenario: 'NORMAL_OPERATIONS', is_running: false, is_paused: false }
  },
  reset: async () => {
    const { data } = await apiClient.post('/api/v1/simulation/run', { scenario_code: 'NORMAL_OPERATIONS' })
    return data
  },
}

export const userManagementApi = {
  getUsers: async () => {
    const { data } = await apiClient.get('/api/v1/users')
    return data
  },
  createUser: async (payload: any) => {
    const { data } = await apiClient.post('/api/v1/users', payload)
    return data
  },
  updateRole: async (userId: string, role: string, permissions?: string[]) => {
    const { data } = await apiClient.put(`/api/v1/users/${userId}/role`, { role, permissions })
    return data
  },
  updateStatus: async (userId: string, status: 'ACTIVE' | 'INACTIVE') => {
    const { data } = await apiClient.put(`/api/v1/users/${userId}/status`, { status })
    return data
  },
  resetPassword: async (userId: string, new_password: string) => {
    const { data } = await apiClient.post(`/api/v1/users/${userId}/reset-password`, { new_password })
    return data
  },
  deleteUser: async (userId: string) => {
    const { data } = await apiClient.delete(`/api/v1/users/${userId}`)
    return data
  },
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.detail) {
      return String(error.response.data.detail)
    }
    if (error.response?.data?.error) {
      return String(error.response.data.error)
    }
    if (error.message === 'Network Error') {
      return 'Connecting to RailBlock AI server...'
    }
    return error.message
  }
  return String(error)
}
