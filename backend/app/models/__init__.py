"""RAILBLOCK AI — Models Package

Import all models here so Alembic autodiscovery picks them up.
"""
from app.models.base import Base, RailBlockBase  # noqa: F401
from app.models.user import User, UserRole  # noqa: F401
from app.models.division import Division, Route, Station, Section, SectionType  # noqa: F401
from app.models.asset import Asset, AssetStatusHistory, AssetType, AssetCondition  # noqa: F401
from app.models.maintenance import (  # noqa: F401
    MaintenanceRequest, Defect, MaintenanceHistory,
    SourceSystem, Priority, MaintenanceCategory, MaintenanceStatus,
    DefectSeverity
)
from app.models.resource import Resource, ResourceAvailability, ResourceType  # noqa: F401
from app.models.train import Train, TrainSchedule, TrainPosition, TrainType  # noqa: F401
from app.models.block import (  # noqa: F401
    BlockRequest, BlockWindow, BlockPlan, BlockPlanTask,
    BlockRequestStatus, BlockType
)
from app.models.optimization import OptimizationRun, Scenario, OptimizationStatus  # noqa: F401
from app.models.alert import Alert, Notification, AlertSeverity, AlertType  # noqa: F401
from app.models.audit import AuditLog  # noqa: F401
from app.models.data_source import (  # noqa: F401
    DataSource, DataImportRun, DataQualityIssue,
    DataSourceType, ImportRunStatus, IssueSeverity
)
