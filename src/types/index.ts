/**
 * RAILBLOCK AI — Shared TypeScript Types
 *
 * Domain types that are shared across multiple pages and components.
 * More specific types live alongside their respective feature modules.
 */

// ---------------------------------------------------------------------------
// Common
// ---------------------------------------------------------------------------

/** UUID string type alias for clarity */
export type UUID = string

/** ISO 8601 datetime string */
export type ISODateTime = string

/** API pagination metadata */
export interface PaginationMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** Paginated API response wrapper */
export interface PaginatedResponse<T> {
  items: T[]
  meta: PaginationMeta
}

// ---------------------------------------------------------------------------
// System / Health
// ---------------------------------------------------------------------------

export type ComponentStatus = 'ok' | 'degraded' | 'error' | 'disabled'

// ---------------------------------------------------------------------------
// Domain Entities (conceptual — full models in later stages)
// ---------------------------------------------------------------------------

export type UserRole =
  | 'system_admin'
  | 'divisional_engineer'
  | 'section_engineer'
  | 'maintenance_supervisor'
  | 'track_supervisor'
  | 'dispatcher'

export type AssetType =
  | 'track'
  | 'bridge'
  | 'tunnel'
  | 'signal'
  | 'level_crossing'
  | 'traction_substation'
  | 'overhead_equipment'
  | 'station'

export type MaintenanceTaskStatus =
  | 'pending'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'deferred'
  | 'cancelled'

export type BlockRequestStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'completed'
  | 'cancelled'

export type Priority = 'critical' | 'high' | 'medium' | 'low'

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export interface NavItem {
  label: string
  path: string
  icon?: string
  badge?: string | number
  children?: NavItem[]
  requiresRole?: UserRole[]
  disabled?: boolean
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------

export type ToastVariant = 'default' | 'success' | 'warning' | 'error'

export interface BreadcrumbItem {
  label: string
  path?: string
}
