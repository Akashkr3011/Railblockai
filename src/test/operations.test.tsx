/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { Assets } from '@/pages/Assets'
import { Maintenance } from '@/pages/Maintenance'
import { TrainOperations } from '@/pages/TrainOperations'
import { Network } from '@/pages/Network'
import { BlockPlanner } from '@/pages/BlockPlanner'
import { Optimization } from '@/pages/Optimization'
import { Scenarios } from '@/pages/Scenarios'
import { Alerts } from '@/pages/Alerts'
import { Reports } from '@/pages/Reports'
import { Audit } from '@/pages/Audit'
import * as api from '@/lib/api'

// Mock the APIs
vi.mock('@/lib/api', () => ({
  assetsApi: { list: vi.fn(), get: vi.fn() },
  maintenanceApi: { list: vi.fn(), get: vi.fn() },
  trainsApi: { list: vi.fn(), get: vi.fn() },
  blocksApi: { list: vi.fn(), get: vi.fn() },
  optimizationApi: { runBaseline: vi.fn(), compare: vi.fn(), explainDecision: vi.fn(), validateChange: vi.fn() },
  conflictsApi: { detect: vi.fn() },
  priorityApi: { explainTask: vi.fn() },
  healthApi: { getHealth: vi.fn() },
  alertsApi: { list: vi.fn(), resolve: vi.fn() },
  auditApi: { list: vi.fn() },
}))

window.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const createTestQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } }
})

describe('Operational Pages', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    vi.clearAllMocks()
  })

  it('Assets page renders loading, then data', async () => {
    vi.mocked(api.assetsApi.list).mockResolvedValue({
      items: [{ id: '1', asset_number: 'TRK-100', asset_type: 'TRACK', condition: 'GOOD', criticality: 'HIGH', is_active: true }]
    })
    render(<QueryClientProvider client={queryClient}><MemoryRouter><Assets /></MemoryRouter></QueryClientProvider>)
    await waitFor(() => expect(screen.getByText('TRK-100')).toBeTruthy())
  })

  it('Maintenance page renders data', async () => {
    vi.mocked(api.maintenanceApi.list).mockResolvedValue({
      items: [{ id: '1', task_id: 'TSK-200', task_type: 'REPAIR', priority: 'CRITICAL', status: 'PENDING', estimated_duration_minutes: 120 }]
    })
    render(<QueryClientProvider client={queryClient}><MemoryRouter><Maintenance /></MemoryRouter></QueryClientProvider>)
    await waitFor(() => expect(screen.getByText('TSK-200')).toBeTruthy())
  })

  it('BlockPlanner page renders blocks with timeline', async () => {
    vi.mocked(api.blocksApi.list).mockResolvedValue({
      items: [{ id: 'blk-1', block_type: 'MAINTENANCE', status: 'APPROVED', start_time: '2026-09-15T02:00:00Z', end_time: '2026-09-15T06:00:00Z', section_id: 'sec-1' }]
    })
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter><BlockPlanner /></MemoryRouter>
      </QueryClientProvider>
    )
    await waitFor(() => {
      expect(screen.getByText('blk-1')).toBeTruthy()
      expect(screen.getByText('MAINTENANCE')).toBeTruthy()
    })
  })

  it('Optimization page executes comparison and displays metrics', async () => {
    vi.mocked(api.optimizationApi.compare).mockResolvedValue({
      optimized: { solver_status: 'OPTIMAL', solve_time_seconds: 0.5 },
      metrics_comparison: {
         tasks_scheduled: { baseline_value: 10, optimized_value: 15, improvement_percentage: 50 }
      }
    })
    
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter><Optimization /></MemoryRouter>
      </QueryClientProvider>
    )
    
    // Config page loads
    expect(screen.getByText('Solver Configuration')).toBeTruthy()
    
    // Simulate run
    const runBtn = screen.getByText(/Run Optimizer/i)
    runBtn.click()
    
    // Metrics render
    await waitFor(() => {
      expect(screen.getByText('Solver Status: OPTIMAL')).toBeTruthy()
      expect(screen.getByText('tasks scheduled')).toBeTruthy()
      expect(screen.getByText('15')).toBeTruthy()
    })
  })

  it('TrainOperations page renders data', async () => {
    vi.mocked(api.trainsApi.list).mockResolvedValue({
      items: [{ id: '1', train_number: '12951', train_name: 'Rajdhani Exp', train_type: 'PASSENGER', is_active: true, average_delay_minutes: 5, max_speed_kmh: 130 }]
    })
    render(<QueryClientProvider client={queryClient}><MemoryRouter><TrainOperations /></MemoryRouter></QueryClientProvider>)
    await waitFor(() => expect(screen.getByText('12951')).toBeTruthy())
  })

  it('Network page renders map placeholder and synthetic warning', async () => {
    render(<QueryClientProvider client={queryClient}><MemoryRouter><Network /></MemoryRouter></QueryClientProvider>)
    expect(screen.getByText(/SYNTHETIC GEOSPATIAL DATA/i)).toBeTruthy()
  })

  it('Scenarios page renders and simulates', async () => {
    vi.mocked(api.optimizationApi.compare).mockResolvedValue({
      optimized: { solver_status: 'FEASIBLE', solve_time_seconds: 1.2 },
      metrics_comparison: { downtime: { baseline_value: 10, optimized_value: 8 } }
    })
    render(<QueryClientProvider client={queryClient}><MemoryRouter><Scenarios /></MemoryRouter></QueryClientProvider>)
    expect(screen.getByText(/Scenario Planning/i)).toBeTruthy()
    const runBtn = screen.getByText(/Run Scenario/i)
    runBtn.click()
    await waitFor(() => expect(screen.getByText(/FEASIBLE/i)).toBeTruthy())
  })

  it('Alerts page renders unresolved alerts', async () => {
    vi.mocked(api.alertsApi.list).mockResolvedValue([
      { id: '1', title: 'Test Alert', message: 'Danger', severity: 'CRITICAL', alert_type: 'CONFLICT', is_resolved: false, created_at: '2026-09-15T00:00:00Z' }
    ])
    render(<QueryClientProvider client={queryClient}><MemoryRouter><Alerts /></MemoryRouter></QueryClientProvider>)
    await waitFor(() => expect(screen.getByText('Test Alert')).toBeTruthy())
  })

  it('Reports page aggregates available metrics', async () => {
    vi.mocked(api.maintenanceApi.list).mockResolvedValue({ items: [] })
    vi.mocked(api.blocksApi.list).mockResolvedValue({ items: [] })
    render(<QueryClientProvider client={queryClient}><MemoryRouter><Reports /></MemoryRouter></QueryClientProvider>)
    await waitFor(() => expect(screen.getByText(/Operational Reports/i)).toBeTruthy())
  })

  it('Audit page handles missing API gracefully', async () => {
    vi.mocked(api.auditApi.list).mockRejectedValue(new Error('Not Found'))
    render(<QueryClientProvider client={queryClient}><MemoryRouter><Audit /></MemoryRouter></QueryClientProvider>)
    await waitFor(() => expect(screen.getByText(/DATA UNAVAILABLE/i)).toBeTruthy())
  })
})
