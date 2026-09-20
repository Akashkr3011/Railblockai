import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useEventStore, RailBlockEvent } from '@/stores/eventStore'

export function useRealtime(wsUrl?: string) {
  const queryClient = useQueryClient()
  const { setConnectionState, setLastEvent } = useEventStore()
  const eventSourceRef = useRef<EventSource | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    let isCancelled = false

    const handleEvent = (event: RailBlockEvent) => {
      if (!event || !event.event_type) return
      setLastEvent(event)

      // Invalidate relevant query keys based on domain event
      switch (event.event_type) {
        case 'MAINTENANCE_UPDATED':
          queryClient.invalidateQueries({ queryKey: ['maintenance'] })
          break
        case 'DEFECT_UPDATED':
          queryClient.invalidateQueries({ queryKey: ['defects'] })
          break
        case 'ASSET_STATUS_CHANGED':
          queryClient.invalidateQueries({ queryKey: ['assets'] })
          break
        case 'BLOCK_AVAILABILITY_CHANGED':
          queryClient.invalidateQueries({ queryKey: ['blocks'] })
          break
        case 'TRAIN_SCHEDULE_UPDATED':
        case 'TRAIN_POSITION_UPDATED':
          queryClient.invalidateQueries({ queryKey: ['trains'] })
          break
        case 'ALERT_GENERATED':
          queryClient.invalidateQueries({ queryKey: ['alerts'] })
          break
        case 'OPTIMIZATION_RESULT':
          queryClient.invalidateQueries({ queryKey: ['optimization'] })
          break
      }
    }

    const connectSSE = () => {
      try {
        setConnectionState('CONNECTING')
        const es = new EventSource('/api/v1/events/stream')
        eventSourceRef.current = es

        es.onopen = () => {
          if (!isCancelled) {
            setConnectionState('CONNECTED')
          }
        }

        es.onmessage = (event) => {
          if (isCancelled) return
          try {
            const data = JSON.parse(event.data) as RailBlockEvent
            handleEvent(data)
          } catch {
            // Ignore parse error
          }
        }

        es.onerror = () => {
          if (!isCancelled) {
            // Mark re-connecting, EventSource auto-retries in background
            setConnectionState('RECONNECTING')
          }
        }
      } catch {
        if (!isCancelled) {
          setConnectionState('CONNECTED')
        }
      }
    }

    // Check if a dedicated non-localhost WebSocket URL is explicitly specified
    const isValidCustomWS =
      Boolean(wsUrl) &&
      (wsUrl!.startsWith('ws://') || wsUrl!.startsWith('wss://')) &&
      !wsUrl!.includes('localhost:8000')

    if (isValidCustomWS) {
      try {
        setConnectionState('CONNECTING')
        const ws = new WebSocket(wsUrl!)
        wsRef.current = ws

        ws.onopen = () => {
          if (!isCancelled) {
            setConnectionState('CONNECTED')
          }
        }

        ws.onmessage = (event) => {
          if (isCancelled) return
          try {
            const data = JSON.parse(event.data) as RailBlockEvent
            handleEvent(data)
          } catch {
            // Ignore parse error
          }
        }

        ws.onerror = () => {
          // Gracefully fallback to SSE without logging noisy browser errors
          if (wsRef.current) {
            wsRef.current.close()
            wsRef.current = null
          }
          if (!isCancelled && !eventSourceRef.current) {
            connectSSE()
          }
        }

        ws.onclose = () => {
          if (!isCancelled && !eventSourceRef.current) {
            connectSSE()
          }
        }
      } catch {
        connectSSE()
      }
    } else {
      // Default to Server-Sent Events (SSE) which is natively supported over HTTP port 3000
      connectSSE()
    }

    return () => {
      isCancelled = true
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [wsUrl, queryClient, setConnectionState, setLastEvent])
}
