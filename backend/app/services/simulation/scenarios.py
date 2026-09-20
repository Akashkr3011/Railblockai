"""
RAILBLOCK AI — Simulation Scenarios Definition
"""
from typing import List, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.schemas.events import EventType

class SimulationAction(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    time_offset_seconds: int
    event_type: EventType
    source: str
    payload: Dict[str, Any]

class SimulationScenario(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    description: str
    actions: List[SimulationAction]

# Deterministic Scenarios for SIH Demo
DEMO_SCENARIOS = [
    SimulationScenario(
        id="demo_urgent_defect",
        name="Urgent Critical Defect",
        description="A track defect is detected, escalating to critical. Forces an immediate priority shift.",
        actions=[
            SimulationAction(
                time_offset_seconds=10,
                event_type=EventType.DEFECT_UPDATED,
                source="TrackMonitor_IOT",
                payload={"defect_id": "DEF-9001", "status": "REPORTED", "severity": "HIGH", "location": "KM-142", "message": "High vibration detected on track."}
            ),
            SimulationAction(
                time_offset_seconds=20,
                event_type=EventType.DEFECT_UPDATED,
                source="Engineering_Validation",
                payload={"defect_id": "DEF-9001", "status": "VERIFIED", "severity": "CRITICAL", "location": "KM-142", "message": "Rail fracture confirmed. Immediate block required."}
            ),
            SimulationAction(
                time_offset_seconds=25,
                event_type=EventType.ALERT_GENERATED,
                source="ConflictEngine",
                payload={"alert_id": "ALT-1", "severity": "CRITICAL", "message": "Critical defect at KM-142 overlaps with upcoming train schedules."}
            )
        ]
    ),
    SimulationScenario(
        id="demo_train_delay",
        name="Train Delay Affecting Block",
        description="A major passenger train is delayed, running into a scheduled maintenance block window.",
        actions=[
            SimulationAction(
                time_offset_seconds=10,
                event_type=EventType.TRAIN_POSITION_UPDATED,
                source="NTES_Feed",
                payload={"train_id": "TRN-12951", "delay_minutes": 15, "station": "BCT"}
            ),
            SimulationAction(
                time_offset_seconds=20,
                event_type=EventType.TRAIN_SCHEDULE_UPDATED,
                source="NTES_Feed",
                payload={"train_id": "TRN-12951", "delay_minutes": 45, "station": "BVI", "message": "Delay increased to 45 mins. Encroaching on scheduled block."}
            ),
            SimulationAction(
                time_offset_seconds=25,
                event_type=EventType.CONFLICT_DETECTED,
                source="ConflictEngine",
                payload={"train_id": "TRN-12951", "block_id": "BLK-200", "overlap_minutes": 30, "message": "Delayed train TRN-12951 overlaps with BLK-200."}
            )
        ]
    ),
    SimulationScenario(
        id="demo_resource_shortage",
        name="Resource Shortage",
        description="A specialized machine breaks down, invalidating an approved block.",
        actions=[
            SimulationAction(
                time_offset_seconds=5,
                event_type=EventType.RESOURCE_AVAILABILITY_CHANGED,
                source="Depot_Manager",
                payload={"resource_id": "BCM-01", "status": "UNAVAILABLE", "message": "Ballast Cleaning Machine engine failure."}
            ),
            SimulationAction(
                time_offset_seconds=10,
                event_type=EventType.CONFLICT_DETECTED,
                source="ConflictEngine",
                payload={"block_id": "BLK-305", "resource_id": "BCM-01", "message": "Approved block BLK-305 missing mandatory resource BCM-01."}
            )
        ]
    ),
    SimulationScenario(
        id="demo_block_reduction",
        name="Block Window Reduction",
        description="Traffic control reduces an upcoming block window from 4 hours to 2 hours.",
        actions=[
            SimulationAction(
                time_offset_seconds=5,
                event_type=EventType.BLOCK_AVAILABILITY_CHANGED,
                source="Traffic_Control",
                payload={"block_id": "BLK-101", "original_duration": 240, "new_duration": 120, "message": "Block duration curtailed due to diverted traffic."}
            ),
            SimulationAction(
                time_offset_seconds=10,
                event_type=EventType.OPTIMIZATION_RESULT,
                source="OptimizationService",
                payload={"block_id": "BLK-101", "tasks_dropped": 2, "message": "Re-optimization dropped 2 maintenance tasks to fit 120m window."}
            )
        ]
    ),
    SimulationScenario(
        id="demo_normal_day",
        name="Normal Maintenance Progression",
        description="Standard progression of maintenance tasks completing successfully.",
        actions=[
            SimulationAction(
                time_offset_seconds=5,
                event_type=EventType.MAINTENANCE_UPDATED,
                source="Field_Crew",
                payload={"task_id": "MT-500", "status": "IN_PROGRESS", "completion_pct": 25}
            ),
            SimulationAction(
                time_offset_seconds=15,
                event_type=EventType.MAINTENANCE_UPDATED,
                source="Field_Crew",
                payload={"task_id": "MT-500", "status": "IN_PROGRESS", "completion_pct": 75}
            ),
            SimulationAction(
                time_offset_seconds=25,
                event_type=EventType.MAINTENANCE_UPDATED,
                source="Field_Crew",
                payload={"task_id": "MT-500", "status": "COMPLETED", "completion_pct": 100}
            )
        ]
    )
]
