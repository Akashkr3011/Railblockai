import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { Simulation } from '@/pages/Simulation'
import * as api from '@/lib/api'

vi.mock('@/lib/api', () => ({
  simulationApi: {
    getScenarios: vi.fn(),
    getState: vi.fn(),
    load: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    step: vi.fn(),
    reset: vi.fn(),
    setSpeed: vi.fn(),
  }
}))

describe('Simulation Workspace', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  it('renders simulation scenarios correctly', async () => {
    vi.mocked(api.simulationApi.getScenarios).mockResolvedValue([
      { id: 'demo_urgent_defect', name: 'Urgent Critical Defect' }
    ])
    vi.mocked(api.simulationApi.getState).mockResolvedValue({
      is_running: false, is_paused: false, events_remaining: 0
    })

    render(<QueryClientProvider client={queryClient}><MemoryRouter><Simulation /></MemoryRouter></QueryClientProvider>)
    
    expect(screen.getByText(/Simulation & Replay Engine/i)).toBeTruthy()
    await waitFor(() => {
      expect(screen.getByText('Urgent Critical Defect')).toBeTruthy()
    })
  })

  it('handles load and play controls', async () => {
    vi.mocked(api.simulationApi.getScenarios).mockResolvedValue([
      { id: 'demo_train_delay', name: 'Train Delay Affecting Block' }
    ])
    vi.mocked(api.simulationApi.getState).mockResolvedValue({
      is_running: true, is_paused: false, scenario_name: 'Train Delay Affecting Block', events_remaining: 3
    })

    render(<QueryClientProvider client={queryClient}><MemoryRouter><Simulation /></MemoryRouter></QueryClientProvider>)
    
    await waitFor(() => {
      expect(screen.getByText(/Loaded: Train Delay Affecting Block/i)).toBeTruthy()
    })
  })
})
