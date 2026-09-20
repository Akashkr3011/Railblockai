import { create } from 'zustand'

export type ConnectionState = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING'
export type SimulationState = 'LIVE' | 'SIMULATED' | 'REPLAY' | 'STALE' | 'OFFLINE'

export interface RailBlockEvent {
  event_id: string
  event_type: string
  source: string
  source_record_id?: string
  timestamp: string
  data_timestamp: string
  received_timestamp?: string
  payload: Record<string, any>
  data_quality: number
  simulation_state: SimulationState
}

interface EventStore {
  connectionState: ConnectionState
  lastEvent: RailBlockEvent | null
  setConnectionState: (state: ConnectionState) => void
  setLastEvent: (event: RailBlockEvent) => void
}

export const useEventStore = create<EventStore>((set) => ({
  connectionState: 'DISCONNECTED',
  lastEvent: null,
  setConnectionState: (state) => set({ connectionState: state }),
  setLastEvent: (event) => set({ lastEvent: event }),
}))
