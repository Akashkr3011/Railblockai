import sys

with open('data/seed.py', 'r') as f:
    text = f.read()

injection = """
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
        
"""

text = text.replace('    await db.flush()\n    print(f"  Maintenance tasks created: {len(maintenance_tasks)}")', injection + '    await db.flush()\n    print(f"  Maintenance tasks created: {len(maintenance_tasks)}")')

with open('data/seed.py', 'w') as f:
    f.write(text)
