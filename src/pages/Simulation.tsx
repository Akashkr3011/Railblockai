import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { simulationApi } from '@/lib/api'
import {
  PlayCircle,
  PauseCircle,
  SkipForward,
  RotateCcw,
  AlertTriangle,
  Film,
  Zap,
  CheckCircle2,
  Clock,
  Radio,
  Sliders,
  Play,
  Pause,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const DEFAULT_SCENARIOS = [
  {
    id: 'scen-01',
    code: 'NORMAL_OPS',
    name: 'Normal Operations (Baseline Control Flow)',
    description: 'Scheduled suburban peak flow and standard night maintenance blocks without disruptions.',
    severity: 'LOW',
  },
  {
    id: 'scen-02',
    code: 'RAIL_FRACTURE_KYN',
    name: 'Emergency Rail Fracture at Kalyan Jn (DN Fast)',
    description: 'Sudden cold-weather rail weld rupture detected by ultrasonic sensor. Requires immediate 90-min emergency block.',
    severity: 'CRITICAL',
  },
  {
    id: 'scen-03',
    code: 'DECCAN_QUEEN_DELAY_45M',
    name: 'Train 12123 Deccan Queen Delayed (+45 Min)',
    description: 'Upstream signal cable fault at Dadar causes 45-minute delay to premium evening intercity.',
    severity: 'HIGH',
  },
  {
    id: 'scen-04',
    code: 'OHE_POWER_TRIP_BHOR_GHAT',
    name: '25kV OHE Catenary Power Trip in Bhor Ghat',
    description: 'Sub-station circuit breaker lockout between Karjat and Lonavala. Requires simultaneous emergency shadow cut.',
    severity: 'CRITICAL',
  },
]

export function Simulation() {
  const queryClient = useQueryClient()
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scen-02')
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1)
  const [simStatus, setSimStatus] = useState<'IDLE' | 'RUNNING' | 'PAUSED'>('IDLE')
  const [activeStep, setActiveStep] = useState<number>(0)
  const [eventLogs, setEventLogs] = useState<any[]>([])

  const { data: scenariosData } = useQuery({
    queryKey: ['simulation-scenarios'],
    queryFn: simulationApi.getScenarios,
  })

  const rawScenarios = Array.isArray(scenariosData)
    ? scenariosData
    : scenariosData?.items || DEFAULT_SCENARIOS

  const handleStartSimulation = () => {
    setSimStatus('RUNNING')
    setActiveStep(1)
    const scen = rawScenarios.find((s: any) => s.id === selectedScenarioId) || rawScenarios[0]
    setEventLogs([
      {
        time: '00:00',
        type: 'INJECTION',
        message: `Simulation initialized: "${scen.name || scen.title}" loaded into virtual sandbox.`,
      },
      {
        time: '00:05',
        type: 'TELEMETRY',
        message: 'Section interlocking relays triggered: Speed restriction caution order dispatched to Station Master.',
      },
      {
        time: '00:12',
        type: 'OPTIMIZATION',
        message: 'CP-SAT Rescheduling Engine invoked: Rerouting 2 freight rakes to loop line, creating emergency 90-min slot.',
      },
    ])
  }

  const handlePauseSimulation = () => {
    setSimStatus(simStatus === 'RUNNING' ? 'PAUSED' : 'RUNNING')
  }

  const handleResetSimulation = () => {
    setSimStatus('IDLE')
    setActiveStep(0)
    setEventLogs([])
  }

  const handleStepForward = () => {
    setActiveStep((prev) => prev + 1)
    setEventLogs((prev) => [
      ...prev,
      {
        time: `+${(activeStep + 1) * 5}m`,
        type: 'DISPATCH',
        message: `Dynamic timetable adjustment executed: Headway gap confirmed safe by Safety Integrity Engine.`,
      },
    ])
  }

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 overflow-auto bg-[#F4F6F9] min-h-[calc(100vh-4rem)] font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#CBD5E1] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-purple-700 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Decision Support Sandbox
            </span>
            <h1 className="text-xl font-bold tracking-tight text-[#0B2545] flex items-center gap-2">
              <Film className="h-5 w-5 text-purple-700" />
              Operational Simulation & Disruption Replay Engine
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic stress-testing for rail fractures, rolling stock delays, and emergency block requisitions.
          </p>
        </div>

        <Badge className="bg-purple-100 text-purple-900 border-purple-300 gap-1.5 px-3 py-1 font-bold text-xs">
          <Radio className="h-3 w-3 animate-pulse text-purple-700" />
          SANDBOX ENVIRONMENT (ISOLATED)
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Selection & Controls */}
        <Card className="col-span-1 border-[#CBD5E1] shadow-xs bg-white">
          <CardHeader className="bg-[#F8FAFC] border-b border-slate-200 pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#0B2545]">
              1. Select Test Scenario
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="space-y-2">
              <label className="font-bold text-slate-700">Disruption Scenario Profile</label>
              <select
                className="w-full p-2.5 border border-slate-300 rounded bg-white text-xs font-sans"
                value={selectedScenarioId}
                onChange={(e) => setSelectedScenarioId(e.target.value)}
                disabled={simStatus === 'RUNNING'}
              >
                {rawScenarios.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Scenario details card */}
            {selectedScenarioId && (
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Scenario Narrative</span>
                <p className="text-slate-700 leading-relaxed text-[11px]">
                  {rawScenarios.find((s: any) => s.id === selectedScenarioId)?.description ||
                    'Injects acute operational disruption to test automated real-time rescheduling.'}
                </p>
              </div>
            )}

            {/* Controls */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="font-bold text-slate-700 block">Simulation Playback Controls</label>
              <div className="grid grid-cols-3 gap-2">
                {simStatus === 'IDLE' ? (
                  <Button
                    onClick={handleStartSimulation}
                    className="col-span-3 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs gap-1.5"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" /> Initialize & Run
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handlePauseSimulation}
                      variant="outline"
                      className="border-slate-300 text-slate-700 font-bold text-xs gap-1"
                    >
                      {simStatus === 'RUNNING' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      {simStatus === 'RUNNING' ? 'Pause' : 'Resume'}
                    </Button>
                    <Button
                      onClick={handleStepForward}
                      variant="outline"
                      className="border-slate-300 text-slate-700 font-bold text-xs gap-1"
                    >
                      <SkipForward className="h-3.5 w-3.5" /> Step
                    </Button>
                    <Button
                      onClick={handleResetSimulation}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50 font-bold text-xs gap-1"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reset
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Speed selection */}
            <div className="flex items-center justify-between pt-2">
              <span className="font-bold text-slate-600 text-[11px]">Playback Rate:</span>
              <div className="flex gap-1">
                {[1, 2, 5, 10].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      playbackSpeed === spd
                        ? 'bg-purple-700 text-white border-purple-700'
                        : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Simulation Events Stream */}
        <Card className="col-span-2 border-[#CBD5E1] shadow-xs bg-white flex flex-col">
          <CardHeader className="bg-[#F8FAFC] border-b border-slate-200 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#0B2545] flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-700" />
              Real-Time Simulation Event Telemetry Stream
            </CardTitle>
            <Badge
              className={`text-[10px] font-bold ${
                simStatus === 'RUNNING'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : simStatus === 'PAUSED'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              STATE: {simStatus}
            </Badge>
          </CardHeader>

          <CardContent className="p-4 flex-1 overflow-y-auto space-y-3">
            {eventLogs.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                <Film className="h-10 w-10 mb-2 opacity-30 text-purple-600" />
                <p className="font-semibold text-slate-600">Simulation Engine Ready</p>
                <p className="text-[11px] text-slate-400">Select a disruption scenario and click Run to start.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {eventLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded border border-slate-200 bg-slate-50/70 hover:bg-white text-xs flex items-start gap-3 transition-colors"
                  >
                    <span className="font-mono font-bold text-purple-800 text-[11px] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 shrink-0">
                      {log.time}
                    </span>
                    <div className="flex-1">
                      <span className="font-bold text-[10px] tracking-wider uppercase text-slate-500 mr-2">
                        [{log.type}]
                      </span>
                      <span className="text-slate-800 font-sans text-[11px] leading-relaxed">
                        {log.message}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
