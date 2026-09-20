export interface RailwayZone {
  code: string
  name: string
  hindi_name: string
  hq: string
  divisions: string[]
  route_km: number
  active_trains_count: number
  color: string
}

export interface NationalCorridor {
  code: string
  name: string
  trunk_type: 'GOLDEN_QUADRILATERAL' | 'DIAGONAL' | 'DFC' | 'COASTAL' | 'DECCAN'
  from_city: string
  to_city: string
  distance_km: number
  zones_traversed: string[]
  key_stations: string[]
  daily_trains: number
  status: 'OPTIMAL' | 'HIGH_CONGESTION' | 'MAINTENANCE_WINDOW_ACTIVE'
}

export interface Section {
  id: string
  name: string
  code: string
  zone: string
  division: string
  corridor: string
  from_station: string
  to_station: string
  length_km: number
  line_type: string
  max_speed_kmh: number
}

export interface Asset {
  id: string
  asset_code: string
  name: string
  asset_type: 'TRACK' | 'BRIDGE' | 'SIGNAL' | 'OHE' | 'TURNOUT' | 'POINT_MACHINE' | 'KAVACH'
  section_id: string
  condition: 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL'
  criticality_score: number
  failure_risk: number
  last_inspection: string
  next_due_inspection: string
  status: 'OPERATIONAL' | 'RESTRICTED' | 'MAINTENANCE_DUE' | 'DEFECTIVE'
}

export interface Train {
  id: string
  train_number: string
  train_name: string
  train_type: 'VANDE_BHARAT' | 'RAJDHANI' | 'SHATABDI' | 'SUPERFAST' | 'PASSENGER' | 'FREIGHT'
  zone: string
  corridor: string
  route_summary: string
  from_station: string
  to_station: string
  departure_time: string
  arrival_time: string
  is_daily: boolean
  is_active: boolean
  average_delay_minutes: number
  max_speed_kmh: number
  priority_tier: number
  current_section?: string
  next_station?: string
  current_speed_kmh?: number
  kavach_equipped?: boolean
}

export interface TrainSchedule {
  id: string
  train_id: string
  train_number: string
  section_id: string
  section_code: string
  scheduled_arrival: string
  scheduled_departure: string
  day_of_week: number
}

export interface MaintenanceRequest {
  id: string
  title: string
  description: string
  asset_id: string
  section_id: string
  category: 'CIVIL_TRACK' | 'ELECTRICAL_TRD' | 'SIGNAL_TELECOM' | 'MECHANICAL'
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'SCHEDULED' | 'REJECTED'
  estimated_duration_hours: number
  deadline: string
  created_at: string
  assigned_block_id: string | null
  priority_score: number
  affected_train_count: number
  zone?: string
  corridor?: string
}

export type UserRole = 'ADMIN' | 'PLANNER' | 'WORKER'

export interface UserProfile {
  id: string
  email: string
  name: string
  full_name: string
  role: UserRole
  department: string
  designation: string
  division: string
  clearance: string
  permissions: string[]
  created_at?: string
  status?: 'ACTIVE' | 'SUSPENDED'
}

// ---------------------------------------------------------------------------
// PLAN OPTIMIZATION & RESOURCE MANAGEMENT TYPES
// ---------------------------------------------------------------------------

export type PlanType = 'DAILY' | 'WEEKLY' | 'MONTHLY'

export type PlanStatus =
  | 'DRAFT'
  | 'OPTIMIZED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED'

export type ConflictType =
  | 'TRAIN_CONFLICT'
  | 'RESOURCE_CONFLICT'
  | 'TIME_CONFLICT'
  | 'ASSET_CONFLICT'
  | 'CORRIDOR_CONFLICT'

export interface PlanConflict {
  id: string
  plan_id?: string
  conflict_type: ConflictType
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  description: string
  corridor?: string
  entities_involved: string[]
  suggested_resolution: string
  is_resolved?: boolean
}

export interface PlanTask {
  id: string
  task_id?: string
  title: string
  asset_id?: string
  asset_name?: string
  section_id?: string
  section_name?: string
  corridor?: string
  department: string
  scheduled_date?: string
  scheduled_start?: string
  scheduled_end?: string
  start_time?: string
  end_time?: string
  duration_minutes?: number
  duration_hours?: number
  block_id?: string
  track_id?: string
  is_shadow_block?: boolean
  assigned_gang_id?: string
  assigned_machine_id?: string | null
  assigned_resource_id?: string
  assigned_resource_name?: string
  priority_score?: number
  failure_risk?: number
  train_impact_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  train_impact_score?: number
  decision_explanation?: string
  status: 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CONFLICT'
  conflicts_detected?: string[]
  day_of_week?: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
}

