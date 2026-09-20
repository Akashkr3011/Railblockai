"""
RAILBLOCK AI — Simulation & Replay Engine
"""
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from app.schemas.events import RailBlockEvent, SimulationState, EventType
from app.services.events_manager import event_manager
from app.services.simulation.scenarios import DEMO_SCENARIOS, SimulationScenario

logger = logging.getLogger(__name__)

class SimulationEngine:
    def __init__(self):
        self.is_running = False
        self.is_paused = False
        self.current_scenario: Optional[SimulationScenario] = None
        self.start_time: Optional[datetime] = None
        self.current_time_offset: int = 0
        self.speed_multiplier: float = 1.0
        
        self._task: Optional[asyncio.Task] = None
        self._events_queue = []

    def load_scenario(self, scenario_id: str):
        if self.is_running and not self.is_paused:
            raise ValueError("Cannot load scenario while running.")
            
        scenario = next((s for s in DEMO_SCENARIOS if s.id == scenario_id), None)
        if not scenario:
            raise ValueError(f"Scenario {scenario_id} not found.")
            
        self.current_scenario = scenario
        self.reset()
        logger.info(f"Loaded simulation scenario: {scenario.name}")
        return scenario

    def reset(self):
        self.is_running = False
        self.is_paused = False
        self.current_time_offset = 0
        self.start_time = None
        if self._task:
            self._task.cancel()
            self._task = None
        
        if self.current_scenario:
            # Sort actions by time offset just in case
            self._events_queue = sorted(self.current_scenario.actions, key=lambda x: x.time_offset_seconds)
            
        # Broadcast a reset event
        self._broadcast_state()

    def play(self):
        if not self.current_scenario:
            raise ValueError("No scenario loaded.")
            
        if self.is_running and not self.is_paused:
            return
            
        self.is_running = True
        self.is_paused = False
        
        if not self.start_time:
            self.start_time = datetime.now(timezone.utc)
            
        if not self._task or self._task.done():
            self._task = asyncio.create_task(self._run_loop())
            
        self._broadcast_state()

    def pause(self):
        if self.is_running:
            self.is_paused = True
            self._broadcast_state()

    def step(self):
        """Execute the next event immediately, advancing time to that event."""
        if not self.current_scenario or not self._events_queue:
            return
            
        self.is_running = False
        self.is_paused = True
        if self._task:
            self._task.cancel()
            self._task = None
            
        next_event = self._events_queue.pop(0)
        self.current_time_offset = next_event.time_offset_seconds
        
        # We need an async wrapper to broadcast
        asyncio.create_task(self._dispatch_event(next_event))
        self._broadcast_state()

    def set_speed(self, speed: float):
        if speed <= 0:
            raise ValueError("Speed must be > 0")
        self.speed_multiplier = speed
        self._broadcast_state()
        
    def get_state(self) -> Dict[str, Any]:
        return {
            "is_running": self.is_running,
            "is_paused": self.is_paused,
            "scenario_id": self.current_scenario.id if self.current_scenario else None,
            "scenario_name": self.current_scenario.name if self.current_scenario else None,
            "time_offset_seconds": self.current_time_offset,
            "speed_multiplier": self.speed_multiplier,
            "events_remaining": len(self._events_queue)
        }

    async def _run_loop(self):
        try:
            while self.is_running and self._events_queue:
                if self.is_paused:
                    await asyncio.sleep(0.5)
                    continue
                    
                next_event = self._events_queue[0]
                
                # Check if it's time to fire
                if self.current_time_offset >= next_event.time_offset_seconds:
                    event_action = self._events_queue.pop(0)
                    await self._dispatch_event(event_action)
                else:
                    # Advance time
                    sleep_time = 0.5 / self.speed_multiplier
                    await asyncio.sleep(sleep_time)
                    self.current_time_offset += 0.5
                    
            if not self._events_queue:
                self.is_running = False
                self.is_paused = False
                self._broadcast_state()
                
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Simulation loop error: {e}")
            self.is_running = False

    async def _dispatch_event(self, action):
        # We enforce SIMULATED explicitly to protect production
        event = RailBlockEvent(
            event_type=action.event_type,
            source=f"SIM_{action.source}",
            data_timestamp=datetime.now(timezone.utc),
            payload=action.payload,
            simulation_state=SimulationState.SIMULATED
        )
        logger.info(f"Simulation dispatching event: {event.event_type} at offset {action.time_offset_seconds}s")
        await event_manager.broadcast(event)

    def _broadcast_state(self):
        # Fire an internal state update event so frontend knows the engine state
        asyncio.create_task(event_manager.broadcast(
            RailBlockEvent(
                event_type=EventType.ALERT_GENERATED, # Using alert type generically, or could define SIMULATION_STATE
                source="SimulationEngine",
                data_timestamp=datetime.now(timezone.utc),
                payload={"simulation_state_update": self.get_state()},
                simulation_state=SimulationState.SIMULATED
            )
        ))

# Singleton instance
sim_engine = SimulationEngine()
