"""
Initial schema — RAILBLOCK AI Stage 2

Revision ID: 0001
Revises:
Create Date: 2026-09-12
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB

# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- ENUMS ---
    user_role_enum = sa.Enum('ADMIN', 'ENGINEERING', 'ST', 'TRD', 'PLANNER', 'TRAFFIC_CONTROLLER', 'MANAGER', 'EXECUTIVE', 'AUDITOR', name='user_role_enum')
    section_type_enum = sa.Enum('MAIN_LINE', 'BRANCH_LINE', 'GOODS_LINE', 'YARD', name='section_type_enum')
    asset_type_enum = sa.Enum('TRACK', 'BRIDGE', 'TUNNEL', 'SIGNAL', 'LEVEL_CROSSING', 'TRACTION_SUBSTATION', 'OVERHEAD_EQUIPMENT', 'STATION_BUILDING', 'POINT_AND_CROSSING', 'CULVERT', 'RETAINING_WALL', name='asset_type_enum')
    asset_condition_enum = sa.Enum('GOOD', 'FAIR', 'POOR', 'CRITICAL', 'OUT_OF_SERVICE', name='asset_condition_enum')
    source_system_enum = sa.Enum('TMS', 'SMMS', 'TDMS', 'COA', 'BDMS', 'MANUAL', 'INSPECTION', 'SIMULATED_TMS', 'SIMULATED_SMMS', 'SIMULATED_TDMS', 'SIMULATED_COA', 'SIMULATED_BDMS', 'SIMULATED_GOODS_FORECAST', name='source_system_enum')
    priority_enum = sa.Enum('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', name='priority_enum')
    maintenance_category_enum = sa.Enum('TRACK', 'BRIDGE', 'SIGNAL', 'TRACTION', 'TELECOM', 'CIVIL', 'ELECTRICAL', 'MECHANICAL', name='maintenance_category_enum')
    maintenance_status_enum = sa.Enum('PENDING', 'UNDER_REVIEW', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'DEFERRED', 'CANCELLED', name='maintenance_status_enum')
    defect_severity_enum = sa.Enum('MINOR', 'MODERATE', 'MAJOR', 'SAFETY_CRITICAL', name='defect_severity_enum')
    resource_type_enum = sa.Enum('GANG', 'MACHINE', 'VEHICLE', 'SPECIALIST', name='resource_type_enum')
    train_type_enum = sa.Enum('EXPRESS', 'PASSENGER', 'GOODS', 'EMU', 'MEMU', 'DEMU', 'SPECIAL', 'FREIGHT', name='train_type_enum')
    block_type_enum = sa.Enum('LINE_BLOCK', 'TRAFFIC_BLOCK', 'ENGINEERING_BLOCK', 'POWER_BLOCK', 'COMBINED', name='block_type_enum')
    block_request_status_enum = sa.Enum('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED', 'CANCELLED', name='block_request_status_enum')
    optimization_status_enum = sa.Enum('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', name='optimization_status_enum')
    alert_severity_enum = sa.Enum('INFO', 'WARNING', 'ERROR', 'CRITICAL', name='alert_severity_enum')
    alert_type_enum = sa.Enum('SCHEDULE_CONFLICT', 'OVERDUE_TASK', 'ASSET_DEGRADED', 'DATA_QUALITY', 'OPTIMIZATION_COMPLETE', 'BLOCK_APPROVED', 'BLOCK_REJECTED', 'SYSTEM', name='alert_type_enum')
    data_source_type_enum = sa.Enum('TMS', 'SMMS', 'TDMS', 'COA', 'BDMS', 'TIMETABLE', 'GOODS_FORECAST', 'SIMULATED_TMS', 'SIMULATED_SMMS', 'SIMULATED_TDMS', 'SIMULATED_COA', 'SIMULATED_BDMS', 'SIMULATED_TIMETABLE', 'SIMULATED_GOODS', name='data_source_type_enum')
    import_run_status_enum = sa.Enum('RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL', name='import_run_status_enum')
    issue_severity_enum = sa.Enum('WARNING', 'ERROR', 'CRITICAL', name='issue_severity_enum')

    # Create divisions first (no FK dependencies)
    op.create_table('divisions',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('code', sa.String(10), nullable=False),
        sa.Column('zone', sa.String(50), nullable=False),
        sa.Column('headquarters', sa.String(100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
        sa.UniqueConstraint('code'),
    )

    # users (FK to divisions)
    op.create_table('users',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('employee_id', sa.String(50), nullable=False),
        sa.Column('full_name', sa.String(200), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('role', user_role_enum, nullable=False),
        sa.Column('division_id', PGUUID(as_uuid=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('department', sa.String(100), nullable=True),
        sa.Column('designation', sa.String(100), nullable=True),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('last_login_at', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['division_id'], ['divisions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_employee_id', 'users', ['employee_id'], unique=True)

    # routes (FK to divisions)
    op.create_table('routes',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('code', sa.String(20), nullable=False),
        sa.Column('division_id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('from_station', sa.String(100), nullable=False),
        sa.Column('to_station', sa.String(100), nullable=False),
        sa.Column('total_length_km', sa.Float(), nullable=True),
        sa.Column('is_electrified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_double_line', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['division_id'], ['divisions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code'),
    )

    # stations (FK to routes)
    op.create_table('stations',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('code', sa.String(10), nullable=False),
        sa.Column('route_id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('chainage_km', sa.Float(), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('is_junction', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('zone_category', sa.String(5), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['route_id'], ['routes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_stations_code', 'stations', ['code'], unique=True)

    # sections (FK to routes, stations)
    op.create_table('sections',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('code', sa.String(30), nullable=False),
        sa.Column('route_id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('from_station_id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('to_station_id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('length_km', sa.Float(), nullable=False),
        sa.Column('section_type', section_type_enum, nullable=False),
        sa.Column('speed_restriction_kmph', sa.Integer(), nullable=True),
        sa.Column('is_electrified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('number_of_tracks', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['route_id'], ['routes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['from_station_id'], ['stations.id']),
        sa.ForeignKeyConstraint(['to_station_id'], ['stations.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code'),
    )

    # assets
    op.create_table('assets',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('asset_number', sa.String(50), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('asset_type', asset_type_enum, nullable=False),
        sa.Column('section_id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('chainage_start_km', sa.Float(), nullable=True),
        sa.Column('chainage_end_km', sa.Float(), nullable=True),
        sa.Column('condition', asset_condition_enum, nullable=False),
        sa.Column('criticality_score', sa.Float(), nullable=False, server_default='5.0'),
        sa.Column('age_years', sa.Float(), nullable=True),
        sa.Column('last_maintenance_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('next_due_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('manufacturer', sa.String(100), nullable=True),
        sa.Column('model_number', sa.String(100), nullable=True),
        sa.Column('installation_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('metadata_json', JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['section_id'], ['sections.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_assets_asset_number', 'assets', ['asset_number'], unique=True)
    op.create_index('ix_assets_section_id', 'assets', ['section_id'])

    # asset_status_history
    op.create_table('asset_status_history',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('asset_id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('previous_condition', asset_condition_enum, nullable=True),
        sa.Column('new_condition', asset_condition_enum, nullable=False),
        sa.Column('changed_by_id', PGUUID(as_uuid=True), nullable=True),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('source_system', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['changed_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_ash_asset_id', 'asset_status_history', ['asset_id'])

    # maintenance_requests
    op.create_table('maintenance_requests',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', maintenance_category_enum, nullable=False),
        sa.Column('priority', priority_enum, nullable=False),
        sa.Column('status', maintenance_status_enum, nullable=False),
        sa.Column('asset_id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('section_id', PGUUID(as_uuid=True), nullable=True),
        sa.Column('assigned_to_id', PGUUID(as_uuid=True), nullable=True),
        sa.Column('created_by_id', PGUUID(as_uuid=True), nullable=True),
        sa.Column('estimated_duration_hours', sa.Float(), nullable=True),
        sa.Column('deadline', sa.DateTime(timezone=True), nullable=True),
        sa.Column('scheduled_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('required_gang_size', sa.Integer(), nullable=True),
        sa.Column('requires_block', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('priority_score', sa.Float(), nullable=True),
        sa.Column('source_system', source_system_enum, nullable=False),
        sa.Column('source_record_id', sa.String(100), nullable=True),
        sa.Column('source_timestamp', sa.DateTime(timezone=True), nullable=True),
        sa.Column('import_timestamp', sa.DateTime(timezone=True), nullable=True),
        sa.Column('source_metadata', JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['section_id'], ['sections.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['assigned_to_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_mr_asset_id', 'maintenance_requests', ['asset_id'])
    op.create_index('ix_mr_status', 'maintenance_requests', ['status'])
    op.create_index('ix_mr_priority', 'maintenance_requests', ['priority'])
    op.create_index('ix_mr_source_system', 'maintenance_requests', ['source_system'])
    op.create_index('ix_mr_source_record_id', 'maintenance_requests', ['source_record_id'])

    # defects
    op.create_table('defects',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('asset_id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('defect_code', sa.String(50), nullable=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('severity', defect_severity_enum, nullable=False),
        sa.Column('reported_by_id', PGUUID(as_uuid=True), nullable=True),
        sa.Column('is_resolved', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('source_system', source_system_enum, nullable=False),
        sa.Column('source_record_id', sa.String(100), nullable=True),
        sa.Column('linked_maintenance_id', PGUUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reported_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['linked_maintenance_id'], ['maintenance_requests.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_defects_asset_id', 'defects', ['asset_id'])
    op.create_index('ix_defects_severity', 'defects', ['severity'])

    # maintenance_history
    op.create_table('maintenance_history',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('request_id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('performed_by_id', PGUUID(as_uuid=True), nullable=True),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('work_done', sa.Text(), nullable=False),
        sa.Column('materials_used', JSONB(), nullable=True),
        sa.Column('gang_size_actual', sa.Integer(), nullable=True),
        sa.Column('outcome_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['request_id'], ['maintenance_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['performed_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_mh_request_id', 'maintenance_history', ['request_id'])

    # resources
    op.create_table('resources',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('resource_type', resource_type_enum, nullable=False),
        sa.Column('division_id', PGUUID(as_uuid=True), nullable=True),
        sa.Column('size', sa.Integer(), nullable=True),
        sa.Column('specialization', sa.String(100), nullable=True),
        sa.Column('is_available', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['division_id'], ['divisions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )

    # resource_availability
    op.create_table('resource_availability',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('resource_id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('available_from', sa.DateTime(timezone=True), nullable=False),
        sa.Column('available_to', sa.DateTime(timezone=True), nullable=False),
        sa.Column('notes', sa.String(300), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['resource_id'], ['resources.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_ra_resource_id', 'resource_availability', ['resource_id'])
    op.create_index('ix_ra_window', 'resource_availability', ['available_from', 'available_to'])

    # trains
    op.create_table('trains',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('train_number', sa.String(10), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('train_type', train_type_enum, nullable=False),
        sa.Column('rake_type', sa.String(50), nullable=True),
        sa.Column('is_simulated', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_trains_number', 'trains', ['train_number'], unique=True)

    # train_schedules
    op.create_table('train_schedules',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('train_id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('section_id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('sequence_number', sa.Integer(), nullable=False),
        sa.Column('scheduled_arrival', sa.Time(), nullable=True),
        sa.Column('scheduled_departure', sa.Time(), nullable=True),
        sa.Column('days_of_week', sa.String(20), nullable=False, server_default='1234567'),
        sa.Column('is_simulated', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('data_source', sa.String(50), nullable=False, server_default='SIMULATED_TIMETABLE'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['train_id'], ['trains.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['section_id'], ['sections.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_ts_train_id', 'train_schedules', ['train_id'])
    op.create_index('ix_ts_section_id', 'train_schedules', ['section_id'])

    # train_positions
    op.create_table('train_positions',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('train_id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('section_id', PGUUID(as_uuid=True), nullable=True),
        sa.Column('position_chainage_km', sa.Float(), nullable=True),
        sa.Column('speed_kmph', sa.Float(), nullable=True),
        sa.Column('direction', sa.String(20), nullable=True),
        sa.Column('recorded_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_simulated', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['train_id'], ['trains.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['section_id'], ['sections.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_tp_train_id', 'train_positions', ['train_id'])

    # optimization_runs
    op.create_table('optimization_runs',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('run_name', sa.String(200), nullable=False),
        sa.Column('status', optimization_status_enum, nullable=False),
        sa.Column('solver', sa.String(50), nullable=False, server_default='CP-SAT'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('solve_time_seconds', sa.Float(), nullable=True),
        sa.Column('objective_value', sa.Float(), nullable=True),
        sa.Column('tasks_scheduled', sa.Integer(), nullable=True),
        sa.Column('tasks_total', sa.Integer(), nullable=True),
        sa.Column('coverage_percent', sa.Float(), nullable=True),
        sa.Column('input_params', JSONB(), nullable=True),
        sa.Column('result_summary', JSONB(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('triggered_by_id', PGUUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['triggered_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )

    # scenarios
    op.create_table('scenarios',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('scenario_params', JSONB(), nullable=True),
        sa.Column('result_summary', JSONB(), nullable=True),
        sa.Column('created_by_id', PGUUID(as_uuid=True), nullable=True),
        sa.Column('is_simulated', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )

    # block_requests
    op.create_table('block_requests',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('section_id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('block_type', block_type_enum, nullable=False),
        sa.Column('status', block_request_status_enum, nullable=False),
        sa.Column('requested_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('requested_start_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('requested_end_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('duration_hours', sa.Float(), nullable=False),
        sa.Column('requested_by_id', PGUUID(as_uuid=True), nullable=True),
        sa.Column('reviewed_by_id', PGUUID(as_uuid=True), nullable=True),
        sa.Column('approval_notes', sa.Text(), nullable=True),
        sa.Column('has_conflicts', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('conflict_details', JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['section_id'], ['sections.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['requested_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['reviewed_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_br_section_id', 'block_requests', ['section_id'])
    op.create_index('ix_br_status', 'block_requests', ['status'])
    op.create_index('ix_br_requested_date', 'block_requests', ['requested_date'])

    # block_windows
    op.create_table('block_windows',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('block_request_id', PGUUID(as_uuid=True), nullable=True),
        sa.Column('section_id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('duration_hours', sa.Float(), nullable=False),
        sa.Column('block_type', block_type_enum, nullable=False),
        sa.Column('is_confirmed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('confirmed_by_id', PGUUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['block_request_id'], ['block_requests.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['section_id'], ['sections.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['confirmed_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_bw_section_id', 'block_windows', ['section_id'])
    op.create_index('ix_bw_start_time', 'block_windows', ['start_time'])

    # block_plans
    op.create_table('block_plans',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('plan_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(30), nullable=False, server_default='DRAFT'),
        sa.Column('optimization_run_id', PGUUID(as_uuid=True), nullable=True),
        sa.Column('created_by_id', PGUUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['optimization_run_id'], ['optimization_runs.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )

    # block_plan_tasks
    op.create_table('block_plan_tasks',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('block_plan_id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('block_window_id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('maintenance_request_id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('sequence_in_window', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('allocated_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('allocated_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['block_plan_id'], ['block_plans.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['block_window_id'], ['block_windows.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['maintenance_request_id'], ['maintenance_requests.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_bpt_plan_id', 'block_plan_tasks', ['block_plan_id'])

    # alerts
    op.create_table('alerts',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('severity', alert_severity_enum, nullable=False),
        sa.Column('alert_type', alert_type_enum, nullable=False),
        sa.Column('related_entity_type', sa.String(50), nullable=True),
        sa.Column('related_entity_id', PGUUID(as_uuid=True), nullable=True),
        sa.Column('is_resolved', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_by_id', PGUUID(as_uuid=True), nullable=True),
        sa.Column('metadata_json', JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['resolved_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_alerts_severity', 'alerts', ['severity'])
    op.create_index('ix_alerts_is_resolved', 'alerts', ['is_resolved'])

    # notifications
    op.create_table('notifications',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('user_id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('alert_id', PGUUID(as_uuid=True), nullable=True),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['alert_id'], ['alerts.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_notif_user_id', 'notifications', ['user_id'])
    op.create_index('ix_notif_is_read', 'notifications', ['is_read'])

    # audit_logs
    op.create_table('audit_logs',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('user_id', PGUUID(as_uuid=True), nullable=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=True),
        sa.Column('entity_id', PGUUID(as_uuid=True), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(300), nullable=True),
        sa.Column('before_state', JSONB(), nullable=True),
        sa.Column('after_state', JSONB(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_audit_user_id', 'audit_logs', ['user_id'])
    op.create_index('ix_audit_entity', 'audit_logs', ['entity_type', 'entity_id'])
    op.create_index('ix_audit_action', 'audit_logs', ['action'])

    # data_sources
    op.create_table('data_sources',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('source_type', data_source_type_enum, nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_simulated', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('adapter_class', sa.String(100), nullable=False),
        sa.Column('connection_params', JSONB(), nullable=True),
        sa.Column('last_successful_import', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )

    # data_import_runs
    op.create_table('data_import_runs',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('data_source_id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('status', import_run_status_enum, nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('records_fetched', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('records_imported', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('records_failed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['data_source_id'], ['data_sources.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_dir_data_source_id', 'data_import_runs', ['data_source_id'])
    op.create_index('ix_dir_status', 'data_import_runs', ['status'])

    # data_quality_issues
    op.create_table('data_quality_issues',
        sa.Column('id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('import_run_id', PGUUID(as_uuid=True), nullable=False),
        sa.Column('issue_code', sa.String(50), nullable=False),
        sa.Column('severity', issue_severity_enum, nullable=False),
        sa.Column('field_name', sa.String(100), nullable=True),
        sa.Column('record_id', sa.String(100), nullable=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('raw_value', sa.String(500), nullable=True),
        sa.Column('is_blocking', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['import_run_id'], ['data_import_runs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_dqi_import_run_id', 'data_quality_issues', ['import_run_id'])


def downgrade() -> None:
    # Drop in reverse FK dependency order
    op.drop_table('data_quality_issues')
    op.drop_table('data_import_runs')
    op.drop_table('data_sources')
    op.drop_table('audit_logs')
    op.drop_table('notifications')
    op.drop_table('alerts')
    op.drop_table('block_plan_tasks')
    op.drop_table('block_plans')
    op.drop_table('block_windows')
    op.drop_table('block_requests')
    op.drop_table('scenarios')
    op.drop_table('optimization_runs')
    op.drop_table('train_positions')
    op.drop_table('train_schedules')
    op.drop_table('trains')
    op.drop_table('resource_availability')
    op.drop_table('resources')
    op.drop_table('maintenance_history')
    op.drop_table('defects')
    op.drop_table('maintenance_requests')
    op.drop_table('asset_status_history')
    op.drop_table('assets')
    op.drop_table('sections')
    op.drop_table('stations')
    op.drop_table('routes')
    op.drop_table('users')
    op.drop_table('divisions')

    # Drop enums
    for enum_name in [
        'issue_severity_enum', 'import_run_status_enum', 'data_source_type_enum',
        'alert_type_enum', 'alert_severity_enum', 'optimization_status_enum',
        'block_request_status_enum', 'block_type_enum', 'train_type_enum',
        'resource_type_enum', 'defect_severity_enum', 'maintenance_status_enum',
        'maintenance_category_enum', 'priority_enum', 'source_system_enum',
        'asset_condition_enum', 'asset_type_enum', 'section_type_enum', 'user_role_enum',
    ]:
        sa.Enum(name=enum_name).drop(op.get_bind(), checkfirst=True)