export interface OptimizationMetricComparison {
  baseline_value: number
  optimized_value: number
  improvement_percentage: number
  unit?: string
}

export interface OptimizationMetric {
  tasks_total?: number
  tasks_scheduled?: number
  high_priority_tasks?: number
  blocks_required?: number
  optimized_blocks?: number
  conflicts_before?: number
  conflicts_after?: number
  train_impact_before?: number
  train_impact_after?: number
  resource_utilization_before?: number
  resource_utilization_after?: number
  block_utilization_before?: number
  block_utilization_after?: number
  asset_availability_before?: number
  asset_availability_after?: number
  unscheduled_tasks_before?: number
  unscheduled_tasks_after?: number
  delayed_tasks_before?: number
  delayed_tasks_after?: number
  solver_time_ms?: number
  objective_score?: number
  total_block_minutes?: number
  maintenance_hours_granted?: number
  total_train_delay_minutes?: number
  delay_reduction_pct?: number
  punctuality_score?: number
  resource_utilization_pct?: number
  headway_compliance_score?: number
  conflicts_resolved_count?: number
  comparisons?: Record<string, OptimizationMetricComparison>
}

export interface PlanVersion {
  version: number
  version_tag: string
  created_by: string
  created_at: string
  optimization_type: PlanType
  plan_period: string
  metrics: OptimizationMetric
  changes_summary: string
  approval_status: PlanStatus
}

export interface PlanRecommendation {
  id: string
  category: 'MAINTENANCE_WINDOW' | 'RESOURCE_REBALANCING' | 'CORRIDOR_SAFETY' | 'RISK_MITIGATION'
  title: string
  recommendation: string
  based_on_metric: string
  confidence: number
  impact: string
}

export interface Plan {
  id: string
  plan_type?: PlanType
  level?: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  corridor_id?: string
  corridor?: string
  title: string
  period_start: string
  period_end: string
  status: PlanStatus
  version: number
  current_version_id?: string
  tasks: PlanTask[]
  blocks?: BlockRequest[]
  conflicts?: PlanConflict[]
  metrics: OptimizationMetric
  recommendations?: PlanRecommendation[]
  created_by?: string
  created_at?: string
  updated_at?: string
  approved_by?: string | null
  approved_at?: string | null
  published_at?: string | null
  notes?: string
}

export interface Resource {
  id: string
  name: string
  type: 'LABOUR_GANG' | 'SPECIAL_VEHICLE' | 'TRACK_MACHINE' | 'SPECIALIST_GANG'
  strength: number
  depot: string
  division?: string
  section_id?: string
  is_available: boolean
  current_task_id?: string | null
}

export interface AuditLogItem {
  id: string
  action: string
  user: string
  user_id?: string
  user_role?: string
  entity_type: string
  entity_id: string
  details: string
  timestamp: string
  previous_status?: string
  new_status?: string
  resolution_info?: string
}

export interface BlockRequest {
  id: string
  block_type: 'TRAFFIC' | 'POWER_OHE' | 'INTEGRATED' | 'SIGNAL'
  section_id: string
  section_name: string
  start_time: string
  end_time: string
  requested_duration_hours: number
  status: 'REQUESTED' | 'DRAFT' | 'PROPOSED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED'
  department: string
  purpose: string
  approving_officer: string | null
  approval_timestamp: string | null
  assigned_task_ids: string[]
  affected_train_ids: string[]
  safety_precautions: string[]
  zone?: string
  corridor?: string
}

export interface Alert {
  id: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  alert_type: 'SAFETY_RISK' | 'WINDOW_CONFLICT' | 'OVERDUE_MAINTENANCE' | 'TRAIN_DELAY'
  title: string
  message: string
  section_id: string
  zone?: string
  created_at: string
  acknowledged: boolean
}

export interface UserAccountDTO {
  id: string
  email: string
  full_name: string
  role: UserRole
  department: string
  designation: string
  division: string
  clearance: string
  permissions: string[]
  is_active: boolean
  last_login?: string
}

export interface SystemSettingsDTO {
  maintenance_window_mode: string
  auto_dispatch_kavach: boolean
  enforce_strict_headway_seconds: number
  interlocking_override_protection: boolean
  audit_retention_days: number
  solver_timeout_seconds: number
  division_code: string
  emergency_protocol_active: boolean
}

