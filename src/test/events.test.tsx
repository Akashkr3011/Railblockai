import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEventStore } from '@/stores/eventStore'
import { Header } from '@/components/layout/Header'

// Mock useAuth to avoid errors
vi.mock('@/lib/auth', () => ({
  useAuth: () => ({ user: { full_name: 'Test User' }, logout: vi.fn() })
}))

vi.mock('@/lib/api', () => ({
  healthApi: { getHealth: vi.fn().mockResolvedValue({ status: 'ok' }) }
}))

describe('Realtime Events Logic', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
    // Reset store
    useEventStore.setState({ connectionState: 'DISCONNECTED', lastEvent: null })
  })

  it('renders OFFLINE when disconnected', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Header />
      </QueryClientProvider>
    )
    expect(screen.getByText('OFFLINE')).toBeDefined()
  })

  it('renders SIMULATED DATA when connected with simulation event', () => {
    useEventStore.setState({
      connectionState: 'CONNECTED',
      lastEvent: {
        event_id: '1',
        event_type: 'MAINTENANCE_UPDATED',
        source: 'TEST',
        timestamp: new Date().toISOString(),
        data_timestamp: new Date().toISOString(),
        payload: {},
        data_quality: 1,
        simulation_state: 'SIMULATED'
      }
    })
    render(
      <QueryClientProvider client={queryClient}>
        <Header />
      </QueryClientProvider>
    )
    expect(screen.getByText('SIMULATED DATA')).toBeDefined()
    expect(screen.queryByText('LIVE')).toBeNull() // Should not show LIVE
  })

  it('renders STALE state if event is old', () => {
    const oldDate = new Date()
    oldDate.setHours(oldDate.getHours() - 2)
    useEventStore.setState({
      connectionState: 'CONNECTED',
      lastEvent: {
        event_id: '1',
        event_type: 'MAINTENANCE_UPDATED',
        source: 'TEST',
        timestamp: oldDate.toISOString(),
        data_timestamp: oldDate.toISOString(),
        payload: {},
        data_quality: 1,
        simulation_state: 'LIVE'
      }
    })
    render(
      <QueryClientProvider client={queryClient}>
        <Header />
      </QueryClientProvider>
    )
    expect(screen.getByText(/Stale/i)).toBeDefined()
  })
})
