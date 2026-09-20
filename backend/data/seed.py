"""
RAILBLOCK AI — Synthetic Seed Data Generator

Creates relationally consistent synthetic data for development and demonstration.

DATA LABELING POLICY:
All data in this seeder is SIMULATED / SYNTHETIC.
It does not represent real Indian Railways data.
The label [SIMULATED] is applied throughout.

Run with:
    python -m data.seed

From the backend/ directory with .venv activated.
"""
from __future__ import annotations

import asyncio
import random
from datetime import datetime, timedelta, time, timezone
from typing import List
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.division import Division, Route, Station, Section, SectionType
from app.models.asset import Asset, AssetType, AssetCondition
from app.models.maintenance import (
    MaintenanceRequest, MaintenanceCategory, MaintenanceStatus,
    Priority, SourceSystem, Defect, DefectSeverity
)
from app.models.resource import Resource, ResourceType, ResourceAvailability
from app.models.train import Train, TrainSchedule, TrainType
from app.models.block import BlockRequest, BlockWindow, BlockType, BlockRequestStatus
from app.models.alert import Alert, AlertSeverity, AlertType
from app.models.data_source import DataSource, DataSourceType
import structlog

logger = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, autoflush=False)


async def seed(db: AsyncSession) -> None:
    print("\n=" * 60)
    print("RAILBLOCK AI — SYNTHETIC SEED DATA GENERATOR")
    print("[SIMULATION] All data is synthetic. Not real IR data.")
    print("=" * 60)

    # ----------------------------------------------------------------
    # 1. DIVISION
    # ----------------------------------------------------------------
    division = Division(
        name="Central Railway — Mumbai Division [SIMULATED]",
        code="CR-MUM",
        zone="Central Railway",
        headquarters="CST Mumbai",
    )
    db.add(division)
    await db.flush()
    print(f"  Division: {division.name}")

    # ----------------------------------------------------------------
    # 2. USERS (admin + engineers per department)
    # ----------------------------------------------------------------
    users_data = [
        ("admin@railblock.sim", "EMP-001", "System Admin", "Admin@1234", UserRole.ADMIN, "IT"),
        ("planner.mehta@railblock.sim", "EMP-005", "A. Mehta", "Plan@1234", UserRole.PLANNER_CONTROLLER, "Operating"),
        ("engg.joshi@railblock.sim", "EMP-002", "S.K. Joshi", "Engg@1234", UserRole.WORKER_FIELD_STAFF, "Engg"),
        ("viewer@railblock.sim", "EMP-008", "V. Verma", "Viewer@1234", UserRole.VIEWER, "Audit"),
        ("trd.kumar@railblock.sim", "EMP-003", "R. Kumar", "Trd@1234", UserRole.WORKER_FIELD_STAFF, "TRD"),
        ("st.verma@railblock.sim", "EMP-004", "P. Verma", "St@1234", UserRole.WORKER_FIELD_STAFF, "S&T"),
        ("tc.sharma@railblock.sim", "EMP-006", "D. Sharma", "Tc@1234", UserRole.PLANNER_CONTROLLER, "Operating"),
        ("manager.gupta@railblock.sim", "EMP-007", "V. Gupta", "Mgr@1234", UserRole.PLANNER_CONTROLLER, "Engg"),
    ]
    users: List[User] = []
    for email, emp_id, name, pwd, role, dept in users_data:
        u = User(
            email=email,
            employee_id=emp_id,
            full_name=f"{name} [SIMULATED]",
            hashed_password=hash_password(pwd),
            role=role,
            department=dept,
            division_id=division.id,
            is_active=True,
            is_verified=True,
        )
        db.add(u)
        users.append(u)
    await db.flush()
    print(f"  Users created: {len(users)}")

    admin_user = users[0]
    engg_user = users[1]

    # ----------------------------------------------------------------
    # 3. ROUTE
    # ----------------------------------------------------------------
    route = Route(
        name="CSTM — Pune Main Line [SIMULATED]",
        code="CR-CSTM-PUNE",
        division_id=division.id,
        from_station="CSTM",
        to_station="PUNE",
        total_length_km=192.0,
        is_electrified=True,
        is_double_line=True,
    )
    db.add(route)
    await db.flush()

    # ----------------------------------------------------------------
    # 4. STATIONS (5 stations)
    # ----------------------------------------------------------------
    station_data = [
        ("Chhatrapati Shivaji Maharaj Terminus", "CSTM", 0.0, 18.9398, 72.8355, True, "A1"),
        ("Dadar", "DR", 8.5, 19.0178, 72.8429, True, "A1"),
        ("Thane", "TNA", 34.0, 19.1815, 72.9716, True, "A"),
        ("Kalyan Junction", "KYN", 54.0, 19.2437, 73.1355, True, "A"),
        ("Pune Junction", "PUNE", 192.0, 18.5285, 73.8742, True, "A1"),
    ]
    stations: List[Station] = []
    for sname, code, ch, lat, lon, is_jn, cat in station_data:
        st = Station(
            name=f"{sname} [SIMULATED]",
            code=code,
            route_id=route.id,
            chainage_km=ch,
            latitude=lat,
            longitude=lon,
            is_junction=is_jn,
            zone_category=cat,
        )
        db.add(st)
        stations.append(st)
    await db.flush()
    print(f"  Stations created: {len(stations)}")

    # ----------------------------------------------------------------
    # 5. SECTIONS (3 sections)
    # ----------------------------------------------------------------
    section_data = [
        ("CSTM—KYN Section", "CR-CSTM-KYN", 0, 3, 54.0),   # CSTM to KYN
        ("KYN—PUNE Section", "CR-KYN-PUNE", 3, 4, 138.0),  # KYN to PUNE
        ("DR—TNA Section", "CR-DR-TNA", 1, 2, 25.5),       # Dadar to Thane
    ]
    sections: List[Section] = []
    for sname, code, from_idx, to_idx, length in section_data:
        sec = Section(
            name=f"{sname} [SIMULATED]",
            code=code,
            route_id=route.id,
            from_station_id=stations[from_idx].id,
            to_station_id=stations[to_idx].id,
            length_km=length,
            section_type=SectionType.MAIN_LINE,
            is_electrified=True,
            number_of_tracks=2,
        )
        db.add(sec)
        sections.append(sec)
    await db.flush()
    print(f"  Sections created: {len(sections)}")

    # ----------------------------------------------------------------
    # 6. ASSETS (50+ assets distributed across sections)
    # ----------------------------------------------------------------
    asset_types_by_section = [
        # Section 0: CSTM-KYN (30 assets)
        (0, AssetType.TRACK, "TRACK", 20),
        (0, AssetType.SIGNAL, "SIGNAL", 5),
        (0, AssetType.BRIDGE, "BRIDGE", 3),
        (0, AssetType.LEVEL_CROSSING, "LC", 2),
        # Section 1: KYN-PUNE (20 assets)
        (1, AssetType.TRACK, "TRACK", 12),
        (1, AssetType.BRIDGE, "BRIDGE", 5),
        (1, AssetType.TUNNEL, "TUNNEL", 2),
        (1, AssetType.OVERHEAD_EQUIPMENT, "OHE", 1),
        # Section 2: DR-TNA (10 assets)
        (2, AssetType.TRACK, "TRACK", 6),
        (2, AssetType.SIGNAL, "SIGNAL", 3),
        (2, AssetType.POINT_AND_CROSSING, "PC", 1),
    ]
    conditions = [AssetCondition.GOOD, AssetCondition.GOOD, AssetCondition.FAIR, AssetCondition.POOR, AssetCondition.CRITICAL]
    assets: List[Asset] = []
    asset_counter = 1
    for sec_idx, a_type, prefix, count in asset_types_by_section:
        for i in range(count):
            asset = Asset(
                asset_number=f"{prefix}-{sections[sec_idx].code[:8]}-{asset_counter:03d}",
                name=f"{a_type.value.replace('_', ' ').title()} Asset #{asset_counter} [SIMULATED]",
                asset_type=a_type,
                section_id=sections[sec_idx].id,
                chainage_start_km=round(random.uniform(0, 50), 2),
                condition=random.choice(conditions),
                criticality_score=round(random.uniform(3.0, 10.0), 1),
                age_years=round(random.uniform(1, 25), 1),
                last_maintenance_date=datetime.now(timezone.utc) - timedelta(days=random.randint(30, 365)),
                next_due_date=datetime.now(timezone.utc) + timedelta(days=random.randint(7, 180)),
                is_active=True,
            )
            db.add(asset)
            assets.append(asset)
            asset_counter += 1
    await db.flush()
    print(f"  Assets created: {len(assets)}")

    # ----------------------------------------------------------------
    # 7. RESOURCES
    # ----------------------------------------------------------------
    resources_data = [
        ("Track Gang Alpha [SIMULATED]", ResourceType.GANG, 12, "Track"),
        ("Track Gang Beta [SIMULATED]", ResourceType.GANG, 10, "Track"),
        ("Bridge Inspection Team [SIMULATED]", ResourceType.GANG, 8, "Bridge"),
        ("Signal Maintenance Crew [SIMULATED]", ResourceType.GANG, 6, "Signal"),
        ("OHE Gang [SIMULATED]", ResourceType.GANG, 8, "Traction"),
        ("Track Recording Car [SIMULATED]", ResourceType.MACHINE, 1, "Track"),
        ("Ballast Tamping Machine [SIMULATED]", ResourceType.MACHINE, 1, "Track"),
    ]
    resources: List[Resource] = []
    for rname, rtype, size, spec in resources_data:
        r = Resource(
            name=rname,
            resource_type=rtype,
            division_id=division.id,
            size=size,
            specialization=spec,
            is_available=True,
        )
        db.add(r)
        resources.append(r)
    await db.flush()
    print(f"  Resources created: {len(resources)}")

    # ----------------------------------------------------------------
    # 8. TRAINS (20+ trains)
    # ----------------------------------------------------------------
    trains_data = [
        ("12001", "Shatabdi Express [SIMULATED]", TrainType.EXPRESS),
        ("12002", "Shatabdi Express Return [SIMULATED]", TrainType.EXPRESS),
        ("12051", "Janshatabdi Express [SIMULATED]", TrainType.EXPRESS),
        ("12052", "Janshatabdi Express Return [SIMULATED]", TrainType.EXPRESS),
        ("12123", "Deccan Queen [SIMULATED]", TrainType.EXPRESS),
        ("12124", "Deccan Queen Return [SIMULATED]", TrainType.EXPRESS),
        ("11007", "Deccan Express [SIMULATED]", TrainType.EXPRESS),
        ("11008", "Deccan Express Return [SIMULATED]", TrainType.EXPRESS),
        ("51501", "Pune Passenger [SIMULATED]", TrainType.PASSENGER),
        ("51502", "Pune Passenger Return [SIMULATED]", TrainType.PASSENGER),
        ("98001", "CST-Thane Local EMU-1 [SIMULATED]", TrainType.EMU),
        ("98002", "CST-Thane Local EMU-2 [SIMULATED]", TrainType.EMU),
        ("98003", "CST-Kalyan Local EMU-3 [SIMULATED]", TrainType.EMU),
        ("98004", "CST-Kalyan Local EMU-4 [SIMULATED]", TrainType.EMU),
        ("98005", "CST-Pune Fast EMU [SIMULATED]", TrainType.EMU),
        ("70001", "BOXN Freight Train 1 [SIMULATED]", TrainType.FREIGHT),
        ("70002", "BOXN Freight Train 2 [SIMULATED]", TrainType.FREIGHT),
        ("70003", "Container Express [SIMULATED]", TrainType.FREIGHT),
        ("70004", "Coal Rake [SIMULATED]", TrainType.FREIGHT),
        ("70005", "Goods Train 5 [SIMULATED]", TrainType.GOODS),
        ("70006", "Goods Train 6 [SIMULATED]", TrainType.GOODS),
        ("70007", "Goods Forecast Train [SIMULATED]", TrainType.GOODS),
    ]
    trains: List[Train] = []
    for num, name, ttype in trains_data:
        t = Train(
            train_number=num,
            name=name,
            train_type=ttype,
            rake_type="LHB" if ttype == TrainType.EXPRESS else ("EMU" if ttype == TrainType.EMU else "BOXN"),
            is_simulated=True,
            is_active=True,
        )
        db.add(t)
        trains.append(t)
    await db.flush()
    print(f"  Trains created: {len(trains)}")

    # ----------------------------------------------------------------
    # 9. TRAIN SCHEDULES
    # ----------------------------------------------------------------
    schedule_times = [
        (time(6, 0), time(6, 5)),
        (time(6, 35), time(6, 40)),
        (time(9, 0), time(9, 5)),
    ]
    sched_count = 0
    for t_idx, train in enumerate(trains[:10]):  # Schedule first 10 trains
        for s_idx, section in enumerate(sections):
            arr_t, dep_t = schedule_times[s_idx % len(schedule_times)]
            sched = TrainSchedule(
                train_id=train.id,
                section_id=section.id,
                sequence_number=s_idx + 1,
                scheduled_arrival=arr_t,
                scheduled_departure=dep_t,
                days_of_week="1234567",
                is_simulated=True,
                data_source="SIMULATED_TIMETABLE",
            )
            db.add(sched)
            sched_count += 1
    await db.flush()
    print(f"  Train schedules created: {sched_count}")

    # ----------------------------------------------------------------
    # 10. MAINTENANCE REQUESTS (100+ tasks from multiple sources)
    # ----------------------------------------------------------------
    source_systems = [
        SourceSystem.SIMULATED_TMS,
        SourceSystem.SIMULATED_SMMS,
        SourceSystem.SIMULATED_TDMS,
        SourceSystem.SIMULATED_COA,
        SourceSystem.SIMULATED_BDMS,
        SourceSystem.MANUAL,
    ]
    categories_by_type = {
        AssetType.TRACK: MaintenanceCategory.TRACK,
        AssetType.BRIDGE: MaintenanceCategory.BRIDGE,
        AssetType.SIGNAL: MaintenanceCategory.SIGNAL,
        AssetType.OVERHEAD_EQUIPMENT: MaintenanceCategory.TRACTION,
        AssetType.LEVEL_CROSSING: MaintenanceCategory.CIVIL,
        AssetType.TUNNEL: MaintenanceCategory.CIVIL,
        AssetType.POINT_AND_CROSSING: MaintenanceCategory.MECHANICAL,
        AssetType.TRACTION_SUBSTATION: MaintenanceCategory.TRACTION,
        AssetType.STATION_BUILDING: MaintenanceCategory.CIVIL,
        AssetType.CULVERT: MaintenanceCategory.CIVIL,
        AssetType.RETAINING_WALL: MaintenanceCategory.CIVIL,
    }
    task_templates = [
        ("Track geometry correction at {loc}", Priority.MEDIUM),
        ("Rail joint welding at {loc}", Priority.HIGH),
        ("Weld defect repair at {loc}", Priority.CRITICAL),
        ("Sleeper renewal at {loc}", Priority.MEDIUM),
        ("Ballast compaction at {loc}", Priority.LOW),
        ("Gauge correction at {loc}", Priority.HIGH),
        ("Annual inspection: {loc}", Priority.LOW),
        ("Urgent repair: {loc}", Priority.CRITICAL),
        ("Routine maintenance: {loc}", Priority.LOW),
        ("Special repair after monsoon: {loc}", Priority.HIGH),
    ]
    now = datetime.now(timezone.utc)
    maintenance_tasks: List[MaintenanceRequest] = []
    src_counter = {s: 1000 for s in source_systems}
    for i, asset in enumerate(assets):
        n_tasks = random.randint(1, 3)  # 1-3 tasks per asset gives 100+ total
        category = categories_by_type.get(asset.asset_type, MaintenanceCategory.TRACK)
        for j in range(n_tasks):
            title_tmpl, priority = random.choice(task_templates)
            src = random.choice(source_systems)
            src_counter[src] += 1
            src_id = f"{src.value}-{src_counter[src]}"
            task = MaintenanceRequest(
                title=title_tmpl.format(loc=asset.asset_number),
                description=f"[{src.value}] Synthetic maintenance task for {asset.name}. Not real IR data.",
                category=category,
                priority=priority,
                status=random.choice(list(MaintenanceStatus)),
                asset_id=asset.id,
                section_id=asset.section_id,
                assigned_to_id=engg_user.id if random.random() > 0.5 else None,
                created_by_id=engg_user.id,
                estimated_duration_hours=round(random.uniform(2, 24), 1),
                deadline=now + timedelta(days=random.randint(7, 90)),
                requires_block=True,
                required_gang_size=random.randint(6, 15),
                source_system=src,
                source_record_id=src_id,
                source_timestamp=now - timedelta(hours=random.randint(1, 168)),
                import_timestamp=now,
            )
            db.add(task)
            maintenance_tasks.append(task)

    # ----------------------------------------------------------------
    # 9.5. DEMO SPECIFIC DETERMINISTIC TASKS
    # ----------------------------------------------------------------
    # Add specifically designed tasks to ensure the demo scenario has exactly what it needs:
    demo_tasks = [
        MaintenanceRequest(
            title="[DEMO] CRITICAL Rail Fracture Repair",
            description="[SIMULATED] High severity track defect. Immediate repair required.",
            category=MaintenanceCategory.TRACK,
            priority=Priority.CRITICAL,
            status=MaintenanceStatus.PENDING,
            asset_id=assets[0].id,
            section_id=sections[0].id,
            created_by_id=engg_user.id,
            estimated_duration_hours=2.0,
            deadline=now - timedelta(days=2), # OVERDUE
            requires_block=True,
            required_gang_size=10,
            source_system=SourceSystem.MANUAL,
            source_record_id="DEMO-1"
        ),
        MaintenanceRequest(
            title="[DEMO] Routine Tamping (CSTM-KYN)",
            description="[SIMULATED] Routine track maintenance.",
            category=MaintenanceCategory.TRACK,
            priority=Priority.MEDIUM,
            status=MaintenanceStatus.PENDING,
            asset_id=assets[1].id,
            section_id=sections[0].id,
            created_by_id=engg_user.id,
            estimated_duration_hours=3.5,
            deadline=now + timedelta(days=5),
            requires_block=True,
            required_gang_size=15,
            source_system=SourceSystem.TMS,
            source_record_id="DEMO-2"
        ),
        MaintenanceRequest(
            title="[DEMO] Bridge Pier Inspection",
            description="[SIMULATED] High priority structural check.",
            category=MaintenanceCategory.BRIDGE,
            priority=Priority.HIGH,
            status=MaintenanceStatus.PENDING,
            asset_id=assets[2].id,
            section_id=sections[0].id,
            created_by_id=engg_user.id,
            estimated_duration_hours=4.0,
            deadline=now + timedelta(days=1),
            requires_block=True,
            required_gang_size=8,
            source_system=SourceSystem.MANUAL,
            source_record_id="DEMO-3"
        ),
        MaintenanceRequest(
            title="[DEMO] Overdue OHE Tensioning",
            description="[SIMULATED] TRD overdue task.",
            category=MaintenanceCategory.TRACTION,
            priority=Priority.HIGH,
            status=MaintenanceStatus.PENDING,
            asset_id=assets[3].id,
            section_id=sections[0].id,
            created_by_id=engg_user.id,
            estimated_duration_hours=1.5,
            deadline=now - timedelta(days=7), # OVERDUE
            requires_block=True,
            required_gang_size=6,
            source_system=SourceSystem.MANUAL,
            source_record_id="DEMO-4"
        )
    ]
    for dt in demo_tasks:
        db.add(dt)
        maintenance_tasks.append(dt)
        
    await db.flush()
    print(f"  Maintenance tasks created: {len(maintenance_tasks)}")

    # ----------------------------------------------------------------
    # 11. BLOCK REQUESTS (using first section)
    # ----------------------------------------------------------------
    block_statuses = [
        BlockRequestStatus.SUBMITTED,
        BlockRequestStatus.APPROVED,
        BlockRequestStatus.UNDER_REVIEW,
    ]
    for i in range(15):
        start_dt = now + timedelta(days=random.randint(1, 30), hours=random.randint(1, 22))
        duration = random.choice([2, 4, 6, 8])
        end_dt = start_dt + timedelta(hours=duration)
        br = BlockRequest(
            title=f"Block Request #{i+1} — Section Maintenance [SIMULATED]",
            description="Synthetic block request for maintenance planning demonstration.",
            section_id=sections[i % len(sections)].id,
            block_type=BlockType.ENGINEERING_BLOCK,
            status=random.choice(block_statuses),
            requested_date=start_dt,
            requested_start_time=start_dt,
            requested_end_time=end_dt,
            duration_hours=duration,
            requested_by_id=engg_user.id,
        )
        db.add(br)
    await db.flush()
    print(f"  Block requests created: 15")

    # ----------------------------------------------------------------
    # 12. ALERTS
    # ----------------------------------------------------------------
    alert_data = [
        ("Overdue maintenance detected", "Asset TRACK-CR-CSTM-KYN-001 has overdue maintenance task", AlertSeverity.WARNING, AlertType.OVERDUE_TASK),
        ("Schedule conflict detected", "Block window overlaps with Express train schedule on CSTM-KYN section", AlertSeverity.ERROR, AlertType.SCHEDULE_CONFLICT),
        ("Asset condition critical", "BRIDGE-CR-CSTM-KYN-021 condition has degraded to CRITICAL", AlertSeverity.CRITICAL, AlertType.ASSET_DEGRADED),
        ("Data quality warning", "3 maintenance records imported with missing gang size", AlertSeverity.WARNING, AlertType.DATA_QUALITY),
        ("System startup", "RAILBLOCK AI Stage 2 data initialization complete [SIMULATED]", AlertSeverity.INFO, AlertType.SYSTEM),
    ]
    for title, msg, sev, atype in alert_data:
        db.add(Alert(title=title, message=msg, severity=sev, alert_type=atype))
    await db.flush()
    print(f"  Alerts created: {len(alert_data)}")

    # ----------------------------------------------------------------
    # 13. DATA SOURCES
    # ----------------------------------------------------------------
    sources_data = [
        ("Simulated TMS", DataSourceType.SIMULATED_TMS, "SimulatedTMSAdapter"),
        ("Simulated SMMS", DataSourceType.SIMULATED_SMMS, "SimulatedSMMSAdapter"),
        ("Simulated TDMS", DataSourceType.SIMULATED_TDMS, "SimulatedTDMSAdapter"),
        ("Simulated COA", DataSourceType.SIMULATED_COA, "SimulatedCOAAdapter"),
        ("Simulated BDMS", DataSourceType.SIMULATED_BDMS, "SimulatedBDMSAdapter"),
        ("Simulated Timetable", DataSourceType.SIMULATED_TIMETABLE, "SimulatedTimetableAdapter"),
    ]
    for sname, stype, adapter_cls in sources_data:
        db.add(DataSource(
            name=f"{sname} [SIMULATION]",
            source_type=stype,
            description=f"Synthetic data source for {sname}. NOT a real IR system.",
            is_simulated=True,
            is_enabled=True,
            adapter_class=adapter_cls,
        ))
    await db.flush()
    print(f"  Data sources registered: {len(sources_data)}")

    await db.commit()
    print("\n" + "=" * 60)
    print("SEED COMPLETE")
    print(f"  Division:              1")
    print(f"  Users:                 {len(users)}")
    print(f"  Route:                 1")
    print(f"  Stations:              {len(stations)}")
    print(f"  Sections:              {len(sections)}")
    print(f"  Assets:                {len(assets)}")
    print(f"  Resources:             {len(resources)}")
    print(f"  Trains:                {len(trains)}")
    print(f"  Train Schedules:       {sched_count}")
    print(f"  Maintenance Tasks:     {len(maintenance_tasks)}")
    print(f"  Block Requests:        15")
    print(f"  Alerts:                {len(alert_data)}")
    print(f"  Data Sources:          {len(sources_data)}")
    print("=" * 60)
    print("ADMIN LOGIN:  admin@railblock.sim / Admin@1234")
    print("[SIMULATION] All data is synthetic. Not real IR data.")
    print("=" * 60 + "\n")


async def main() -> None:
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        result = await db.execute(text("SELECT COUNT(*) FROM divisions"))
        count = result.scalar_one()
        if count > 0:
            print("Database already seeded. Skipping.")
            print("To re-seed, drop the database and run migrations again.")
            return
        await seed(db)


if __name__ == "__main__":
    asyncio.run(main())
